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
  return function remapImages({ mesh, images, uvs }) {
    const material = new THREE.MeshStandardMaterial().copy(mesh.material);
    const geometry = mesh.geometry.clone();
    const newMesh = new THREE.SkinnedMesh().copy(mesh)
    newMesh.material = material;
    newMesh.geometry = geometry;


    // Swap image maps
    for (const [name, image] of images) {
      if (material[name] && material[name].image) {
        material[name] = new THREE.Texture(image);
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
