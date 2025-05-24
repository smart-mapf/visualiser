import { Sky } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { CameraControls } from "./CameraControls";
import { Contents } from "./Contents";
import { Light } from "./Light";
import { ACESFilmicToneMapping } from "three";

export function Stage() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{
        antialias: false,
        powerPreference: "high-performance",
        toneMapping: ACESFilmicToneMapping,
      }}
      camera={{
        position: [0, 5, 10],
      }}
    >
      <fog attach="fog" args={["#eff2f3", 0, 200]} />
      <color attach="background" args={["#afc3cc"]} />
      <Light />
      <Sky inclination={0.52} sunPosition={[100, 100, 50]} />
      <CameraControls />
      <Contents />
    </Canvas>
  );
}
