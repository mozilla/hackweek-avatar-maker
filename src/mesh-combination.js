import * as THREE from "three";
import { findChildrenByType } from "./utils";
import { createTextureAtlas } from "./create-texture-atlas";
import { remapUVs } from "./remap-uvs";
import { cloneSkeleton } from "./export";
import { mergeGeometry } from "./merge-geometry";
import constants from "./constants";

export async function combine({ avatar }) {
  // TODO: Account for meshes that cannot be combined. E.g. uv-scroll
  const meshes = findChildrenByType(avatar, "SkinnedMesh").filter((mesh) => !mesh.material.transparent);

  const { textures, uvs } = await createTextureAtlas({ meshes });
  meshes.forEach((mesh) => remapUVs({ mesh, uvs: uvs.get(mesh) }));

  meshes.forEach((mesh) => {
    const geometry = mesh.geometry;
    if (!geometry.attributes.uv2) {
      geometry.attributes.uv2 = geometry.attributes.uv;
    }
    // Remove the "active" morph attributes to before merging
    // (These BufferAttributes are not lost; they remain in geometry.morphAttributes)
    for (let i = 0; i < 8; i++) {
      delete geometry.attributes[`morphTarget${i}`];
      delete geometry.attributes[`morphNormal${i}`];
    }
  });

  const { source, dest } = mergeGeometry({ meshes });

  const geometry = new THREE.BufferGeometry();
  geometry.attributes = dest.attributes;
  geometry.morphAttributes = dest.morphAttributes;
  geometry.morphTargetsRelative = true;
  geometry.setIndex(dest.index);

  const material = new THREE.MeshStandardMaterial({
    map: textures["diffuse"],
    normalMap: textures["normal"],
    aoMap: textures["orm"],
    roughnessMap: textures["orm"],
    metalnessMap: textures["orm"],
  });

  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.name = constants.combinedMeshName;
  mesh.morphTargetInfluences = dest.morphTargetInfluences;
  mesh.morphTargetDictionary = dest.morphTargetDictionary;

  // Add (unmerged) transparent meshes
  const transparentMeshes = findChildrenByType(avatar, "SkinnedMesh").filter((mesh) => mesh.material.transparent);
  const clones = transparentMeshes.map((o) => {
    return o.clone(false);
  });

  const skeleton = cloneSkeleton(meshes[0]);
  mesh.bind(skeleton);
  clones.forEach((clone) => {
    clone.bind(skeleton);
  });

  const group = new THREE.Object3D();
  group.name = "AvatarRoot";
  group.animations = dest.animations;
  group.add(mesh);
  group.add(skeleton.bones[0]);
  clones.forEach((clone) => {
    group.add(clone);
  });

  group.userData = {
    gltfExtensions: {
      MOZ_hubs_components: {
        "loop-animation": {
          clip: "idle_eyes,Blinks",
          paused: false,
        },
      },
    },
  };
  return group;
}
