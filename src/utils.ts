import { pick } from "lodash";

export function id(file?: File | null) {
  return JSON.stringify(pick(file, "lastModified", "name", "size"));
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const lerpRadians = (a: number, b: number, t: number) =>
  a + (((((b - a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - a) * t;
