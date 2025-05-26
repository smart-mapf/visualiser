import { usePlaying, autoplayAtom } from "client/play";
import {
  useMapFile,
  useScenarioFile,
  useSolutionFile,
  useRun,
  useSolutionContents,
  useFlip,
} from "client/run";
import { useClear, useLength } from "client/state";
import { useControls, button } from "leva";
import { filePicker } from "leva-file-picker";
import { store } from "store";
import { Suspense } from "react";
import { file } from "leva-plugins/file";

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
      map: file({
        label: "Map file",
        defaultValue: mapFile,
        onAccept: (f) => {
          if (!f) clear();
          setMapFile(f);
        },
        accept: { "text/plain": [".map"] },
        disabled: buffering,
      }),
      scenario: file({
        label: "Scenario",
        defaultValue: scenarioFile,
        onAccept: (f) => {
          if (!f) clear();
          setScenarioFile(f);
        },
        accept: { "text/plain": [".scen"] },
        disabled: buffering,
      }),
      solution: file({
        label: "Solution",
        defaultValue: solutionFile,
        onAccept: (f) => {
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
        disabled: buffering,
      },
    },
    [buffering, flip, mapFile, scenarioFile, solutionFile]
  );

  useControls(
    "Run",
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
        label: buffering
          ? `Simulating (Step ${length})`
          : contents?.count
          ? `Simulate (${contents.count} ${
              contents.count === 1 ? "agent" : "agents"
            })`
          : "Simulate",
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
