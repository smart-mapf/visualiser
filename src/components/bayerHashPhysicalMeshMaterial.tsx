import {
  MeshPhysicalMaterial,
  MeshPhysicalMaterialParameters,
  MeshDepthMaterial,
  RGBADepthPacking,
} from "three";

export const bayerHashPhysicalMeshMaterial = (
  options: MeshPhysicalMaterialParameters
) => {
  const material = new MeshPhysicalMaterial({
    alphaTest: 1,
    opacity: 1,
    ...options,
    transparent: true,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      "void main() {",
      `
    attribute float bayerHash;
    varying float vInstanceOpacity;

    void main() {
      vInstanceOpacity = bayerHash;
    `
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "void main() {",
      `
    varying float vInstanceOpacity;

    // Bayer-style dither pattern
    float ditherPattern(vec2 coord) {
      int x = int(mod(coord.x, 4.0));
      int y = int(mod(coord.y, 4.0));
      int index = x + y * 4;

      float threshold = 0.0;
      switch(index) {
        case 0: threshold = 0.0 / 16.0; break;
        case 1: threshold = 8.0 / 16.0; break;
        case 2: threshold = 2.0 / 16.0; break;
        case 3: threshold = 10.0 / 16.0; break;
        case 4: threshold = 12.0 / 16.0; break;
        case 5: threshold = 4.0 / 16.0; break;
        case 6: threshold = 14.0 / 16.0; break;
        case 7: threshold = 6.0 / 16.0; break;
        case 8: threshold = 3.0 / 16.0; break;
        case 9: threshold = 11.0 / 16.0; break;
        case 10: threshold = 1.0 / 16.0; break;
        case 11: threshold = 9.0 / 16.0; break;
        case 12: threshold = 15.0 / 16.0; break;
        case 13: threshold = 7.0 / 16.0; break;
        case 14: threshold = 13.0 / 16.0; break;
        case 15: threshold = 5.0 / 16.0; break;
      }

      return threshold;
    }

    void main() {
  `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <alphatest_fragment>",
      `
      float alpha = vInstanceOpacity;
      if (alpha < ditherPattern(gl_FragCoord.xy)) discard;
    `
    );
  };

  const depthMaterial = new MeshDepthMaterial({
    depthPacking: RGBADepthPacking,
    alphaTest: 0.5,
  });

  depthMaterial.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      "void main() {",
      `
    attribute float bayerHash;
    varying float vInstanceOpacity;

    void main() {
      vInstanceOpacity = bayerHash;
    `
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "void main() {",
      `

    varying float vInstanceOpacity;

    float ditherPattern(vec2 coord) {
      int x = int(mod(coord.x, 4.0));
      int y = int(mod(coord.y, 4.0));
      int index = x + y * 4;
      float threshold = 0.0;
      switch(index) {
        case 0: threshold = 0.0 / 16.0; break;
        case 1: threshold = 8.0 / 16.0; break;
        case 2: threshold = 2.0 / 16.0; break;
        case 3: threshold = 10.0 / 16.0; break;
        case 4: threshold = 12.0 / 16.0; break;
        case 5: threshold = 4.0 / 16.0; break;
        case 6: threshold = 14.0 / 16.0; break;
        case 7: threshold = 6.0 / 16.0; break;
        case 8: threshold = 3.0 / 16.0; break;
        case 9: threshold = 11.0 / 16.0; break;
        case 10: threshold = 1.0 / 16.0; break;
        case 11: threshold = 9.0 / 16.0; break;
        case 12: threshold = 15.0 / 16.0; break;
        case 13: threshold = 7.0 / 16.0; break;
        case 14: threshold = 13.0 / 16.0; break;
        case 15: threshold = 5.0 / 16.0; break;
      }
      return threshold;
    }

    void main() {
  `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <alphatest_fragment>",
      `
      float alpha = vInstanceOpacity;
      if (alpha < ditherPattern(gl_FragCoord.xy)) discard;
      `
    );
  };

  return { material, depthMaterial };
};
