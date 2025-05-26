import { pick } from "lodash";

export function id(file?: File | null) {
  return JSON.stringify(pick(file, "lastModified", "name", "size"));
}

export const basename = (path: string, noExtension = false) => {
  const parts = path.split("/");
  const name = parts[parts.length - 1];
  return noExtension ? name.split(".")[0] : name;
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function lerpRadians(a: number, b: number, t: number) {
  const TAU = Math.PI * 2;

  // Normalize the difference to the range [-π, π]
  let delta = ((b - a + Math.PI) % TAU) - Math.PI;

  // Correct for negative modulo results
  if (delta < -Math.PI) delta += TAU;

  return a + delta * t;
}
