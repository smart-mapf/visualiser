import {
  Instance,
  InstanceProps,
  Instances,
  Line,
  PivotControls,
  useGLTF,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useQuery } from "@tanstack/react-query";
import {} from "@uidotdev/usehooks";
import { atom, useAtom, useAtomValue } from "jotai";
import { selectAtom } from "jotai/utils";
import { button, Leva, useControls } from "leva";
import { filePicker } from "leva-file-picker";
import {
  clamp,
  floor,
  isEqual,
  max,
  min,
  now,
  range,
  round,
  thru,
  values,
} from "lodash";
import { useEffect, useMemo, useState } from "react";
import { useBoolean, useRafLoop } from "react-use";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import "./App.css";
import { CameraControls } from "./CameraControls";
import { Domain } from "./Domain";
import { Light } from "./Light";
import { store } from "./main";
import { optimiseGridMap } from "./optimiseGridMap";
import { parseMap } from "./parseMap";
import { usePlaying } from "./play";
import {
  lengthAtom,
  pathsAtom,
  resultAtom,
  useAgentCount,
  useLength,
  useMapFile,
  useRun,
  useScenarioFile,
  useSolutionFile,
} from "./run";
import { id, lerp, lerpRadians } from "./utils";

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
      const frame = 1000 / 10;
      let ta = now();
      const interval = setInterval(() => {
        const tb = now();
        if (!buffering && get("time") === store.get(lengthAtom)) {
          setPlaying(false);
          return;
        }
        set({
          time:
            min([
              get("time") + max([1, get("speed") * round((tb - ta) / frame)])!,
              store.get(lengthAtom),
            ]) ?? 0,
        });
        ta = tb;
      }, frame);
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

  const [t, setT] = useState(time);
  useRafLoop(() => {
    setT(lerp(t, time, 0.1));
  });

  const g = useModel();

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
        <Instances castShadow frustumCulled={false} geometry={g}>
          <meshStandardMaterial color="white" />
          {range(agentCount).map((i) => (
            <group position={[0, 0.1, 0]}>
              <Agent i={i} key={i} time={t} scale={3} />
            </group>
          ))}
        </Instances>
      </Domain>
    </Canvas>
  );
}

function useModel() {
  const { meshes: high } = useGLTF("./robot-low.gltf");

  return useMemo(
    () => mergeGeometries(values(high).map((h) => h.geometry)),
    [high]
  );
}

const nearAtom = (i: number, time: number) =>
  selectAtom(
    resultAtom,
    (result) => {
      if (!result.length) return undefined;
      const high = result.length - 1;
      const j = clamp(floor(time), 0, high);
      const k = clamp(floor(time) + 1, 0, high);
      const current = result[j].agents[i];
      const next = result[k].agents[i];
      return [current, next] as const;
    },
    isEqual
  );

function Agent({
  i,
  time,
  ...props
}: { i: number; time: number } & InstanceProps) {
  const [selected, toggleSelected] = useBoolean(false);
  const [hovered, toggleHovered] = useBoolean(false);
  const time1 = floor(time);
  const nearAtom1 = useMemo(() => nearAtom(i, time1), [i, time1]);
  const pathAtom1 = useMemo(
    () => atom(async (get) => (await get(pathsAtom))[i]),
    [i]
  );
  const [pos1] = useAtom(nearAtom1);
  const path = useAtomValue(pathAtom1);
  if (!pos1) return undefined;

  const [current, next] = pos1;

  const waiting = current.x === next.x && current.y === next.y;

  const pos = thru(time, (x) => {
    const p = x - floor(x);
    return [
      lerp(current.x + 0.5, next.x + 0.5, p),
      0,
      -lerp(current.y + 0.5, next.y + 0.5, p),
    ] as const;
  });

  const rotation = thru(time, (x) => {
    const p = x - floor(x);
    return [0, lerpRadians(current.rz, next.rz, p), 0] as const;
  });

  return (
    <>
      <Instance
        position={pos}
        rotation={rotation}
        {...props}
        onClick={() => {
          toggleSelected();
        }}
        onPointerOver={() => toggleHovered(true)}
        onPointerOut={() => toggleHovered(false)}
        color={
          selected ? "hotpink" : hovered ? "red" : waiting ? "grey" : "white"
        }
      />
      <Line
        color={selected ? "hotpink" : hovered ? "red" : "black"}
        points={path.map((p) => [-p.x + 0.5, 0, p.y - 0.5] as const)}
      />
    </>
  );
}

export default App;
