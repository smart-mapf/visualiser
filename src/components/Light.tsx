import { useThree } from "@react-three/fiber";
import { clamp, floor } from "lodash";
import { useRef } from "react";
import { useInterval } from "react-use";
import { DirectionalLight } from "three";

export function Light() {
  const { camera, scene } = useThree();
  const light = useRef<DirectionalLight>();
  useInterval(() => {
    if (!light.current) return;
    light.current.position.set(
      floor(camera.position.x) + 100,
      100,
      floor(camera.position.z) + 50
    );
    light.current.target.position.set(
      floor(camera.position.x),
      0,
      floor(camera.position.z)
    );
    const y = floor(clamp(camera.position.y, 6, 10_000) * 3);
    light.current.shadow.camera.left = -y;
    light.current.shadow.camera.right = y;
    light.current.shadow.camera.top = -y;
    light.current.shadow.camera.bottom = y;
    light.current.shadow.camera.updateProjectionMatrix();
    scene.add(light.current.target);
  }, 1000 / 30);

  return (
    <>
      <ambientLight intensity={Math.PI / 2} color="#ade5ff" />
      <directionalLight
        ref={light}
        color="#fff2d9"
        castShadow
        shadow-bias={-0.0001}
        shadow-mapSize={[2048 * 1.5, 2048 * 1.5]}
        intensity={4}
      />
    </>
  );
}
