import { useThree, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { DirectionalLight } from "three";

export function Light() {
  const { camera, scene } = useThree();
  const light = useRef<DirectionalLight>();
  useFrame(() => {
    if (!light.current) return;
    light.current.position.set(
      camera.position.x + 200,
      100,
      camera.position.z + 100
    );
    light.current.target.position.set(camera.position.x, 0, camera.position.z);
    scene.add(light.current.target);
  });
  return (
    <directionalLight
      ref={light}
      castShadow
      shadow-camera-left={-50}
      shadow-camera-right={50}
      shadow-camera-top={50}
      shadow-camera-bottom={-50}
      shadow-mapSize={[2048, 2048]}
      intensity={1}
    />
  );
}
