import { pick } from "lodash";

export function id(file?: File | null) {
  return JSON.stringify(pick(file, "lastModified", "name", "size"));
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function lerpRadians(A: number, B: number, w: number) {
  const CS = (1 - w) * Math.cos(A) + w * Math.cos(B);
  const SN = (1 - w) * Math.sin(A) + w * Math.sin(B);
  return Math.atan2(SN, CS);
}
