import { useMapFile } from "client/run";
import { useMap } from "hooks/useMap";
import { Suspense } from "react";
import { id } from "utils";
import { Agents } from "./Agents";
import { Domain } from "./Domain";

export function Contents() {
  const [mapFile] = useMapFile();
  const { data: map } = useMap(mapFile);
  return (
    <Suspense>
      <Domain {...map} key={id(map?.file)}>
        <Agents />
      </Domain>
    </Suspense>
  );
}
