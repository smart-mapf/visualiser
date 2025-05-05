import { PivotControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useQuery } from "@tanstack/react-query";
import { atom, useAtom } from "jotai";
import { button, Leva, useControls } from "leva";
import { filePicker } from "leva-file-picker";
import { min, range } from "lodash";
import { useEffect, useMemo } from "react";
import { Agent as AgentBase } from "./Agent";
import "./App.css";
import { CameraControls } from "./CameraControls";
import { Domain } from "./Domain";
import { Light } from "./Light";
import { optimiseGridMap } from "./optimiseGridMap";
import { parseMap } from "./parseMap";
import {
  lengthAtom,
  resultAtom,
  useAgentCount,
  useLength,
  useMapFile,
  useRun,
  useScenarioFile,
  useSolutionFile,
} from "./run";
import { id } from "./utils";
import {} from "@uidotdev/usehooks";
import { usePlaying } from "./play";
import { store } from "./main";

function useMap(file: File | null) {
  return useQuery({
    queryKey: ["map", id(file)],
    queryFn: async () => {
      const cells = parseMap(await file!.text());
      const b = {
        height: cells.length,
        width: cells[0].length,
      };
      return {
        file,
        items: optimiseGridMap(cells, b),
        size: b,
      };
    },
    enabled: !!file,
  });
}

function App() {
  const [mapFile, setMapFile] = useMapFile();
  const [scenarioFile, setScenarioFile] = useScenarioFile();
  const [solutionFile, setSolutionFile] = useSolutionFile();
  const agentCount = useAgentCount();
  const length = useLength();
  const { mutateAsync: run, isPending: buffering } = useRun();
  const submitDisabled = !(mapFile && scenarioFile && solutionFile);

  const [playing, setPlaying] = usePlaying();

  useControls(
    "Inputs",
    {
      map: filePicker({
        label: "Map file",
        onChange: setMapFile,
        accept: { "text/plain": [".map"] },
      }),
      scenario: filePicker({
        label: "Scenario",
        onChange: setScenarioFile,
        accept: { "text/plain": [".scen"] },
      }),
      solution: filePicker({
        label: "Solution",
        onChange: setSolutionFile,
        accept: { "text/plain": [".*"] },
      }),
      submit: {
        ...button(
          () => {
            run();
            if (autoplay) {
              set({ time: 0 });
              setPlaying(true);
            }
          },
          {
            disabled: !agentCount || submitDisabled || buffering,
          }
        ),
        label: buffering ? `Simulating (Step ${length})` : "Simulate",
      },
    },
    [submitDisabled, buffering, agentCount, length]
  );

  const [{ time, autoplay }, set, get] = useControls(
    "Playback",
    () => ({
      autoplay: { value: true, label: "Autoplay" },
      time: {
        value: 0,
        min: 0,
        max: length,
        step: 1,
        label: "Time",
        disabled: !length,
      },
      speed: {
        value: 1,
        min: 1,
        max: 20,
        step: 1,
        label: "Playback speed",
      },
      play: {
        ...button(() => setPlaying(!playing), { disabled: !length }),
        label: playing ? "Pause" : "Play",
      },
    }),
    [length, playing]
  );

  useEffect(() => {
    if (playing) {
      const interval = setInterval(() => {
        if (!buffering && get("time") === store.get(lengthAtom)) {
          setPlaying(false);
          return;
        }
        set({
          time: min([get("time") + get("speed"), store.get(lengthAtom)]) ?? 0,
        });
      }, 1000 / 10);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, buffering]);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Leva
        theme={{
          fontSizes: { root: "12px" },
          space: { rowGap: "8px" },
          sizes: {
            folderTitleHeight: "32px",
            numberInputMinWidth: "90px",
            rowHeight: "32px",
            rootWidth: "400px",
            controlWidth: "240px",
          },
          fonts: {
            mono: "Geist Mono",
          },
        }}
      />
      <Stage time={time} />
    </div>
  );
}

function Stage({ time = 0 }: { time?: number }) {
  const [mapFile] = useMapFile();
  const { data: map } = useMap(mapFile);
  const agentCount = useAgentCount();

  return (
    <Canvas
      shadows
      camera={{
        position: [0, 5, 10],
      }}
    >
      <fog attach="fog" args={["#111", 0, 400]} />
      <color attach="background" args={["#111"]} />
      <CameraControls />
      <PivotControls />
      <ambientLight intensity={Math.PI / 2} />
      <Light />
      <Domain {...map} key={id(map?.file)}>
        {range(agentCount).map((i) => (
          <Agent i={i} key={i} time={time} />
        ))}
      </Domain>
    </Canvas>
  );
}

function Agent({ i, time }: { i: number; time: number }) {
  const pathsAtom = useMemo(
    () =>
      atom((read) =>
        read(resultAtom)
          ?.map?.((p) => p.agents[i])
          ?.filter?.((p) => p)
      ),
    [i]
  );
  const length = useLength();
  const [path] = useAtom(pathsAtom);
  return <AgentBase key={i} path={path} time={min([length, time])} />;
}

export default App;
