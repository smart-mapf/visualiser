import { Instances, useGLTF, useTexture } from "@react-three/drei";
import { useModel } from "hooks/useModel";
import { range } from "lodash";
import { Suspense, useMemo } from "react";
import { MeshStandardMaterial } from "three";
import { Agent } from "./Agent";
import { useSolutionContents } from "client/run";

useGLTF.preload("./robot-final.gltf");
useTexture.preload("./base.png");

export function Agents() {
  const { geometry } = useModel("./robot-final.gltf");
  const texture = useTexture("./base.png");

  const material = useMemo(() => {
    texture.flipY = false;
    return new MeshStandardMaterial({
      map: texture,
      roughness: 0.5,
      metalness: 0,
    });
  }, [texture]);

  const { data: contents } = useSolutionContents();

  return (
    <Suspense fallback={null}>
      <Instances
        frustumCulled={false}
        castShadow
        geometry={geometry}
        material={material}
      >
        {range(contents?.count ?? 0).map((i) => (
          <group position={[0, 0.1, 0]}>
            <Agent i={i} key={i} scale={3} />
          </group>
        ))}
      </Instances>
    </Suspense>
  );
}
