import Ansi from "ansi-to-react";
import { Components, createPlugin, useInputContext } from "leva/plugin";
import { useCss } from "react-use";

const Log = () => {
  const { value } = useInputContext<unknown>();
  const cls0 = useCss({
    width: "100%",
    overflowX: "hidden",
    overflowY: "auto",
    maxHeight: "240px",
  });
  const cls1 = useCss({
    whiteSpace: "pre-wrap",
    fontWeight: "var(--leva-fontWeights-label)",
    fontFamily: "var(--leva-fonts-mono)",
    fontSize: "var(--leva-fontSizes-root)",
    wordBreak: "break-all",
  });
  return (
    <Components.Row>
      <p className={cls0}>
        <Ansi className={cls1}>{`${value}`}</Ansi>
      </p>
    </Components.Row>
  );
};

export const logs = createPlugin({
  normalize: (v) => ({ value: `${v}` }),
  component: Log,
});
