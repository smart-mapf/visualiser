import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

export function CameraControls() {
  const controlsRef = useRef<any>();

  useFrame(() => {
    const controls = controlsRef.current;
    if (controls) {
      // Clamp target Y to 0 (or any minimum)
      if (controls.target.y < 0) {
        controls.target.y = 0;
        controls.update();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      dampingFactor={0.4}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2.1}
    />
  );
}
