import { useExample } from "hooks/useExample";
import { sizes } from "hooks/useMap";
import { Components } from "leva/plugin";
import { useCss } from "react-use";
import { basename } from "utils";

export function Example({ path }: { path: string }) {
  const cls = useCss({
    display: "flex",
    flexDirection: "column",
    gap: "var(--leva-space-rowGap)",
    backgroundColor:
      "color-mix(in lab, var(--leva-colors-elevation1) 50%, transparent)",
    "> .preview": {
      display: "flex",
      justifyContent: "space-between",
      gap: "var(--leva-space-rowGap)",
      padding: "var(--leva-space-rowGap)",
      h4: {
        margin: 0,
        fontWeight: 400,
        "&:first-child": {
          color: "var(--leva-colors-highlight3)",
        },
      },
      "> svg": {
        "--background": "var(--leva-colors-elevation1)",
        "--obstacle": "var(--leva-colors-highlight3)",
        borderRadius: "var(--leva-radii-sm)",
      },
    },
    "> .content": {
      padding: "var(--leva-space-rowGap)",
      ".buttons": {
        display: "flex",
        gap: "var(--leva-space-xs)",
        justifyContent: "flex-end",
        "> button": {
          backgroundColor: "var(--leva-colors-elevation3)",
          fontWeight: 400,
          "&:hover": {
            borderColor: "var(--leva-colors-accent2)",
          },
          borderRadius: "var(--leva-radii-sm)",
        },
      },
    },
    borderRadius: "var(--leva-radii-sm)",
  });
  const { isLoading, open, preview } = useExample(path);
  return (
    <div className={cls}>
      <div className="preview">
        <div>
          <h4>{basename(path, true)}</h4>
          <h4>
            {preview?.size?.width ?? 0}x{preview?.size?.height ?? 0}
          </h4>
          <h4>Random 1</h4>
        </div>
        {preview?.svg}
      </div>
      <div className="content">
        <Components.Row input>
          <Components.Label>Open</Components.Label>
          <div className="buttons">
            {sizes.map((size) => (
              <button
                disabled={isLoading}
                onClick={() => {
                  open.mutateAsync(size);
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </Components.Row>
      </div>
    </div>
  );
}
