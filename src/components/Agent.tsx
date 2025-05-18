import { a, useSpring, useTransition } from "@react-spring/three";
import {
  Billboard,
  Circle,
  Instance,
  InstanceProps,
  Line,
  Ring,
  Text,
} from "@react-three/drei";
import { constraintByStep, resultAtom, useSolutionContents } from "client/run";
import { useAtom, useAtomValue } from "jotai";
import { selectAtom } from "jotai/utils";
import { clamp, floor, head, isEqual, last, thru } from "lodash";
import { ComponentProps, Suspense, useMemo } from "react";
import { useBoolean, useTween } from "react-use";
import { lerp, lerpRadians } from "utils";
import { RectangleRounded } from "./RectangleRounded";

const font = `./fonts/geist-medium.ttf`;

const AnimatedLine = a(Line);
const AnimatedRing = a(Ring);
const AnimatedText = a(Text);
const AnimatedBillboard = a(Billboard);

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

function useAgentPosition(agent: number, time: number) {
  const tick = floor(time);
  const nearAtom1 = useMemo(() => nearAtom(agent, tick), [agent, tick]);
  const [pos1] = useAtom(nearAtom1);

  const [current, next] = pos1 ?? ([undefined, undefined] as const);

  if (!current) return {};

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

  return { position: pos, rotation, current, next };
}

function Constraint({
  from = 0,
  to = 0,
  time = 0,
  ...props
}: {
  time?: number;
  from?: number;
  to?: number;
} & Partial<ComponentProps<typeof AnimatedLine>>) {
  const { position: a = [0, 0, 0] as const } = useAgentPosition(from, time);
  const { position: b = [0, 0, 0] as const } = useAgentPosition(to, time);

  const springs = useSpring({
    from: { offset: 0 },
    to: { offset: -10 },
    loop: true,
    config: { duration: 1000 },
  });

  return (
    ///@ts-ignore excessively deep typing
    <AnimatedLine
      {...props}
      ///@ts-ignore excessively deep typing
      points={[thru(a, ([x, y, z]) => [x, y + 1, z]), b]}
      dashOffset={springs.offset}
      dashScale={20}
      color="#ffc400"
      dashed
      renderOrder={9997}
      depthTest={false}
    />
  );
}

export function Path({
  id,
  visible,
  current,
  hover,
  time,
}: {
  time: number;
  id: number;
  hover?: boolean;
  visible?: boolean;
  current: readonly [number, number, number];
}) {
  const { data } = useSolutionContents();

  const visibleTransitions = useTransition(visible, {
    from: { scale: 0 },
    enter: { scale: 1 },
    leave: { scale: 0 },
  });
  const hoverTransitions = useTransition(hover && !visible, {
    from: { scale: 0 },
    enter: { scale: 1 },
    leave: { scale: 0 },
  });

  const [x, y, z] = current;

  const path =
    data?.paths?.[id]?.map?.(
      (p) => [-p.x + 0.5, -0.1, p.y - 0.5] as [x: number, y: number, z: number]
    ) ?? [];

  const src = head(path);
  const dest = last(path);

  const tick = floor(time);

  const constraintByStepAtom = useMemo(
    () => constraintByStep(id, tick),
    [id, tick]
  );

  const constraint = useAtomValue(constraintByStepAtom);

  const constrained = !!constraint?.constraining_agent?.length;

  return (
    <>
      {visibleTransitions(
        (s, v) =>
          v && (
            <>
              <AnimatedBillboard scale={s.scale} position={[x, y + 1, z]}>
                <mesh
                  geometry={RectangleRounded(1, 0.4, 0.2, 4)}
                  renderOrder={9998}
                >
                  <meshBasicMaterial color="#fff" depthTest={false} />
                </mesh>
                <AnimatedText
                  font={font}
                  renderOrder={9999}
                  fillOpacity={s.scale}
                  color="black"
                  anchorX="center"
                  anchorY="middle"
                  fontSize={0.13}
                >
                  Agent {id}
                </AnimatedText>
              </AnimatedBillboard>
              <AnimatedLine
                renderOrder={9998}
                dashScale={5}
                depthTest={false}
                lineWidth={s.scale.to((s) => s * 6)}
                color="white"
                points={path}
                dashed
              />
              <AnimatedRing
                scale={s.scale}
                args={[0.6 / 2, 0.7 / 2, 32, 32]}
                position={[x, y - 0.09, z]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <meshBasicMaterial
                  color={constrained ? "#ffc400" : "#00e676"}
                />
              </AnimatedRing>
              <AnimatedRing
                renderOrder={9999}
                scale={s.scale}
                args={[0, 0.6 / 4, 32, 32]}
                position={dest}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <meshBasicMaterial color={"#f50057"} depthTest={false} />
              </AnimatedRing>
              <AnimatedRing
                renderOrder={9999}
                scale={s.scale}
                args={[0, 0.6 / 4, 32, 32]}
                position={src}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <meshBasicMaterial color={"#00e676"} depthTest={false} />
              </AnimatedRing>
              {constraint?.constraining_agent?.map?.(({ id: to }) => (
                <Constraint
                  time={time}
                  from={id}
                  to={to}
                  lineWidth={s.scale.to((s) => s * 2)}
                />
              ))}
            </>
          )
      )}
      {hoverTransitions(
        (s, v) =>
          v && (
            <>
              <AnimatedBillboard scale={s.scale} position={[x, y + 1, z]}>
                <Circle args={[0.1, 16]}>
                  <meshBasicMaterial color="#fff" />
                </Circle>
              </AnimatedBillboard>
            </>
          )
      )}
    </>
  );
}

export function Agent({
  i,
  time,
  ...props
}: { i: number; time: number } & InstanceProps) {
  const scale = useTween("outExpo", 2000);
  const [selected, toggleSelected] = useBoolean(false);
  const [hovered, toggleHovered] = useBoolean(false);

  const { current, position, rotation } = useAgentPosition(i, time);

  if (!current) return undefined;

  return (
    <Suspense fallback={null}>
      <Instance
        position={position}
        rotation={rotation}
        {...props}
        scale={(props.scale as number) * scale}
        onClick={() => {
          toggleSelected();
        }}
        onPointerOver={() => toggleHovered(true)}
        onPointerOut={() => toggleHovered(false)}
        color={hovered ? "#ccc" : "#fff"}
      />
      {
        <Path
          hover={hovered}
          time={time}
          visible={selected}
          id={i}
          current={position}
        />
      }
    </Suspense>
  );
}
