import { QueryClientProvider } from "@tanstack/react-query";
import { Example } from "components/Example";
import { useControls } from "leva";
import { jsx } from "leva-plugins/jsx";
import { keys } from "lodash";
import { client } from "queryClient";
import { basename } from "utils";

const maps = import.meta.glob("/public/examples/*.map", {
  query: "?url",
  import: "default",
}) as Record<string, () => Promise<string>>;

export function Examples() {
  useControls("Examples", () => ({
    examples: jsx({
      value: (
        <QueryClientProvider client={client}>
          {keys(maps).map((k) => (
            <Example path={`/examples/${basename(k)}`} />
          ))}
        </QueryClientProvider>
      ),
    }),
  }));
  return null;
}
