import { PivotControls, Instances } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { range } from "lodash";
import { useState } from "react";
import { useRafLoop } from "react-use";
import { Agent } from "./Agent";
import { CameraControls } from "./CameraControls";
import { Domain } from "./Domain";
import { Light } from "./Light";
import { useMapFile, useAgentCount } from "client/run";
import { useMap } from "hooks/useMap";
import { useModel } from "hooks/useModel";
import { lerp, id } from "utils";

export function Stage({ time = 0 }: { time?: number }) {
  const [mapFile] = useMapFile();
  const { data: map } = useMap(mapFile);
  const agentCount = useAgentCount();

  const [t, setT] = useState(time);
  useRafLoop(() => {
    setT(lerp(t, time, 0.1));
  });

  const geometry = useModel();

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
        <Instances castShadow frustumCulled={false} geometry={geometry}>
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
