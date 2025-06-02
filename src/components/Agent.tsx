import { a, useSpring, useTransition, to } from "@react-spring/three";
import {
  Billboard,
  Circle,
  InstanceProps,
  Line,
  Ring,
  Text,
} from "@react-three/drei";
import { useSolutionContents } from "client/run";
import { useSelection } from "client/selection";
import { useAgentPosition } from "client/state";
import { colors } from "colors";
import { head, isUndefined, last } from "lodash";
import { ComponentProps, Suspense } from "react";
import { useBoolean } from "react-use";
import { DoubleSide } from "three";
import { AgentInstance } from "./AgentInstances";
import { rectangleRounded } from "./rectangleRounded";

const font = `./fonts/geist-medium.ttf`;

const AnimatedLine = a(Line);
const AnimatedRing = a(Ring);
const AnimatedText = a(Text);
const AnimatedBillboard = a(Billboard);
const AnimatedAgentInstance = a(AgentInstance);

function Constraint({
  from = 0,
  to = 0,
  color,
  ...props
}: {
  from?: number;
  to?: number;
  color?: string;
} & Partial<ComponentProps<typeof AnimatedLine>>) {
  const { current: { position: a } = {} } = useAgentPosition(from) ?? {};
  const { current: { position: b } = {} } = useAgentPosition(to) ?? {};

  const springs = useSpring({
    from: { offset: 0 },
    to: { offset: -10 },
    loop: true,
    config: { duration: 1000 },
  });

  return (
    <AnimatedLine
      {...props}
      points={[a, b] as unknown}
      dashOffset={springs.offset}
      dashScale={20}
      color={color}
      dashed
      renderOrder={9997}
      depthTest={false}
    />
  );
}

export function CurrentAgent({
  agent,
  visible,
  hovered,
  color,
}: {
  agent: NonNullable<ReturnType<typeof useAgentPosition>["current"]>;
  visible?: boolean;
  hovered?: boolean;
  color?: string;
}) {
  const [x, y, z] = agent.position;
  const visibleTransitions = useTransition(visible, {
    from: { scale: 0 },
    enter: { scale: 1 },
    leave: { scale: 0 },
  });

  const hoverTransitions = useTransition(hovered && !visible, {
    from: { scale: 0 },
    enter: { scale: 1 },
    leave: { scale: 0 },
  });

  return (
    <>
      {visibleTransitions(
        (s, v) =>
          v && (
            <group>
              <AnimatedBillboard scale={s.scale} position={[x, y + 0.75, z]}>
                <mesh
                  geometry={rectangleRounded(0.9, 0.3, 0.15, 4)}
                  renderOrder={9998}
                >
                  <meshBasicMaterial
                    transparent
                    color="#fff"
                    depthTest={false}
                    side={DoubleSide}
                  />
                </mesh>
                <AnimatedText
                  font={font}
                  renderOrder={9999}
                  fillOpacity={s.scale}
                  color="#181c20"
                  anchorX="center"
                  anchorY="middle"
                  fontSize={0.11}
                >
                  Robot {agent.id}
                </AnimatedText>
              </AnimatedBillboard>
              <AnimatedRing
                scale={s.scale}
                args={[0.45 / 2, 0.55 / 2, 32, 32]}
                position={[x, y - 0.06, z]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <meshBasicMaterial color={color} />
              </AnimatedRing>
            </group>
          )
      )}
      {hoverTransitions(
        (s, v) =>
          v && (
            <AnimatedBillboard scale={s.scale} position={[x, y + 0.75, z]}>
              <Circle args={[0.1, 16]}>
                <meshBasicMaterial color="#fff" />
              </Circle>
            </AnimatedBillboard>
          )
      )}
    </>
  );
}

export function Path({
  visible,
  agent,
  hovered,
}: {
  hovered?: boolean;
  visible?: boolean;
  agent?: ReturnType<typeof useAgentPosition>["current"];
}) {
  const { data } = useSolutionContents();

  const visibleTransitions = useTransition(visible, {
    from: { scale: 0 },
    enter: { scale: 1 },
    leave: { scale: 0 },
  });

  const path =
    data?.paths?.[agent?.id ?? 0]?.map?.(
      (p) => [-p.x + 0.5, -0.06, p.y - 0.5] as [x: number, y: number, z: number]
    ) ?? [];

  const src = head(path);
  const dest = last(path);

  const constrained = !!agent?.constraints?.length;

  const color = agent
    ? agent.state === "unknown"
      ? colors.idle
      : isUndefined(agent.state)
      ? colors.idle
      : agent.state === "finished"
      ? colors.idle
      : agent.state === "idle"
      ? colors.error
      : constrained
      ? colors.warning
      : colors.success
    : "#000";
  return (
    <>
      {agent && (
        <CurrentAgent
          agent={agent}
          visible={visible}
          hovered={hovered}
          color={color}
        />
      )}
      {visibleTransitions(
        (s, v) =>
          v && (
            <group>
              <AnimatedLine
                dashScale={5}
                lineWidth={s.scale.to((s) => s * 4)}
                color="#fff"
                points={path}
                dashed
              />

              <AnimatedRing
                renderOrder={9999}
                scale={s.scale}
                args={[0, 0.6 / 4, 32, 32]}
                position={dest}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <meshBasicMaterial color={colors.error} depthTest={false} />
              </AnimatedRing>
              <AnimatedRing
                renderOrder={9999}
                scale={s.scale}
                args={[0, 0.6 / 4, 32, 32]}
                position={src}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <meshBasicMaterial color={colors.success} depthTest={false} />
              </AnimatedRing>
              {agent?.constraints?.map?.(({ id: to }) => (
                <Constraint
                  from={agent?.id}
                  to={to}
                  color={color}
                  lineWidth={s.scale.to((s) => s * 2)}
                />
              ))}
            </group>
          )
      )}
    </>
  );
}

export function Agent({ i, ...props }: { i: number } & InstanceProps) {
  const [selected, toggleSelected] = useSelection();
  const [hovered, toggleHovered] = useBoolean(false);
  const [down, toggleDown] = useBoolean(false);

  const { current: a } = useAgentPosition(i);
  const transitions = useTransition(+!!a, {
    from: { scale: 0 },
    enter: { scale: 1 },
    leave: { scale: 0 },
    config: { duration: 200 },
  });

  const springs = useSpring({
    opacity:
      (a?.state === "unknown" ? 0.5 : 1) *
      (hovered ? 0.75 : 1) *
      (down ? 0.5 : 1),
    config: { duration: 200 },
  });

  return (
    <>
      <Suspense fallback={null}>
        {transitions(
          (s, v) =>
            v && (
              <AnimatedAgentInstance
                bayerHash={to([springs.opacity, s.scale], (o, s) => o * s)}
                position={a?.position}
                rotation={a?.rotation}
                {...props}
                onClick={() => {
                  toggleSelected(i);
                }}
                onPointerDown={() => toggleDown(true)}
                onPointerUp={() => toggleDown(false)}
                onPointerOver={() => toggleHovered(true)}
                onPointerOut={() => toggleHovered(false)}
              />
            )
        )}
      </Suspense>
      <Suspense fallback={null}>
        <Path hovered={hovered} visible={selected.has(i)} agent={a} />
      </Suspense>
    </>
  );
}
