import { InstancedAttribute, useGLTF, useTexture } from "@react-three/drei";
import { useSolutionContents } from "client/run";
import { useModel } from "hooks/useModel";
import { range } from "lodash";
import { Suspense, useMemo } from "react";
import { Agent } from "./Agent";
import { AgentInstances } from "./AgentInstances";
import { bayerHashPhysicalMeshMaterial } from "./bayerHashPhysicalMeshMaterial";

useGLTF.preload("./robot-final.gltf");
useTexture.preload("./base.png");

export function Agents() {
  const { geometry } = useModel("./robot-final.gltf");
  const texture = useTexture("./base.png");

  const { material, depthMaterial } = useMemo(() => {
    texture.flipY = false;
    return bayerHashPhysicalMeshMaterial({
      map: texture,
      roughness: 0.5,
      metalness: 0,
      sheenColor: "#fff",
      sheenRoughness: 0.1,
      sheen: 1,
    });
  }, [texture]);

  const { data: contents } = useSolutionContents();

  return (
    <Suspense fallback={null}>
      <AgentInstances
        frustumCulled={false}
        castShadow
        receiveShadow
        geometry={geometry}
        customDepthMaterial={depthMaterial}
        material={material}
      >
        <InstancedAttribute name="bayerHash" defaultValue={1} />
        {range(contents?.count ?? 0).map((i) => (
          <group position={[0, 0.07, 0]} key={i}>
            <Agent i={i} key={i} scale={2} />
          </group>
        ))}
      </AgentInstances>
    </Suspense>
  );
}
