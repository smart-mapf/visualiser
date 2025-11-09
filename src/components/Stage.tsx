import { GizmoHelper, GizmoViewport } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, NeutralToneMapping } from "three";
import { CameraControls } from "./CameraControls";
import { Contents } from "./Contents";
import { Light } from "./Light";
import { useDarkMode } from "leva-controls/Theme";
import { theme } from "./theme";

export function Stage() {
  const mode = useDarkMode() ? "dark" : "light";
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: NeutralToneMapping,
      }}
      camera={{
        position: [0, 5, 10],
      }}
    >
      <fog attach="fog" args={[theme.background[mode], 20, 100]} />
      <color attach="background" args={[theme.background[mode]]} />
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
