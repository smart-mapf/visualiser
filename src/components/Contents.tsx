import { useTime } from "client/play";
import { useMapFile } from "client/run";
import { useMap } from "hooks/useMap";
import { useState, useEffect, Suspense } from "react";
import { lerp, id } from "utils";
import { Agents } from "./Agents";
import { Domain } from "./Domain";

export function Contents() {
  const [time] = useTime();
  const [t, setT] = useState(time);

  useEffect(() => {
    let r: number;
    const f = () => {
      setT((t) => lerp(t, time, 0.1));
      r = requestAnimationFrame(f);
    };
    f();
    return () => cancelAnimationFrame(r);
  }, [time]);

  const [mapFile] = useMapFile();
  const { data: map } = useMap(mapFile);
  return (
    <Suspense>
      <Domain {...map} key={id(map?.file)}>
        <Agents time={t} />
      </Domain>
    </Suspense>
  );
}
