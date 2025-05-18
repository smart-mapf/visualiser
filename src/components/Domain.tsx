import { Grid, Instance, Instances, useTexture } from "@react-three/drei";
import { useModel } from "hooks/useModel";
import { memo, ReactNode } from "react";
import {
  LinearMipmapNearestFilter,
  NearestFilter,
  RepeatWrapping,
  Vector2,
} from "three";

import "./checkerMaterial";
import { checkerMaterial } from "./checkerMaterial";

const Obstacles = memo(
  ({
    items,
    size: { width, height } = { width: 0, height: 0 },
  }: DomainProps) => {
    const { geometry: hull } = useModel("./box-hull.gltf");
    const roughness = useTexture("/tile-roughness.png", (t) => {
      t.repeat = new Vector2(width, height);
      t.wrapS = RepeatWrapping;
      t.wrapT = RepeatWrapping;
      t.minFilter = LinearMipmapNearestFilter;
      t.magFilter = NearestFilter;
    });
    const texture = useTexture("/tile.png", (t) => {
      t.repeat = new Vector2(width, height);
      t.wrapS = RepeatWrapping;
      t.wrapT = RepeatWrapping;
      t.minFilter = LinearMipmapNearestFilter;
      t.magFilter = NearestFilter;
    });
    return (
      <group>
        <Instances
          scale={[-1, 1, -1]}
          rotation={[0, Math.PI / 2, 0]}
          limit={items?.length ?? 0}
          castShadow
          position={[height / 2, 0, -width / 2]}
          material={checkerMaterial(4)}
        >
          <boxGeometry />
          {items?.map?.((item, i) => (
            <Instance
              color="#444"
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
          receiveShadow
          geometry={hull}
          rotation={[0, Math.PI / 2, 0]}
          scale={[width / 2, 0.3, height / 2]}
          position={[0, -0.3, 0]}
        >
          <meshStandardMaterial color="#666" />
        </mesh>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
          <meshStandardMaterial
            color="#AAA"
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
      {items.length ? (
        <Obstacles items={items} size={size} />
      ) : (
        <Grid args={[10, 10]} />
      )}
      <group
        scale={[1, 1, 1]}
        position={[(size?.height ?? 0) / 2 - 1, 0, -(size?.width ?? 0) / 2 + 1]}
      >
        {children}
      </group>
    </>
  );
}
