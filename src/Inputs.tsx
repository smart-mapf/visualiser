import { usePlaying, autoplayAtom } from "client/play";
import {
  useMapFile,
  useScenarioFile,
  useSolutionFile,
  useRun,
  useSolutionContents,
  useFlip,
} from "client/run";
import { useClear, useLength } from "client/store";
import { useControls, button } from "leva";
import { filePicker } from "leva-file-picker";
import { store } from "main";
import { Suspense } from "react";

export function Inputs() {
  const [, setPlaying] = usePlaying();
  const clear = useClear();
  const [mapFile, setMapFile] = useMapFile();
  const [scenarioFile, setScenarioFile] = useScenarioFile();
  const [solutionFile, setSolutionFile] = useSolutionFile();
  const { data: contents } = useSolutionContents();
  const length = useLength();
  const {
    mutation: { mutateAsync: run, isPending: buffering },
    abort,
  } = useRun();
  const submitDisabled = !(mapFile && scenarioFile && solutionFile);
  const [flip, setFlip] = useFlip();

  useControls(
    "Inputs",
    {
      map: filePicker({
        label: "Map file",
        onChange: (f) => {
          if (!f) clear();
          setMapFile(f);
        },
        accept: { "text/plain": [".map"] },
        disabled: buffering,
      }),
      scenario: filePicker({
        label: "Scenario",
        onChange: (f) => {
          if (!f) clear();
          setScenarioFile(f);
        },
        accept: { "text/plain": [".scen"] },
        disabled: buffering,
      }),
      solution: filePicker({
        label: "Solution",
        onChange: (f) => {
          if (!f) clear();
          setSolutionFile(f);
        },
        accept: { "text/plain": [] },
        disabled: buffering,
      }),
      flip: {
        label: "Flip X/Y",
        value: flip,
        onChange: setFlip,
      },
    },
    [buffering, flip]
  );

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
      cancel: {
        ...button(
          () => {
            abort.current?.();
          },
          { disabled: !buffering }
        ),
        label: "Stop",
      },
    },
    [length, buffering, contents?.count, submitDisabled, abort]
  );

  return <Suspense fallback={null} />;
}
