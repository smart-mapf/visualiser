import { Instance, Instances } from "@react-three/drei";
import { memo, ReactNode } from "react";

const Obstacles = memo(
  ({
    items,
    size: { width, height } = { width: 0, height: 0 },
  }: DomainProps) => (
    <>
      <Instances
        scale={[1, 1, -1]}
        rotation={[0, -Math.PI / 2, 0]}
        limit={items?.length ?? 0}
        castShadow
        position={[-height / 2, 0, -width / 2]}
      >
        <meshStandardMaterial color="#555" />
        <boxGeometry />
        {items?.map?.((item, i) => (
          <Instance
            key={i}
            scale={[item.width, 0.5, item.height]}
            position={[item.x + item.width / 2, 0.25, item.y + item.height / 2]}
          />
        ))}
      </Instances>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#444" />
        <planeGeometry args={[width, height]} />
      </mesh>
    </>
  )
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
      <Obstacles items={items} size={size} />
      <group position={[-(size?.width ?? 0) / 2, 0, -(size?.height ?? 0) / 2]}>
        {children}
      </group>
    </>
  );
}
