import * as THREE from "three";

export const remapImages = (function () {
  const MAP_NAMES = [
    "map",
    "aoMap",
    "roughnessMap",
    "metalnessMap",
    // "lightMap",
    // "emissiveMap",
    // "bumpMap",
    // "displacementMap",
    // "alphaMap",
    // "envMap",
  ];
  return function remapImages({ mesh, images, uvs, textures }) {
    const geometry = mesh.geometry.clone();
    mesh.geometry = geometry;
    const material = new THREE.MeshBasicMaterial().copy(mesh.material);
    mesh.material = material;

    // Swap image maps
    for (const [name, image] of images) {
      if (material[name] && material[name].image) {
        let texture = textures.get(name);
        if (!texture) {
          texture = material[name].clone();
          texture.image = image;
          textures.set(name, texture);
        }

        material[name] = texture;
      }
    }
    // Fix for metalness and roughness having to be in the same texture
    material.roughnessMap = material.metalnessMap;

    // Remap uv coordinates
    const { min, max } = uvs;
    const uv = geometry.attributes.uv;
    if (uv) {
      for (let i = 0; i < uv.array.length; i += 2) {
        uv.array[i] = lerp(uv.array[i], 0, 1, min.x, max.x);
        uv.array[i + 1] = lerp(uv.array[i + 1], 0, 1, min.y, max.y);
      }
    }
    const uv2 = geometry.attributes.uv2;
    if (uv2) {
      for (let i = 0; i < uv2.array.length; i += 2) {
        uv2.array[i] = lerp(uv2.array[i], 0, 1, min.x, max.x);
        uv2.array[i + 1] = lerp(uv2.array[i + 1], 0, 1, min.y, max.y);
      }
    }
  };
})();

function lerp(t, min, max, newMin, newMax) {
  const progress = (t - min) / (max - min);
  return newMin + progress * (newMax - newMin);
}
