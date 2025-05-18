import { useGLTF } from "@react-three/drei";
import { head, values } from "lodash";
import { useMemo } from "react";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export function useModel(path: string) {
  const { meshes, materials } = useGLTF(path);

  return {
    geometry: useMemo(
      () => mergeGeometries(values(meshes).map((h) => h.geometry)),
      [meshes]
    ),
    material: useMemo(() => head(values(materials)), [materials]),
  };
}
