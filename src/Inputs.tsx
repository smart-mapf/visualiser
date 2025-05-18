import { usePlaying, autoplayAtom } from "client/play";
import {
  useMapFile,
  useScenarioFile,
  useSolutionFile,
  useLength,
  useRun,
  useSolutionContents,
} from "client/run";
import { useControls, button } from "leva";
import { filePicker } from "leva-file-picker";
import { store } from "main";
import { Suspense } from "react";

export function Inputs() {
  const [, setPlaying] = usePlaying();

  const [mapFile, setMapFile] = useMapFile();
  const [scenarioFile, setScenarioFile] = useScenarioFile();
  const [solutionFile, setSolutionFile] = useSolutionFile();
  const { data: contents } = useSolutionContents();
  const length = useLength();
  const { mutateAsync: run, isPending: buffering } = useRun();
  const submitDisabled = !(mapFile && scenarioFile && solutionFile);

  useControls("Inputs", {
    map: filePicker({
      label: "Map file",
      onChange: setMapFile,
      accept: { "text/plain": [".map"] },
    }),
    scenario: filePicker({
      label: "Scenario",
      onChange: setScenarioFile,
      accept: { "text/plain": [".scen"] },
    }),
    solution: filePicker({
      label: "Solution",
      onChange: setSolutionFile,
      accept: { "text/plain": [] },
    }),
  });

  useControls(
    "Inputs",
    {
      submit: {
        ...button(
          () => {
            run();
            if (store.get(autoplayAtom)) {
              setPlaying(true);
            }
          },
          {
            disabled: !contents?.count || submitDisabled || buffering,
          }
        ),
        label: buffering ? `Simulating (Step ${length})` : "Simulate",
      },
    },
    [length, buffering, contents?.count, submitDisabled]
  );

  return <Suspense fallback={null} />;
}
