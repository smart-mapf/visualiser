import { a, useSpring } from "@react-spring/three";
import { Shadow } from "@react-three/drei";
import { ceil, clamp, floor } from "lodash";
import { ComponentProps } from "react";
import { Step } from "smart";
import { lerp } from "./utils";

const Group = a("group");

export function Agent({
  path = [],
  time = 0,
  ...props
}: ComponentProps<typeof Group> & {
  path?: Step["agents"][number][];
  time?: number;
}): JSX.Element {
  const springs = useSpring({
    time,
    config: {
      mass: 0.2,
      tension: 100,
      friction: 20,
      precision: 0.0001,
    },
  });
  if (!path.length) {
    return <></>;
  }
  const pos = springs.time.to((x) => {
    const high = path.length - 1;
    const i = clamp(floor(x), 0, high);
    const j = clamp(ceil(x), 0, high);
    const p = x - i;
    return [
      lerp(path[i].x + 0.5, path[j].x + 0.5, p),
      0,
      lerp(path[i].y + 0.5, path[j].y + 0.5, p),
    ] as const;
  });

  return (
    <Group {...props} position={pos}>
      <mesh castShadow position={[0, 0.4, 0]} scale={[0.3, 0.2, 0.3]}>
        <meshStandardMaterial color="orange" />
        <capsuleGeometry args={[1, 1, 5]} />
      </mesh>
      <Shadow position={[0, 0.01, 0]} scale={0.5} opacity={0.25} />
    </Group>
  );
}
