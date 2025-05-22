import { useMutation, useQuery } from "@tanstack/react-query";
import { Mutex } from "async-mutex";
import { client } from "client/trpc";
import { atom, useAtom, useSetAtom } from "jotai";
import { identity, trim } from "lodash";
import { AdgProgress } from "smart";
import { id } from "utils";
import { appendAtom, clearAtom } from "./store";

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

// ─── Run ─────────────────────────────────────────────────────────────────────

const mutex = new Mutex();

export function useRun() {
  const [mapFile] = useAtom(mapFileAtom);
  const [scenarioFile] = useAtom(scenarioFileAtom);
  const [solutionFile] = useAtom(solutionFileAtom);
  const { data: contents } = useSolutionContents();
  const append = useSetAtom(appendAtom);
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
        let adg: AdgProgress | undefined = undefined;
        return await new Promise<void>((res, rej) => {
          clear();
          const s = client.run.subscribe(options, {
            onData: (data) => {
              if ("type" in data) {
                switch (data.type) {
                  case "adg_progress":
                    adg = data;
                    break;
                  case "tick":
                    append({ state: data, adg });
                    break;
                  case "error":
                    console.error(data.error);
                    rej(data.error);
                    break;
                }
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
