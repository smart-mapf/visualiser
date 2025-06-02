import { useState } from "react";
import { useRafLoop } from "react-use";
import { lerp } from "utils";

export function useLerp(target: number, speed: number = 5): number {
  const [v, setV] = useState<number>(target);
  useRafLoop(() => {
    setV((v0) => lerp(v0, target, speed * 0.1));
  });
  return v;
}
