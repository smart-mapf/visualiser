import { useMutation, useQuery } from "@tanstack/react-query";
import { Mutex } from "async-mutex";
import { client } from "client/trpc";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  identity,
  isArray,
  isNumber,
  omit,
  pick,
  range,
  slice,
  throttle,
  trim,
} from "lodash";
import { useRef } from "react";
import { Output } from "smart";
import { id } from "utils";
import { appendAtom, clearAtom, logAtom, State, statsAtom } from "./state";

// ─── Input State ─────────────────────────────────────────────────────────────

export const mapFileAtom = atom<File | null>(null);
export const scenarioFileAtom = atom<File | null>(null);
export const solutionFileAtom = atom<File | null>(null);

export const useMapFile = () => useAtom(mapFileAtom);
export const useScenarioFile = () => useAtom(scenarioFileAtom);
export const useSolutionFile = () => useAtom(solutionFileAtom);

export const flipAtom = atom<boolean>(false);
export const useFlip = () => useAtom(flipAtom);

export const maxSpeedAtom = atom<number>(500);
export const useMaxSpeed = () => useAtom(maxSpeedAtom);

export const accelerationAtom = atom<number>(10);
export const useAcceleration = () => useAtom(accelerationAtom);

export const angularMaxSpeedAtom = atom<number>(7.5);
export const useAngularMaxSpeed = () => useAtom(angularMaxSpeedAtom);

export const angularAccelerationAtom = atom<number>(3.0);
export const useAngularAcceleration = () => useAtom(angularAccelerationAtom);

// ─── Computed ────────────────────────────────────────────────────────────────

export function useSolutionContents() {
  const [file] = useSolutionFile();
  const [flip] = useFlip();
  return useQuery({
    queryKey: ["solution", id(file), flip],
    queryFn: async () => {
      if (!file) return null;
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
            return flip ? { x: +x, y: +y } : { x: +y, y: +x };
          });
        }),
      };
    },
  });
}

// ─── Run ─────────────────────────────────────────────────────────────────────

export const bufferingAtom = atom<boolean>(false);
export const useBuffering = () => useAtomValue(bufferingAtom);

const mutex = new Mutex();

export function useRun() {
  const [mapFile] = useAtom(mapFileAtom);
  const [scenarioFile] = useAtom(scenarioFileAtom);
  const [solutionFile] = useAtom(solutionFileAtom);
  const [flip] = useFlip();
  const [maxSpeed] = useAtom(maxSpeedAtom);
  const [acceleration] = useAtom(accelerationAtom);
  const [angularMaxSpeed] = useAtom(angularMaxSpeedAtom);
  const [angularAcceleration] = useAtom(angularAccelerationAtom);
  const { data: contents } = useSolutionContents();
  const append = useSetAtom(appendAtom);
  const clear = useSetAtom(clearAtom);
  const setStats = useSetAtom(statsAtom);
  const setLog = useSetAtom(logAtom);
  const abort = useRef<() => void | null>();
  const setBuffering = useSetAtom(bufferingAtom);
  return {
    abort,
    mutation: useMutation({
      mutationFn: () =>
        mutex.runExclusive(async () => {
          if (!mapFile || !scenarioFile || !solutionFile || !contents?.count)
            return;
          setBuffering(true);
          const controller = new AbortController();

          // ─── Options ──────────────────────────

          const options = {
            agents: contents.count,
            map: await mapFile.text(),
            scen: await scenarioFile.text(),
            paths: await solutionFile.text(),
            flipXY: flip,
            acceleration,
            maxSpeed,
            angularMaxSpeed,
            angularAcceleration,
          };

          // ─── Commit ──────────────────────────

          let actions: State[] = [];
          const f = throttle(
            () => {
              if (controller.signal.aborted) return;
              append(actions);
              actions = [];
            },
            1500,
            { trailing: true, leading: false }
          );

          // ─── State ───────────────────────────

          const agentState: State["agentState"] = {};
          const progress: State["progress"] = {};
          let adg: State["adg"] = undefined;
          let prev: State["step"] | undefined = undefined;

          // ─────────────────────────────────────

          return await new Promise<void>((res, rej) => {
            abort.current = () => {
              controller.abort();
              s.unsubscribe();
              rej({ message: "Cancelled" });
            };
            clear();
            const s = client.run.subscribe(options, {
              // Dodgy server sometimes outputs second option
              onData: (
                a: { data: Output[]; id: string } | [string, Output[], null]
              ) => {
                const data = isArray(a) ? a[1] : a.data;
                for (const d of data) {
                  if ("type" in d) {
                    switch (d.type) {
                      case "state_change":
                        if (isNumber(d.agent)) {
                          agentState[d.agent] = d.value;
                        } else {
                          range(contents.count).forEach((i) => {
                            agentState[i] = d.value;
                          });
                        }
                        break;
                      case "message":
                        setLog((t) => slice([...t, d.content], -100));
                        break;
                      case "adg_error":
                        setLog((t) => [...t, `ADG Error: ${d.info}`]);
                        break;
                      case "adg_progress":
                        adg = d;
                        break;
                      case "tick":
                        actions.push({
                          step: d,
                          adg,
                          agentState: structuredClone(agentState),
                          progress: structuredClone(progress),
                        });
                        f();
                        prev = d;
                        break;
                      case "exec_progress":
                        progress[d.agent] = pick(d, "finished", "total");
                        break;
                      case "stats":
                        setStats(omit(d, "type"));
                        break;
                      case "error":
                        console.error(d.error);
                        rej(d.error);
                        break;
                    }
                  }
                }
              },
              signal: controller.signal,
              onError: (error) => {
                console.error(error);
                s.unsubscribe();
                rej(error);
              },
              onComplete: () => {
                if (prev) {
                  actions.push({
                    step: prev,
                    adg,
                    agentState: structuredClone(agentState),
                    progress: structuredClone(progress),
                  });
                }
                s.unsubscribe();
                res();
              },
            });
          });
        }),
      onSettled: () => setBuffering(false),
      mutationKey: [
        "run",
        contents?.count,
        id(mapFile),
        id(scenarioFile),
        id(solutionFile),
      ],
    }),
  };
}
