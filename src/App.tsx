import { PivotControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useQuery } from "@tanstack/react-query";
import { Leva, useControls } from "leva";
import { chain, head, keys, max } from "lodash";
import { Agent } from "./Agent";
import paths from "./paths.json";
import "./App.css";
import { CameraControls } from "./CameraControls";
import { Domain } from "./Domain";
import { optimiseGridMap } from "./optimiseGridMap";
import { parseMap } from "./parseMap";
import { Light } from "./Light";

const length = max(paths.map((p) => p.length)) ?? 0;

const basename = (path: string) => {
  const parts = path.split("/");
  return parts[parts.length - 1];
};

const maps = import.meta.glob("/**/maps/*.map", {
  query: "?url",
  import: "default",
}) as Record<string, () => Promise<string>>;

function useMap(url: string) {
  return useQuery({
    queryKey: ["map", url],
    queryFn: async () => {
      const cells = parseMap(await (await fetch(url)).text());
      const b = {
        height: cells.length,
        width: cells[0].length,
      };
      return {
        url,
        items: optimiseGridMap(cells, b),
        size: b,
      };
    },
  });
}

function App() {
  const controls = useControls({
    map: {
      options: chain(maps)
        .keys()
        .map((k) => [basename(k), k] as const)
        .fromPairs()
        .value(),
      value: head(keys(maps)),
    },
    time: { value: 0, min: 0, max: length, step: 1 },
  });
  const { data: map } = useMap(controls.map!);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Leva
        theme={{
          sizes: {
            rootWidth: "400px",
            controlWidth: "300px",
          },

          fonts: {
            mono: "Geist Mono",
          },
          fontSizes: {
            root: "14px",
          },
        }}
      />
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
        <Domain key={map?.url} {...map}>
          {paths.map((path, i) => (
            <Agent key={i} path={path} time={controls.time} />
          ))}
        </Domain>
      </Canvas>
    </div>
  );
}

export default App;
