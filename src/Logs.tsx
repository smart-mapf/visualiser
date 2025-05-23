import { useLog } from "client/store";
import { useControls } from "leva";
import { logs } from "leva-plugins/logs";
import { useEffect } from "react";

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
