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

  meshes
    .filter((mesh) => !mesh.material.transparent)
    .map((mesh) => {
      remapImages({ mesh, images, uvs: uvs.get(mesh), textures });
    });

  const geometries = meshes.map(mesh => mesh.geometry);
  for (const mesh of meshes) {
    console.log(
      mesh.name,
      mesh.geometry,
      Object.keys(mesh.geometry.attributes),
      mesh.geometry.morphTargetsRelative
    );
    mesh.geometry.morphTargetsRelative = false;
    mesh.geometry.morphAttributes = {};
    if (!mesh.geometry.attributes.uv2) {
      mesh.geometry.setAttribute('uv2', mesh.geometry.attributes.uv);
    }
  }
  const combinedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries);

  const combinedMaterial = new THREE.MeshStandardMaterial();
  combinedMaterial.copy(meshes[0].material);
  for (const [mapName, texture] of textures) {
    combinedMaterial[mapName] = texture;
  }
  const combinedMesh = new THREE.SkinnedMesh(combinedGeometry, combinedMaterial);
  const skeleton = cloneSkeleton(meshes[0])
  combinedMesh.bind(skeleton)
  combinedMesh.add(skeleton.bones[0]);

  return combinedMesh;
}
