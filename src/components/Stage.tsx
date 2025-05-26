import { GizmoHelper, GizmoViewport } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping } from "three";
import { CameraControls } from "./CameraControls";
import { Contents } from "./Contents";
import { Light } from "./Light";

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
      <fog attach="fog" args={["#181c20", 20, 100]} />
      <color attach="background" args={["#181c20"]} />
      <Light />
      {/* <Sky inclination={0.52} sunPosition={[100, 100, 50]} /> */}
      <CameraControls />
      <Contents />
      <GizmoHelper alignment="bottom-left">
        <GizmoViewport />
      </GizmoHelper>
    </Canvas>
  );
}
