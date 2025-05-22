import { speedAtom, useAutoplay, usePlaying, useSpeed } from "client/play";

import { lengthAtom, timeAtom, useTime, useTimespan } from "client/store";
import { button, useControls } from "leva";
import { max, min, now, round } from "lodash";
import { store } from "main";
import { Suspense, useEffect } from "react";

export function Playback() {
  const [playing, setPlaying] = usePlaying();
  const [speed, setSpeed] = useSpeed();
  const [autoplay, setAutoplay] = useAutoplay();
  const [time, setTime] = useTime();
  const timespan = useTimespan();

  const [, set] = useControls(
    "Playback",
    () => ({
      autoplay: {
        onChange: setAutoplay,
        value: autoplay,
        label: "Autoplay",
      },
      time: {
        onChange: setTime,
        value: time ?? 0,
        min: 0,
        max: timespan,
        step: 1,
        label: "Time",
        disabled: !timespan,
      },
      speed: {
        value: speed,
        onChange: setSpeed,
        min: 1,
        max: 20,
        step: 1,
        label: "Playback speed",
      },
      play: {
        ...button(() => setPlaying((c) => !c), { disabled: !timespan }),
        label: playing ? "Pause" : "Play",
      },
    }),
    [time, autoplay, speed, playing, timespan]
  );

  useEffect(() => {
    if (!playing) return;
    const frame = 1000 / 10;
    let ta = now();
    const interval = setInterval(() => {
      const tb = now();
      const next =
        min([
          store.get(timeAtom) +
            max([1, store.get(speedAtom) * round((tb - ta) / frame)])!,
          store.get(lengthAtom),
        ]) ?? 0;
      set({ time: next });
      setTime(next);
      ta = tb;
    }, frame);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);
  return <Suspense fallback={null} />;
}
