import { useGLTF } from "@react-three/drei";
import { values } from "lodash";
import { useMemo } from "react";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export function useModel() {
  const { meshes: high } = useGLTF("./robot-low.gltf");

  return useMemo(
    () => mergeGeometries(values(high).map((h) => h.geometry)),
    [high]
  );
}
