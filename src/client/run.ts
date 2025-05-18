import { useMutation, useQuery } from "@tanstack/react-query";
import { Mutex } from "async-mutex";
import { client } from "client/trpc";
import { atom, useAtom, useSetAtom } from "jotai";
import { identity, last, range, trim } from "lodash";
import { AdgProgress, Step } from "smart";
import { id, lerp, lerpRadians } from "utils";

// ─── Input State ─────────────────────────────────────────────────────────────

export const mapFileAtom = atom<File | null>(null);
export const scenarioFileAtom = atom<File | null>(null);
export const solutionFileAtom = atom<File | null>(null);

export const useMapFile = () => useAtom(mapFileAtom);
export const useScenarioFile = () => useAtom(scenarioFileAtom);
export const useSolutionFile = () => useAtom(solutionFileAtom);

// ─── Computed ────────────────────────────────────────────────────────────────

export function useSolutionContents() {
  const [file] = useSolutionFile();
  return useQuery({
    queryKey: ["solution", id(file)],
    queryFn: async () => {
      if (!file) return;
      const text = await file.text();
      const lines = trim(text).split("\n");
      return {
        text,
        count: lines.length,
        paths: lines.map((l) => {
          const [, p] = l.split(":");
          const pairs = p.split("->");
          return pairs.filter(identity).map((p) => {
            const [x, y] = trim(p, "()").split(",");
            return { x: +x, y: +y };
          });
        }),
      };
    },
    enabled: !!file,
  });
}

export const constraintAtom = atom<AdgProgress[]>([]);

export const appendConstraintAtom = atom(
  null,
  (get, set, update: AdgProgress) => {
    set(constraintAtom, [...get(constraintAtom), update]);
  }
);

export const constraintByStep = (id: number, i: number) =>
  atom((get) => {
    const constraints = get(constraintAtom);
    return (i >= constraints.length ? last(constraints) : constraints[i])
      ?.constraints?.[id];
  });

export const resultAtom = atom<Step[]>([]);

export const appendAtom = atom(null, (get, set, update: Step) => {
  const previous = get(resultAtom);
  if (previous.length) {
    const tail = last(previous)!;
    set(resultAtom, [
      ...previous,
      ...range(tail.clock + 1, update.clock).map((i) => {
        const progress = (i - tail.clock) / (update.clock - tail.clock);
        return {
          type: "tick" as const,
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
  const { data: contents } = useSolutionContents();
  const append = useSetAtom(appendAtom);
  const appendConstraint = useSetAtom(appendConstraintAtom);
  const clear = useSetAtom(clearAtom);
  return useMutation({
    mutationFn: () =>
      mutex.runExclusive(async () => {
        if (!mapFile || !scenarioFile || !solutionFile || !contents?.count)
          return;
        const options = {
          agents: contents.count,
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
              if ("type" in data && data.type === "adg_progress") {
                appendConstraint(data);
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
      contents?.count,
      id(mapFile),
      id(scenarioFile),
      id(solutionFile),
    ],
  });
}
