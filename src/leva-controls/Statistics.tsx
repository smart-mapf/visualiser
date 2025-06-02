import { useSolutionContents } from "client/run";
import { useLength, useStats } from "client/state";
import { useControls } from "leva";
import { jsx } from "leva-plugins/jsx";
import { Components } from "leva/plugin";
import { round, sum, values } from "lodash";

function Statistics1() {
  const [stats] = useStats();
  const length = useLength();
  return stats ? (
    <div>
      <Components.Row input>
        <Components.Label>Sum of costs</Components.Label>
        <Components.Label>{stats.mapf_plan_cost}</Components.Label>
      </Components.Row>
      <Components.Row input>
        <Components.Label>Makespan</Components.Label>
        <Components.Label>{round(length / 10, 1)}s</Components.Label>
      </Components.Row>
      <Components.Row input>
        <Components.Label>Average time</Components.Label>
        <Components.Label>
          {round(
            sum(values(stats.agent_exec_cost)) /
              values(stats.agent_exec_cost).length /
              10,
            1
          )}
          s
        </Components.Label>
      </Components.Row>
    </div>
  ) : (
    "You'll see trends here once simulation ends."
  );
}

export function Statistics() {
  useControls("Statistics", () => ({
    selection: jsx({
      value: <Statistics1 />,
    }),
  }));
  return null;
}
