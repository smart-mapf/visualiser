import { Instances, useGLTF, useTexture } from "@react-three/drei";
import { useSolutionContents } from "client/run";
import { useModel } from "hooks/useModel";
import { range } from "lodash";
import { Suspense, useMemo } from "react";
import { MeshPhysicalMaterial } from "three";
import { Agent } from "./Agent";

useGLTF.preload("./robot-final.gltf");
useTexture.preload("./base.png");

export function Agents() {
  const { geometry } = useModel("./robot-final.gltf");
  const texture = useTexture("./base.png");

  const material = useMemo(() => {
    texture.flipY = false;
    return new MeshPhysicalMaterial({
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
      <Instances
        frustumCulled={false}
        castShadow
        receiveShadow
        geometry={geometry}
        material={material}
      >
        {range(contents?.count ?? 0).map((i) => (
          <group position={[0, 0.1, 0]}>
            <Agent i={i} key={i} scale={2} />
          </group>
        ))}
      </Instances>
    </Suspense>
  );
}
