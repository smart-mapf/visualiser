import { Grid, Instance, Instances, useTexture } from "@react-three/drei";
import { useModel } from "hooks/useModel";
import { memo, ReactNode, Suspense } from "react";
import { NearestFilter, RepeatWrapping, Vector2 } from "three";

import { useThree } from "@react-three/fiber";
import "./checkerMaterial";
import { checkerMaterial } from "./checkerMaterial";

const Obstacles = memo(
  ({
    items,
    size: { width, height } = { width: 0, height: 0 },
  }: DomainProps) => {
    const { gl } = useThree();
    const { geometry: hull } = useModel("./box-hull.gltf");
    const roughness = useTexture("/tile-roughness.png", (t) => {
      t.anisotropy = gl.capabilities.getMaxAnisotropy();
      console.log(gl.capabilities.getMaxAnisotropy());
      t.repeat = new Vector2(width * 2, height * 2);
      t.wrapS = RepeatWrapping;
      t.wrapT = RepeatWrapping;
      t.minFilter = NearestFilter;
      t.magFilter = NearestFilter;
    });
    const texture = useTexture("/tile.png", (t) => {
      t.anisotropy = gl.capabilities.getMaxAnisotropy();
      t.repeat = new Vector2(width * 2, height * 2);
      t.wrapS = RepeatWrapping;
      t.wrapT = RepeatWrapping;
      t.minFilter = NearestFilter;
      t.magFilter = NearestFilter;
    });
    return (
      <group>
        <Instances
          scale={[-1, 0.5, -1]}
          rotation={[0, Math.PI / 2, 0]}
          limit={items?.length ?? 0}
          castShadow
          position={[height / 2, 0, -width / 2]}
          material={checkerMaterial(1)}
        >
          <boxGeometry />
          {items?.map?.((item, i) => (
            <Instance
              color="#ccc"
              key={i}
              scale={[item.width, 0.5, item.height]}
              position={[
                item.x + item.width / 2,
                0.25,
                item.y + item.height / 2,
              ]}
            />
          ))}
        </Instances>
        <mesh
          geometry={hull}
          rotation={[0, Math.PI / 2, 0]}
          scale={[width / 2, 0.3, height / 2]}
          position={[0, -0.3, 0]}
        >
          <meshStandardMaterial color="#393e4d" />
        </mesh>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
          <meshStandardMaterial
            color="#ccc"
            map={texture}
            roughnessMap={roughness}
          />
          <planeGeometry args={[width, height]} />
        </mesh>
      </group>
    );
  }
);

type DomainProps = {
  size?: {
    width: number;
    height: number;
  };
  items?: {
    width: number;
    height: number;
    x: number;
    y: number;
  }[];
};

export function Domain({
  children,
  items = [],
  size,
}: {
  children?: ReactNode;
} & DomainProps) {
  return (
    <>
      <Grid
        position={[0, -0.6, 0]}
        args={[4096, 4096]}
        cellColor={"#666"}
        sectionColor={"#666"}
      />
      <Suspense fallback={null}>
        {size && <Obstacles items={items} size={size} />}
        <group
          scale={[1, 1, 1]}
          position={[
            (size?.height ?? 0) / 2 - 1,
            0,
            -(size?.width ?? 0) / 2 + 1,
          ]}
        >
          {children}
        </group>
      </Suspense>
    </>
  );
}
