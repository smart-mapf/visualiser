import { Mutex } from "async-mutex";
import { clear, get, set } from "idb-keyval";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { clamp, keys, zip } from "lodash";
import { useEffect, useMemo, useState } from "react";
import { useRafLoop } from "react-use";
import { AdgProgress, Step } from "smart";
import { lerp, lerpRadians } from "utils";

const CHUNK_SIZE = 512;

type Item = {
  state: Step;
  adg?: AdgProgress;
};

export const timeAtom = atom<number>(0);
export const useTime = () => useAtom(timeAtom);

export const timeSmoothAtom = atom<number>(0);
export const useTimeSmooth = () => useAtom(timeSmoothAtom);

export const chunkMapAtom = atom<Record<number, Item[]>>({});

function lerpItems(a: Item, b: Item, t: number): Item {
  return {
    state: {
      clock: lerp(a.state.clock, b.state.clock, t),
      agents: zip(a.state.agents, b.state.agents).map(([a, b]) => ({
        ...a!,
        x: lerp(a!.x, b!.x, t),
        y: lerp(a!.y, b!.y, t),
        z: lerp(a!.z, b!.z, t),
        rx: lerpRadians(a!.rx, b!.rx, t),
        ry: lerpRadians(a!.ry, b!.ry, t),
        rz: lerpRadians(a!.rz, b!.rz, t),
      })),
      type: "tick",
    },
    adg: b.adg ?? a.adg,
  };
}

// Atom to get interpolated item
export const currentItemAtom = atom<Item | null>((get) => {
  const t = get(timeSmoothAtom);
  const i0 = Math.floor(t);
  const i1 = Math.ceil(t);
  const alpha = t - i0;

  const chunkMap = get(chunkMapAtom);
  const c0 = Math.floor(i0 / CHUNK_SIZE);
  const c1 = Math.floor(i1 / CHUNK_SIZE);

  const chunk0 = chunkMap[c0];
  const chunk1 = chunkMap[c1];

  const item0 = chunk0?.[i0 % CHUNK_SIZE];
  const item1 = chunk1?.[i1 % CHUNK_SIZE];

  if (!item0 || !item1) return null;

  return lerpItems(item0, item1, alpha);
});

export function usePreviousDefined<T>(t?: T) {
  const [prev, setPrev] = useState(t);
  useEffect(() => {
    if (t) setPrev(t);
  }, [t]);
  return prev;
}

export const useAgentPosition = (i: number) => {
  const v1 = useAtomValue(
    useMemo(
      () =>
        atom((get) => {
          const a = get(currentItemAtom);
          if (!a) return;
          const agent = a.state.agents[i];
          return {
            constraints: a.adg?.constraints?.[i]?.constraining_agent,
            position: [agent.x + 0.5, 0, -agent.y - 0.5] as const,
            rotation: [0, agent.rz, 0] as const,
          };
        }),
      [i]
    )
  );
  const v2 = usePreviousDefined(v1);
  return v2;
};

const cache = new Map<number, Item[]>();

// Load chunk by index
async function loadChunk(chunkIndex: number): Promise<Item[]> {
  return cache.get(chunkIndex) ?? (await get(chunkIndex)) ?? [];
}

async function finaliseChunk(chunkIndex: number) {
  const data = await loadChunk(chunkIndex);
  await set(chunkIndex, data);
  cache.delete(chunkIndex);
}

// Save chunk to IndexedDB
function saveChunk(chunkIndex: number, data: Item[]) {
  cache.set(chunkIndex, data);
}

// Atom to sync chunks around t
export const syncChunksAtom = atom<null, never[], unknown>(
  null,
  async (get, set) => {
    const t = get(timeSmoothAtom);
    const i0 = Math.floor(t);
    const i1 = Math.ceil(t);
    const currentChunks = get(chunkMapAtom);

    const requiredChunks = new Set([
      Math.floor(i0 / CHUNK_SIZE),
      Math.floor(i1 / CHUNK_SIZE),
      Math.floor(i1 / CHUNK_SIZE + 1),
      clamp(Math.floor(i0 / CHUNK_SIZE - 1), 0, Infinity),
    ]);

    const updatedChunks: Record<number, Item[]> = { ...currentChunks };
    let changed = false;

    for (const chunkIndex of requiredChunks) {
      if (!updatedChunks[chunkIndex]) {
        updatedChunks[chunkIndex] = await loadChunk(chunkIndex);
        changed = true;
      }
    }

    for (const chunk of keys(updatedChunks)) {
      if (!requiredChunks.has(+chunk)) {
        delete updatedChunks[+chunk];
        changed = true;
      }
    }

    if (changed) {
      set(chunkMapAtom, updatedChunks);
    }
  }
);

const m = new Mutex();

// Append item
export const appendAtom = atom<null, [Item], unknown>(
  null,
  (get, set, newItem) => {
    const t = get(lengthAtom);
    const chunkIndex = Math.floor(t / CHUNK_SIZE);
    // Don't wait for this to complete
    m.runExclusive(async () => {
      const chunk = await loadChunk(chunkIndex);
      chunk.push(newItem);
      saveChunk(chunkIndex, chunk);
      set(chunkMapAtom, (l) => ({ ...l, [chunkIndex]: chunk }));
      if (chunk.length === CHUNK_SIZE) {
        await finaliseChunk(chunkIndex);
      }
      set(syncChunksAtom);
      set(timespanAtom, newItem.state.clock);
    }, 1);
    set(lengthAtom, (l) => l + 1);
  }
);

// Clear all
export const clearAtom = atom<null, never[], unknown>(null, (_get, set) => {
  // Don't wait for this to complete
  m.runExclusive(async () => {
    await clear();
  }, 0);
  set(chunkMapAtom, {});
  set(timeAtom, 0);
  set(lengthAtom, 0);
  set(timespanAtom, 0);
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
  const time = useAtomValue(timeSmoothAtom);
  const syncChunks = useSetAtom(syncChunksAtom);
  useEffect(() => {
    syncChunks();
  }, [time, syncChunks]);
}

export function useTimeSmoothService() {
  const [time] = useTime();
  const set = useSetAtom(timeSmoothAtom);
  useRafLoop(() => {
    set((t) => lerp(t, time, 0.05));
  });
}

export function Service() {
  useAutoSyncChunks();
  useTimeSmoothService();
  return null;
}
