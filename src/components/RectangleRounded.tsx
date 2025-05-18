import { BufferAttribute } from "three";
import { BufferGeometry } from "three/src/Three.Core.js";

export function RectangleRounded(w: number, h: number, r: number, s: number) {
  // width, height, radiusCorner, smoothness
  const pi2 = Math.PI * 2;
  const n = (s + 1) * 4; // number of segments
  let indices = [];
  let positions = [];
  let uvs = [];
  let qu, sgx, sgy, x, y;

  for (let j = 1; j < n + 1; j++) indices.push(0, j, j + 1); // 0 is center
  indices.push(0, n, 1);
  positions.push(0, 0, 0); // rectangle center
  uvs.push(0.5, 0.5);
  for (let j = 0; j < n; j++) contour(j);

  const geometry = new BufferGeometry();
  geometry.setIndex(new BufferAttribute(new Uint32Array(indices), 1));
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(positions), 3)
  );
  geometry.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));

  return geometry;

  function contour(j) {
    qu = Math.trunc((4 * j) / n) + 1; // quadrant  qu: 1..4
    sgx = qu === 1 || qu === 4 ? 1 : -1; // signum left/right
    sgy = qu < 3 ? 1 : -1; // signum  top / bottom
    x = sgx * (w / 2 - r) + r * Math.cos((pi2 * (j - qu + 1)) / (n - 4)); // corner center + circle
    y = sgy * (h / 2 - r) + r * Math.sin((pi2 * (j - qu + 1)) / (n - 4));

    positions.push(x, y, 0);
    uvs.push(0.5 + x / w, 0.5 + y / h);
  }
}
