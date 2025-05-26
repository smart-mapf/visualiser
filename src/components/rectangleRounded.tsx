import { BufferGeometry, BufferAttribute } from "three";

export function rectangleRounded(w: number, h: number, r: number, s: number) {
  // width, height, radius corner, smoothness

  // helper const's
  const wi = w / 2 - r; // inner width
  const hi = h / 2 - r; // inner height
  const w2 = w / 2; // half width
  const h2 = h / 2; // half height
  const ul = r / w; // u left
  const ur = (w - r) / w; // u right
  const vl = r / h; // v low
  const vh = (h - r) / h; // v high

  const positions = [
    -wi,
    -h2,
    0,
    wi,
    -h2,
    0,
    wi,
    h2,
    0,
    -wi,
    -h2,
    0,
    wi,
    h2,
    0,
    -wi,
    h2,
    0,
    -w2,
    -hi,
    0,
    -wi,
    -hi,
    0,
    -wi,
    hi,
    0,
    -w2,
    -hi,
    0,
    -wi,
    hi,
    0,
    -w2,
    hi,
    0,
    wi,
    -hi,
    0,
    w2,
    -hi,
    0,
    w2,
    hi,
    0,
    wi,
    -hi,
    0,
    w2,
    hi,
    0,
    wi,
    hi,
    0,
  ];

  const uvs = [
    ul,
    0,
    ur,
    0,
    ur,
    1,
    ul,
    0,
    ur,
    1,
    ul,
    1,
    0,
    vl,
    ul,
    vl,
    ul,
    vh,
    0,
    vl,
    ul,
    vh,
    0,
    vh,
    ur,
    vl,
    1,
    vl,
    1,
    vh,
    ur,
    vl,
    1,
    vh,
    ur,
    vh,
  ];

  let phia = 0;
  let phib, xc, yc, uc, vc, cosa, sina, cosb, sinb;

  for (let i = 0; i < s * 4; i++) {
    phib = (Math.PI * 2 * (i + 1)) / (4 * s);

    cosa = Math.cos(phia);
    sina = Math.sin(phia);
    cosb = Math.cos(phib);
    sinb = Math.sin(phib);

    xc = i < s || i >= 3 * s ? wi : -wi;
    yc = i < 2 * s ? hi : -hi;

    positions.push(
      xc,
      yc,
      0,
      xc + r * cosa,
      yc + r * sina,
      0,
      xc + r * cosb,
      yc + r * sinb,
      0
    );

    uc = i < s || i >= 3 * s ? ur : ul;
    vc = i < 2 * s ? vh : vl;

    uvs.push(
      uc,
      vc,
      uc + ul * cosa,
      vc + vl * sina,
      uc + ul * cosb,
      vc + vl * sinb
    );

    phia = phib;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(positions), 3)
  );
  geometry.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));

  return geometry;
}
