import Ansi from "ansi-to-react";
import { useLog } from "client/store";
import { useControls } from "leva";
import { Components, createPlugin, useInputContext } from "leva/plugin";
import { useEffect } from "react";
import { useCss } from "react-use";

const Log = () => {
  const { label, value, onUpdate, disabled, settings } = useInputContext<any>();
  const cls = useCss({
    whiteSpace: "pre-wrap",
    width: "100%",
    overflowX: "hidden",
    overflowY: "auto",
    maxHeight: "240px",
    fontWeight: "var(--leva-fontWeights-label)",
    fontFamily: "var(--leva-fonts-mono)",
    fontSize: "var(--leva-fontSizes-root)",
  });
  return (
    <Components.Row>
      <Ansi className={cls}>{value ?? "test"}</Ansi>
    </Components.Row>
  );
};
const logs = createPlugin({
  normalize: (v) => ({ value: `${v}` }),
  component: Log,
});

export function Logs() {
  const [log] = useLog();
  const [, set] = useControls("Logs", () => ({
    logs: logs(),
  }));
  useEffect(() => {
    set({
      logs: log.length
        ? log.join("\n")
        : "Messages from the simulator will appear here.",
    });
  }, [log]);
  return null;
}
