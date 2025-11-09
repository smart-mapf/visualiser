import { button, useControls } from "leva";

export function Docs() {
  useControls(
    "Docs",
    () => ({
      docs: {
        label: "Docs on GitHub",
        ...button(() => open("https://smart.pathfinding.ai", "_blank")),
      },
    }),
    []
  );
  return null;
}
