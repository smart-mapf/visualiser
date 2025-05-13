import { Instance, InstanceProps, Line } from "@react-three/drei";
import { atom, useAtom, useAtomValue } from "jotai";
import { selectAtom } from "jotai/utils";
import { clamp, floor, isEqual, thru } from "lodash";
import { useMemo } from "react";
import { useBoolean } from "react-use";
import { pathsAtom, resultAtom } from "client/run";
import { lerp, lerpRadians } from "utils";

const nearAtom = (i: number, time: number) =>
  selectAtom(
    resultAtom,
    (result) => {
      if (!result.length) return undefined;
      const high = result.length - 1;
      const j = clamp(floor(time), 0, high);
      const k = clamp(floor(time) + 1, 0, high);
      const current = result[j].agents[i];
      const next = result[k].agents[i];
      return [current, next] as const;
    },
    isEqual
  );

export function Agent({
  i,
  time,
  ...props
}: { i: number; time: number } & InstanceProps) {
  const [selected, toggleSelected] = useBoolean(false);
  const [hovered, toggleHovered] = useBoolean(false);
  const time1 = floor(time);
  const nearAtom1 = useMemo(() => nearAtom(i, time1), [i, time1]);
  const pathAtom1 = useMemo(
    () => atom(async (get) => (await get(pathsAtom))[i]),
    [i]
  );
  const [pos1] = useAtom(nearAtom1);
  const path = useAtomValue(pathAtom1);
  if (!pos1) return undefined;

  const [current, next] = pos1;

  const waiting = current.x === next.x && current.y === next.y;

  const pos = thru(time, (x) => {
    const p = x - floor(x);
    return [
      lerp(current.x + 0.5, next.x + 0.5, p),
      0,
      -lerp(current.y + 0.5, next.y + 0.5, p),
    ] as const;
  });

  const rotation = thru(time, (x) => {
    const p = x - floor(x);
    return [0, lerpRadians(current.rz, next.rz, p), 0] as const;
  });

  return (
    <>
      <Instance
        position={pos}
        rotation={rotation}
        {...props}
        onClick={() => {
          toggleSelected();
        }}
        onPointerOver={() => toggleHovered(true)}
        onPointerOut={() => toggleHovered(false)}
        color={
          selected ? "hotpink" : hovered ? "red" : waiting ? "grey" : "white"
        }
      />
      <Line
        color={selected ? "hotpink" : hovered ? "red" : "black"}
        points={path.map((p) => [-p.x + 0.5, 0, p.y - 0.5] as const)}
      />
    </>
  );
}
