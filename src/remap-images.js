import * as THREE from "three";

export const remapImages = (function () {
  return function remapImages({ mesh, uvs, textures }) {
    // TODO: May not need to clone / create new material and assign it to the mesh.
    // Probably can mutate in place.
    const geometry = mesh.geometry.clone();
    mesh.geometry = geometry;
    const material = new THREE.MeshStandardMaterial().copy(mesh.material);
    mesh.material = material;

    // TODO: We don't care about these meshes materials once we combine their geometries.
    // We can skip this step.
    // Swap image maps
    for (const [name, texture] of textures) {
      if (material[name] && material[name].image) {
        material[name] = texture;
      }
    }

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
