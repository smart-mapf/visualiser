import { autoplayAtom, usePlaying } from "client/play";
import {
  useAcceleration,
  useFlip,
  useMapFile,
  useMaxSpeed,
  useRun,
  useScenarioFile,
  useSolutionContents,
  useSolutionFile,
} from "client/run";
import { useClear, useLength } from "client/state";
import { button, useControls } from "leva";
import { file } from "leva-plugins/file";
import { Suspense } from "react";
import { store } from "store";

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

  const [maxSpeed, setMaxSpeed] = useMaxSpeed();
  const [acceleration, setAcceleration] = useAcceleration();

  useControls(
    "Settings",
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
    "Dynamics",
    {
      maxSpeed: {
        label: "Top speed (cm/s)",
        value: maxSpeed,
        onChange: setMaxSpeed,
        min: 100,
        max: 2500,
      },
      acceleration: {
        label: "Acceleration (cm/s²)",
        value: acceleration,
        onChange: setAcceleration,
        min: 2,
        max: 500,
      },
    },
    [maxSpeed, acceleration]
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
              contents.count === 1 ? "robot" : "robots"
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
