import { Components, createPlugin, useInputContext } from "leva/plugin";
import { ReactNode } from "react";

const Jsx = () => {
  const { value: v } = useInputContext<ReactNode>();
  return <Components.Row>{v}</Components.Row>;
};

export const jsx = createPlugin({
  normalize: (v) => ({ value: <>{v}</> }),
  component: Jsx,
});
