import * as THREE from "three";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils";

import { findChildrenByType } from "./utils";
import { createTextureAtlas } from "./create-texture-atlas";
import { remapImages } from "./remap-images";
import { cloneSkeleton } from "./export";

export async function combine({ avatar }) {
  const meshes = findChildrenByType(avatar, "SkinnedMesh");

  const { images, uvs } = await createTextureAtlas({ meshes });

  const textures = new Map();
  for (const [name, image] of images) {
    const mesh = meshes.find((mesh) => mesh.material[name] && mesh.material[name].image);
    const material = mesh && mesh.material;
    if (material) {
      const texture = material[name].clone();
      texture.image = image;
      textures.set(name, texture);
    }
  }
  // Fix for metalness and roughness having to be in the same texture
  textures.set("metalnessMap", textures.get("roughnessMap"));

  meshes
    .filter((mesh) => !mesh.material.transparent)
    .map((mesh) => {
      remapImages({ mesh, images, uvs: uvs.get(mesh), textures });
    });

  const geometries = meshes.map((mesh) => mesh.geometry);
  for (const mesh of meshes) {
    mesh.geometry.morphTargetsRelative = false;
    mesh.geometry.morphAttributes = {};
    if (!mesh.geometry.attributes.uv2) {
      mesh.geometry.setAttribute("uv2", mesh.geometry.attributes.uv);
    }
  }
  const combinedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries);

  const combinedMaterial = new THREE.MeshStandardMaterial();
  console.log("Mesh 0 is ", meshes[0]);
  combinedMaterial.copy(meshes[0].material);
  for (const [mapName, texture] of textures) {
    combinedMaterial[mapName] = texture;
  }
  const combinedMesh = new THREE.SkinnedMesh(combinedGeometry, combinedMaterial);

  const skeleton = cloneSkeleton(meshes[0]);
  combinedMesh.bind(skeleton);
  combinedMesh.add(skeleton.bones[0]);

  return combinedMesh;
}
