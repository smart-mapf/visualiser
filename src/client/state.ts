import { useFrame } from "@react-three/fiber";
import { Mutex } from "async-mutex";
import { clear, get, set } from "idb-keyval";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { selectAtom } from "jotai/utils";
import {
  each,
  floor,
  fromPairs,
  isEqual,
  isUndefined,
  round,
  throttle,
  thru,
  zip,
} from "lodash";
import { store } from "store";
import { useEffect, useMemo, useState } from "react";
import { useEffectOnce } from "react-use";
import { AdgProgress, StateChange, Step } from "smart";
import { lerp, lerpRadians } from "utils";
import { useSpeed } from "./play";
import { selectionAtom } from "./selection";
import { useSolutionContents } from "./run";

const CHUNK_SIZE = 256;

export type State = {
  state: Step;
  adg?: AdgProgress;
  agentState?: Record<number, StateChange["value"]>;
};

export const logAtom = atom<string[]>([]);
export const useLog = () => useAtom(logAtom);

export const timeAtom = atom<number>(0);
export const useTime = () => useAtom(timeAtom);

export const timeSmoothAtom = atom<number>(0);
export const useTimeSmooth = () => useAtom(timeSmoothAtom);

export const roundedTimeSmoothAtom = selectAtom(timeSmoothAtom, (v) =>
  round(v)
);

const currentCacheSetAtom = selectAtom(
  timeAtom,
  (t) => {
    const t0 = floor(t / CHUNK_SIZE);
    return [t0 - 1, t0, t0 + 1].filter((i) => i >= 0);
  },
  isEqual
);

const cache: Record<number, { length: number; state: State[] }> = {};

const cacheAtom = atom<
  Record<number, { source: "cache" | "storage"; state: State[] }>
>({});

const setCacheAtom = atom(null, async (get, set) => {
  const prev = get(cacheAtom);
  const cs = get(currentCacheSetAtom);
  const load = async (i: number) => {
    const p = prev[i];
    if (p && p.source === "storage" && p.state.length) return p;
    const c = cache[i];
    if (c) return { source: "cache" as const, state: c.state };
    return {
      source: "storage" as const,
      state: await loadChunkFromDisk(i),
    };
  };
  set(
    cacheAtom,
    fromPairs(await Promise.all(cs.map(async (c) => [c, await load(c)])))
  );
});

// Atom to get interpolated item
export const currentItemAtom = atom<State | null>((get) => {
  const t = get(roundedTimeSmoothAtom);
  return get(cacheAtom)[floor(t / CHUNK_SIZE)]?.state?.[t % CHUNK_SIZE];
});

export function usePreviousDefined<T>(t?: T) {
  const [prev, setPrev] = useState(t);
  useEffect(() => {
    if (t) setPrev(t);
  }, [t]);
  return { value: prev, current: t, isPrevious: isUndefined(t) && prev === t };
}

const alpha = (n: number) => 0.1 - 1 / (0.1 * n + 1) + 1;

export const useAgentInfo = (i: number) => {
  const { data: solution } = useSolutionContents();
  const initial = useMemo(
    () => ({
      state: "unknown",
      position: thru(
        solution?.paths?.[i]?.[0],
        (a) => [-(a?.x ?? 0) + 0.5, 0, (a?.y ?? 0) - 0.5] as const
      ),
      rotation: [0, 0, 0] as const,
      constraints: [],
      id: i,
    }),
    [solution?.paths, i]
  );
  const v1 = useAtomValue(
    useMemo(
      () =>
        atom((get) => {
          const a = get(currentItemAtom);
          const agent = a?.state?.agents?.[i];
          if (!agent) return;
          return {
            id: i,
            state: a.agentState?.[i],
            constraints: a.adg?.constraints?.[i]?.constraining_agent,
            position: [agent.x + 0.5, 0, -agent.y - 0.5] as [
              number,
              number,
              number
            ],
            rotation: [0, agent.rz, 0] as [number, number, number],
          };
        }),
      [i]
    )
  );
  const previous = usePreviousDefined(v1 || initial);
  return !v1
    ? {
        value: { ...previous.value!, state: "unknown" },
        isPrevious: true,
      }
    : previous;
};

