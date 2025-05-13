import { button, Leva, useControls } from "leva";
import { filePicker } from "leva-file-picker";
import { max, min, now, round } from "lodash";
import { useEffect } from "react";
import "./App.css";
import { store } from "./main";
import { usePlaying } from "./client/play";
import {
  lengthAtom,
  useAgentCount,
  useLength,
  useMapFile,
  useRun,
  useScenarioFile,
  useSolutionFile,
} from "./client/run";
import { Stage } from "./components/Stage";

function App() {
  const [mapFile, setMapFile] = useMapFile();
  const [scenarioFile, setScenarioFile] = useScenarioFile();
  const [solutionFile, setSolutionFile] = useSolutionFile();
  const agentCount = useAgentCount();
  const length = useLength();
  const { mutateAsync: run, isPending: buffering } = useRun();
  const submitDisabled = !(mapFile && scenarioFile && solutionFile);

  const [playing, setPlaying] = usePlaying();

  useControls(
    "Inputs",
    {
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
        accept: { "text/plain": [".*"] },
      }),
      submit: {
        ...button(
          () => {
            run();
            if (autoplay) {
              set({ time: 0 });
              setPlaying(true);
            }
          },
          {
            disabled: !agentCount || submitDisabled || buffering,
          }
        ),
        label: buffering ? `Simulating (Step ${length})` : "Simulate",
      },
    },
    [submitDisabled, buffering, agentCount, length]
  );

  const [{ time, autoplay }, set, get] = useControls(
    "Playback",
    () => ({
      autoplay: { value: true, label: "Autoplay" },
      time: {
        value: 0,
        min: 0,
        max: length,
        step: 1,
        label: "Time",
        disabled: !length,
      },
      speed: {
        value: 1,
        min: 1,
        max: 20,
        step: 1,
        label: "Playback speed",
      },
      play: {
        ...button(() => setPlaying(!playing), { disabled: !length }),
        label: playing ? "Pause" : "Play",
      },
    }),
    [length, playing]
  );

  useEffect(() => {
    if (playing) {
      const frame = 1000 / 10;
      let ta = now();
      const interval = setInterval(() => {
        const tb = now();
        if (!buffering && get("time") === store.get(lengthAtom)) {
          setPlaying(false);
          return;
        }
        set({
          time:
            min([
              get("time") + max([1, get("speed") * round((tb - ta) / frame)])!,
              store.get(lengthAtom),
            ]) ?? 0,
        });
        ta = tb;
      }, frame);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, buffering]);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Leva
        theme={{
          fontSizes: { root: "12px" },
          space: { rowGap: "8px" },
          sizes: {
            folderTitleHeight: "32px",
            numberInputMinWidth: "90px",
            rowHeight: "32px",
            rootWidth: "400px",
            controlWidth: "240px",
          },
          fonts: {
            mono: "Geist Mono",
          },
        }}
      />
      <Stage time={time} />
    </div>
  );
}

export default App;
