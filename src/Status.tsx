import { useAgentInfo } from "client/state";
import { colors } from "colors";
import { Components } from "leva/plugin";
import { chain, isUndefined, noop } from "lodash";
import { useCss } from "react-use";

const vectorProps = {
  onUpdate: noop,
  settings: {
    lock: false,
    x: { step: 0.01, pad: 2 },
    y: { step: 0.01, pad: 2 },
    z: { step: 0.01, pad: 2 },
  },
} as any;

const angleProps = {
  onUpdate: noop,
  settings: {
    lock: false,
    x: { step: 1, pad: 0, suffix: "°" },
    y: { step: 1, pad: 0, suffix: "°" },
    z: { step: 1, pad: 0, suffix: "°" },
  },
} as any;

function Dot({ color }: { color: string }) {
  const cls = useCss({
    display: "inline-block",
    width: "var(--leva-space-sm)",
    height: "var(--leva-space-sm)",
    borderRadius: "50%",
    marginBottom: "1.2px",
    backgroundColor: color,
  });
  return <span className={cls} />;
}

export function Status({ id }: { id: number }) {
  const { value: a } = useAgentInfo(id);
  const cls = useCss({
    display: "flex",
    flexDirection: "column",
    gap: "var(--leva-space-rowGap)",
    backgroundColor:
      "color-mix(in lab, var(--leva-colors-elevation1) 50%, transparent)",
    padding: "var(--leva-space-rowGap)",
    borderRadius: "var(--leva-radii-sm)",
    "> h4:first-child": {
      margin: "var(--leva-space-sm) 0",
      fontWeight: 400,
      color: "var(--leva-colors-highlight3)",
      "> span": {
        display: "inline-block",
        marginLeft: "var(--leva-space-xs)",
        color: "var(--leva-colors-highlight2)",
      },
    },
  });
  if (!a) return null;
  const status =
    a.constraints?.length ||
    a.state === "idle" ||
    a.state === "finished" ||
    a.state === "unknown" ||
    isUndefined(a.state)
      ? {
          color:
            isUndefined(a.state) ||
            a.state === "finished" ||
            a.state === "unknown"
              ? colors.idle
              : a.state === "idle"
              ? colors.error
              : colors.warning,
          label: isUndefined(a.state)
            ? "Initialising"
            : a.state === "unknown"
            ? "Not simulated"
            : a.state === "finished"
            ? "Finished"
            : `${a.state === "idle" ? "Waiting for" : "Constrained by"} ${chain(
                a.constraints
              )
                .map((c) => c.id)
                .uniq()
                .join(", ")
                .value()}`,
        }
      : { color: colors.success, label: "Active" };
  return (
    <div className={cls}>
      <h4>
        Robot {id}{" "}
        <span>
          <Dot color={status.color} /> {status.label}
        </span>
      </h4>
      <Components.Row input>
        <Components.Label>Position</Components.Label>
        <Components.Vector
          {...vectorProps}
          value={{
            x: a.position[0],
            y: a.position[1],
            z: a.position[2],
          }}
        />
      </Components.Row>
      <Components.Row input>
        <Components.Label>Rotation</Components.Label>
        <Components.Vector
          {...angleProps}
          value={{
            x: (a.rotation[0] * 180) / Math.PI,
            y: (a.rotation[1] * 180) / Math.PI,
            z: (a.rotation[2] * 180) / Math.PI,
          }}
        />
      </Components.Row>
    </div>
  );
}
