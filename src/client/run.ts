import { useMutation } from "@tanstack/react-query";
import { Mutex } from "async-mutex";
import { atom, useAtom } from "jotai";
import { identity, last, range, trim } from "lodash";
import { Step } from "smart";
import { client } from "client/trpc";
import { id, lerp, lerpRadians } from "utils";

// ─── Input State ─────────────────────────────────────────────────────────────

export const mapFileAtom = atom<File | null>(null);
export const scenarioFileAtom = atom<File | null>(null);
export const solutionFileAtom = atom<File | null>(null);

export const useMapFile = () => useAtom(mapFileAtom);
export const useScenarioFile = () => useAtom(scenarioFileAtom);
export const useSolutionFile = () => useAtom(solutionFileAtom);

// ─── Computed ────────────────────────────────────────────────────────────────

export const solutionContentsAtom = atom(async (get) => {
  const a = get(solutionFileAtom);
  if (!a) return "";
  return await a.text();
});

export const agentCountAtom = atom(async (get) => {
  const text = await get(solutionContentsAtom);
  return trim(text).split("\n").length;
});

export const pathsAtom = atom(async (get) => {
  const text = await get(solutionContentsAtom);
  const lines = trim(text).split("\n");
  if (!text) return [];
  return lines.map((l) => {
    const [, p] = l.split(":");
    const pairs = p.split("->");
    return pairs.filter(identity).map((p) => {
      const [x, y] = trim(p, "()").split(",");
      return { x: +x, y: +y };
    });
  });
});

export const useAgentCount = () => {
  const [agentCount] = useAtom(agentCountAtom);
  return agentCount;
};

export const resultAtom = atom<Step[]>([]);

export const appendAtom = atom(null, (get, set, update: Step) => {
  const previous = get(resultAtom);
  if (previous.length) {
    const tail = last(previous)!;
    return set(resultAtom, [
      ...previous,
      ...range(tail.clock + 1, update.clock).map((i) => {
        const progress = (i - tail.clock) / (update.clock - tail.clock);
        return {
          clock: i,
          agents: tail.agents.map((a, j) => ({
            ...a,
            x: lerp(a.x, update.agents[j].x, progress),
            y: lerp(a.y, update.agents[j].y, progress),
            z: lerp(a.z, update.agents[j].z, progress),
            rx: lerpRadians(a.rx, update.agents[j].rx, progress),
            ry: lerpRadians(a.ry, update.agents[j].ry, progress),
            rz: lerpRadians(a.rz, update.agents[j].rz, progress),
          })),
        };
      }),
      update,
    ]);
  } else {
    return set(resultAtom, [update]);
  }
});

export const useAppend = () => {
  const [, append] = useAtom(appendAtom);
  return append;
};

export const clearAtom = atom(null, (_, set) => {
  set(resultAtom, []);
});
export const useClear = () => {
  const [, clear] = useAtom(clearAtom);
  return clear;
};

export const timespanAtom = atom((get) => {
  const l = last(get(resultAtom));
  if (!l) return 0;
  return l.clock;
});
export const useTimespan = () => {
  const [timespan] = useAtom(timespanAtom);
  return timespan;
};

export const lengthAtom = atom((get) => get(resultAtom).length);
export const useLength = () => {
  const [length] = useAtom(lengthAtom);
  return length;
};

// ─── Run ─────────────────────────────────────────────────────────────────────

const mutex = new Mutex();

export function useRun() {
  const [mapFile] = useAtom(mapFileAtom);
  const [scenarioFile] = useAtom(scenarioFileAtom);
  const [solutionFile] = useAtom(solutionFileAtom);
  const agentCount = useAgentCount();
  const [, append] = useAtom(appendAtom);
  const [, clear] = useAtom(clearAtom);
  return useMutation({
    mutationFn: () =>
      mutex.runExclusive(async () => {
        if (!mapFile || !scenarioFile || !solutionFile || !agentCount) return;
        const options = {
          agents: agentCount,
          map: await mapFile.text(),
          scen: await scenarioFile.text(),
          paths: await solutionFile.text(),
        };
        return await new Promise<void>((res, rej) => {
          clear();
          const s = client.run.subscribe(options, {
            onData: (data) => {
              if ("error" in data) {
                console.error(data.error);
                rej(data.error);
              }
              if ("clock" in data) {
                append(data);
              }
            },
            onError: (error) => {
              console.error(error);
              rej(error);
            },
            onComplete: () => {
              s.unsubscribe();
              res();
            },
          });
        });
      }),
    mutationKey: [
      "run",
      agentCount,
      id(mapFile),
      id(scenarioFile),
      id(solutionFile),
    ],
  });
}
