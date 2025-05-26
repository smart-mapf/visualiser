import { useSelection } from "client/selection";
import { useControls } from "leva";
import { jsx } from "leva-plugins/jsx";
import { thru } from "lodash";
import { useEffect } from "react";
import { Status } from "Status";

export function Selection() {
  const [selection] = useSelection();
  const [, set] = useControls("Selection", () => ({
    selection: jsx(),
  }));
  useEffect(() => {
    set({
      selection: (
        <>
          {thru([...selection.values()], (vs) =>
            vs.length ? (
              vs.map((v) => <Status id={v} />)
            ) : (
              <p>Details of selected agents will appear here.</p>
            )
          )}
        </>
      ),
    });
  }, [selection]);
  return null;
}
