import { useSolutionContents } from "client/run";
import { useTimeSmooth, historyAtom } from "client/state";
import { colors } from "colors";
import { getExpectedProgress } from "components/getExpectedProgress";
import { useAtomValue, atom } from "jotai";
import { Components } from "leva/plugin";
import { max } from "lodash";
import { useMemo } from "react";
import {
  Sparklines,
  SparklinesCurve,
  SparklinesReferenceLine,
} from "react-sparklines";

export function HistorySparkline({ id = 0 }: { id?: number }) {
  const { data: solution } = useSolutionContents();
  const [time] = useTimeSmooth();
  const history = useAtomValue(
    useMemo(
      () =>
        atom((get) => {
          const h = get(historyAtom);
          const m = max(h.map((h) => h?.progress?.[id]?.total ?? 0));
          return h.map((h) => (m ? (h?.progress?.[id]?.finished ?? 0) / m : 0));
        }),
      [id]
    )
  );
  return history.length ? (
    <Components.Row input>
      <div />
      <Sparklines
        data={history}
        height={64}
        min={0}
        max={1}
        style={{
          width: "100%",
          backgroundColor: "var(--leva-colors-elevation1)",
          borderRadius: "var(--leva-radii-sm)",
        }}
      >
        <SparklinesCurve color="var(--leva-colors-highlight3)" />
        <SparklinesReferenceLine
          type="custom"
          value={
            64 - getExpectedProgress(time, solution?.paths?.[id]?.length) * 64
          }
          style={{ stroke: colors.warning, strokeDasharray: "2, 2" }}
        />
      </Sparklines>
    </Components.Row>
  ) : null;
}
