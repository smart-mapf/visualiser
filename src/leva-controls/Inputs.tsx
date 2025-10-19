import { autoplayAtom, usePlaying } from "client/play";
import {
  useAcceleration,
  useAngularMaxSpeed,
  useFlip,
  useInitialised,
  useMapFile,
  useMaxSpeed,
  useRun,
  useScenarioFile,
  useSolutionContents,
  useSolutionFile,
} from "client/run";
import { useClear, useLength } from "client/state";
import { colors } from "colors";
import { button, useControls } from "leva";
import { file } from "leva-plugins/file";
import { jsx } from "leva-plugins/jsx";
import { Suspense } from "react";
import { useCss } from "react-use";
import { store } from "store";

export function Inputs() {
  const [, setPlaying] = usePlaying();
  const initialised = useInitialised();
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
  const [angularMaxSpeed, setAngularMaxSpeed] = useAngularMaxSpeed();

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
      angularMaxSpeed: {
        label: "Limit wheel speed (π rad/s)",
        value: angularMaxSpeed,
        onChange: setAngularMaxSpeed,
        min: 0.01,
        max: 2,
        step: 0.01,
      },
      maxSpeed: {
        label: "Limit speed (m/s)",
        value: maxSpeed,
        onChange: setMaxSpeed,
        min: 0.01,
        max: 8,
        step: 0.01,
      },
      acceleration: {
        label: "Limit acceleration (m/s²)",
        value: acceleration,
        onChange: setAcceleration,
        min: 0.01,
        max: 2,
        step: 0.01,
      },
    },
    [maxSpeed, acceleration, angularMaxSpeed]
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
      ...(!initialised
        ? {
            initialising: jsx({
              value: <A />,
            }),
          }
        : {}),
    },
    [length, buffering, contents?.count, submitDisabled, abort, initialised]
  );

  return <Suspense fallback={null} />;
}

function A() {
  const cls = useCss({
    color: colors.warning,
    height: "var(--leva-sizes-rowHeight)",
    textAlign: "center",
    borderRadius: "var(--leva-radii-sm)",
    padding: "0.6em 1.2em",
    background: `${colors.warning}11`,
  });
  return <span className={cls}>Please wait while the robots initialise.</span>;
}