function dist(a: [number, number, number], b: [number, number, number]) {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
  );
}

export const useAgentPosition = (i: number) => {
  const { value: v0, isPrevious } = useAgentInfo(i);
  const [speed] = useSpeed();
  const [current, setCurrent] = useState(v0);
  useFrame(() => {
    if (v0) {
      setCurrent((p) => {
        if (p) {
          // Teleport if too far away
          if (dist(p.position, v0.position) > 0.5) return v0;
          return {
            id: v0.id,
            state: v0.state,
            constraints: v0.constraints,
            position: zip(p.position, v0.position).map(([a, b]) =>
              lerp(a!, b!, alpha(speed))
            ) as [number, number, number],
            rotation: zip(p.rotation, v0.rotation).map(([a, b]) =>
              lerpRadians(a!, b!, alpha(speed))
            ) as [number, number, number],
          };
        }
        return v0;
      });
    }
  });
  return { current, isPrevious };
};

// Load chunk by index
async function loadChunkFromDisk(i: number): Promise<State[]> {
  console.log("load chunk from disk", i);
  const r = await get(i);
  console.log("loaded chunk from disk", i, r?.length);
  return r ?? [];
}

async function finaliseChunk(i: number, data: State[]) {
  console.log("finalise", i, data.length);
  await set(i, data);
  console.log("finalise done", i, data.length);
}

const m = new Mutex();

// Append item
export const appendAtom = atom<null, [State[]], unknown>(
  null,
  (_get, set, items) => {
    for (const item of items) {
      const i = floor(item.state.clock / CHUNK_SIZE);
      const chunk = cache[i] ?? { length: 0, state: [] };
      chunk.state[item.state.clock % CHUNK_SIZE] = item;
      chunk.length++;
      cache[i] = chunk;
      if (chunk.length === CHUNK_SIZE) {
        delete cache[i];
        // Don't wait for this to complete
        finaliseChunk(i, chunk.state);
      }
    }
    set(timespanAtom, (t) => t + items.length);
    set(lengthAtom, (l) => l + items.length);
  }
);

// Clear all
export const clearAtom = atom<null, never[], unknown>(null, (_get, set) => {
  // Don't wait for this to complete
  m.runExclusive(async () => {
    each(cache, (v, k) => {
      delete cache[+k];
    });
    set(cacheAtom, {});
    set(timeAtom, 0);
    set(selectionAtom, new Set());
    set(lengthAtom, 0);
    set(timespanAtom, 0);
    await clear();
    await set(setCacheAtom);
  }, 0);
});

export const useAppend = () => {
  const [, append] = useAtom(appendAtom);
  return append;
};

export const useClear = () => {
  const [, clear] = useAtom(clearAtom);
  return clear;
};

export const timespanAtom = atom(0);

export const useTimespan = () => {
  const [timespan] = useAtom(timespanAtom);
  return timespan;
};

export const lengthAtom = atom(0);

export const useLength = () => {
  const [length] = useAtom(lengthAtom);
  return length;
};

export function useAutoSyncChunks() {
  const time = useAtomValue(timeAtom);
  const length = useAtomValue(lengthAtom);
  const setCache = useSetAtom(setCacheAtom);
  const c = useMemo(() => {
    let running = false;
    return async () => {
      if (running) return;
      running = true;
      await setCache();
      running = false;
    };
  }, [setCache]);
  const b = useMemo(
    () =>
      throttle(
        () => {
          c();
        },
        1000 / 15,
        { trailing: true, leading: false }
      ),
    [c]
  );
  useEffect(() => {
    b();
  }, [length, time, b]);
}

export function useTimeSmoothService() {
  useEffect(() => {
    let a: number;
    const f = () => {
      store.set(timeSmoothAtom, (t) => lerp(t, store.get(timeAtom), 0.05));
      a = requestAnimationFrame(f);
    };
    f();
    return () => {
      cancelAnimationFrame(a);
    };
  });
}

export function useReset() {
  const clear = useSetAtom(clearAtom);
  useEffectOnce(() => {
    clear();
  });
}

export function Service() {
  useReset();
  useAutoSyncChunks();
  useTimeSmoothService();
  return null;
}
