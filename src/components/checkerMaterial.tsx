import { memoize } from "lodash";
import {
  Color,
  MeshStandardMaterial,
  NearestFilter,
  NearestMipMapNearestFilter,
  RepeatWrapping,
  Texture,
} from "three";

export const checkerMaterial = memoize((scale: number = 1) => {
  const map = new Texture();
  const material = new MeshStandardMaterial({
    map,
    color: new Color(0xffffff),
    roughness: 0.5,
    roughnessMap: new Texture(),
  });

  // Setup texture tiling and filtering
  map.wrapS = RepeatWrapping;
  map.wrapT = RepeatWrapping;
  map.magFilter = NearestFilter;
  map.minFilter = NearestMipMapNearestFilter;

  material.onBeforeCompile = (shader) => {
    // Add varyings
    shader.vertexShader =
      `
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
    ` +
      shader.vertexShader.replace(
        "#include <worldpos_vertex>",
        `
        #include <worldpos_vertex>
        vWorldPosition = worldPosition.xyz;
        vWorldNormal = normalize(round(normalMatrix * normal));
      `
      );

    // Add uniforms and function
    shader.fragmentShader =
      `
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      uniform float uTileScale;

      float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
      vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
      vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

      float noise(vec3 p){
        vec3 a = floor(p);
        vec3 d = p - a;
        d = d * d * (3.0 - 2.0 * d);

        vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
        vec4 k1 = perm(b.xyxy);
        vec4 k2 = perm(k1.xyxy + b.zzww);

        vec4 c = k2 + a.zzzz;
        vec4 k3 = perm(c);
        vec4 k4 = perm(c + 1.0);

        vec4 o1 = fract(k3 * (1.0 / 41.0));
        vec4 o2 = fract(k4 * (1.0 / 41.0));

        vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
        vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

        return o4.y * d.y + o4.x * (1.0 - d.y);
      }

      float sampleWorld(sampler2D tex, vec3 worldPos, vec3 normal, float scale) {
        return noise(vec3(floor(worldPos.x * 64.0), floor(worldPos.y * 64.0), floor(worldPos.z * 64.0)));
}
    ` + shader.fragmentShader;

    // Replace default UV-based sampling
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      `
        float fac = sampleWorld(map, vWorldPosition, vWorldNormal, uTileScale);
        float fac2 = sampleWorld(map, vec3(vWorldPosition.x+1.0, vWorldPosition.y+1.0, vWorldPosition.z+1.0), vWorldNormal, uTileScale);
        diffuseColor *= 0.8 + fac * 0.05;
      `
    );

    // Replace roughness map sampling
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <roughnessmap_fragment>",
      `
      float roughnessFactor = 0.5;
      #ifdef USE_ROUGHNESSMAP
        roughnessFactor *= 0.6 + fac2 * 0.2;
      #endif
    `
    );

    // Uniform for tile scale
    shader.uniforms.uTileScale = { value: scale };
    material.userData.shader = shader;
  };

  return material;
});
