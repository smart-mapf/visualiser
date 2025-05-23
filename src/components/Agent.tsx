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
import { useSolutionContents } from "client/run";
import { useSelection } from "client/selection";
import { useAgentPosition } from "client/store";
import { head, last, thru } from "lodash";
import { ComponentProps, Suspense } from "react";
import { useBoolean, useTween } from "react-use";
import { rectangleRounded } from "./rectangleRounded";
import { DoubleSide } from "three";

const font = `./fonts/geist-medium.ttf`;

const AnimatedLine = a(Line);
const AnimatedRing = a(Ring);
const AnimatedText = a(Text);
const AnimatedBillboard = a(Billboard);

function Constraint({
  from = 0,
  to = 0,
  ...props
}: {
  from?: number;
  to?: number;
} & Partial<ComponentProps<typeof AnimatedLine>>) {
  const { position: a = [0, 0, 0] as const } = useAgentPosition(from) ?? {};
  const { position: b = [0, 0, 0] as const } = useAgentPosition(to) ?? {};

  const springs = useSpring({
    from: { offset: 0 },
    to: { offset: -10 },
    loop: true,
    config: { duration: 1000 },
  });

  return (
    <AnimatedLine
      {...props}
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
}: {
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

  const a = useAgentPosition(id);

  const constrained = !!a?.constraints?.length;

  return (
    <>
      {visibleTransitions(
        (s, v) =>
          v && (
            <>
              <AnimatedBillboard scale={s.scale} position={[x, y + 1, z]}>
                <mesh
                  geometry={rectangleRounded(1, 0.4, 0.2, 4)}
                  renderOrder={9998}
                >
                  <meshBasicMaterial
                    color="#fff"
                    depthTest={false}
                    side={DoubleSide}
                  />
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
              {a?.constraints?.map?.(({ id: to }) => (
                <Constraint
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

export function Agent({ i, ...props }: { i: number } & InstanceProps) {
  const scale = useTween("outExpo", 2000);
  const [selected, toggleSelected] = useSelection();
  const [hovered, toggleHovered] = useBoolean(false);

  const a = useAgentPosition(i);

  if (!a) {
    return undefined;
  }

  return (
    <>
      <Suspense fallback={null}>
        <Instance
          position={a.position}
          rotation={a.rotation}
          {...props}
          scale={(props.scale as number) * scale}
          onClick={() => {
            toggleSelected(i);
          }}
          onPointerOver={() => toggleHovered(true)}
          onPointerOut={() => toggleHovered(false)}
          color={hovered ? "#ccc" : "#fff"}
        />
      </Suspense>
      <Suspense fallback={null}>
        {
          <Path
            hover={hovered}
            visible={selected.has(i)}
            id={i}
            current={a.position}
          />
        }
      </Suspense>
    </>
  );
}
