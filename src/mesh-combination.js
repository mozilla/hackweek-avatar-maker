import * as THREE from "three";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils";
import { findChildrenByType } from "./utils";
import { createTextureAtlas } from "./create-texture-atlas";
import { remapUVs } from "./remap-uvs";
import { cloneSkeleton } from "./export";

function fillMissingAttributes(geometries) {
  for (const geometry of geometries) {
    geometry.morphTargetsRelative = true; // TODO: What if they aren't?
    geometry.morphAttributes = {};
    if (!geometry.attributes.uv2) {
      geometry.setAttribute("uv2", geometry.attributes.uv);
    }
  }
  return geometries;
}

export async function combine({ avatar }) {
  // TODO: Transparent meshes
  const meshes = findChildrenByType(avatar, "SkinnedMesh").filter((mesh) => !mesh.material.transparent);

  const { textures, uvs } = await createTextureAtlas({ meshes });

  meshes.forEach((mesh) => {
    remapUVs({ mesh, uvs: uvs.get(mesh) });
  });

  const geometries = meshes.map((mesh) => mesh.geometry);
  fillMissingAttributes(geometries);
  const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);

  const material = new THREE.MeshStandardMaterial();
  material.map = textures["diffuse"];
  material.normalMap = textures["normal"];
  material.aoMap = textures["orm"];
  material.roughnessMap = textures["orm"];
  material.metalnessMap = textures["orm"];
  const mesh = new THREE.SkinnedMesh(geometry, material);

  const skeleton = cloneSkeleton(meshes[0]);
  mesh.bind(skeleton);
  mesh.add(skeleton.bones[0]);

  console.log("textures are", textures);
  console.log("material is ", material);
  console.log("mesh is ", mesh);

  return mesh;
}
