import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { findChildrenByType, findChildByName, describeObject3D } from "./utils";

function cloneSkeleton(skinnedMesh) {
  const boneClones = new Map();

  for (const bone of skinnedMesh.skeleton.bones) {
    const clone = bone.clone(false);
    boneClones.set(bone, clone);
  }

  // Preserve original bone structure
  // Assume bones[0] is root bone
  skinnedMesh.skeleton.bones[0].traverse((o) => {
    if (o.type !== "Bone") return;
    const clone = boneClones.get(o);
    for (const child of o.children) {
      clone.add(boneClones.get(child));
    }
  });

  return new THREE.Skeleton(skinnedMesh.skeleton.bones.map((b) => boneClones.get(b)));
}

function ensureHubsComponents(userData) {
  if (!userData.gltfExtensions) {
    userData.gltfExtensions = {};
  }
  if (!userData.gltfExtensions.MOZ_hubs_components) {
    userData.gltfExtensions.MOZ_hubs_components = {};
  }
  return userData;
}

export function combineHubsComponents(a, b) {
  ensureHubsComponents(a);
  ensureHubsComponents(b);
  if (a.gltfExtensions.MOZ_hubs_components)
    a.gltfExtensions.MOZ_hubs_components = Object.assign(
      a.gltfExtensions.MOZ_hubs_components,
      b.gltfExtensions.MOZ_hubs_components
    );

  return a;
}

export const exportGLTF = (function () {
  const exporter = new GLTFExporter();
  return function exportGLTF(object3D, binary) {
    exporter.parse(
      object3D,
      (gltf) => {
        if (binary) {
          const blob = new Blob([gltf], { type: "application/octet-stream" });
          const el = document.createElement("a");
          el.style.display = "none";
          el.href = URL.createObjectURL(blob);
          el.download = "custom_avatar.glb";
          el.click();
          el.remove();
        } else {
          console.log(gltf);
        }
      },
      { binary }
    );
  };
})();

function cloneIntoAvatar(avatarGroup) {
  // Combine the root "Scene" nodes
  const scenes = avatarGroup.children
    .map((o) => {
      return findChildByName(o, "Scene");
    })
    .filter((o) => !!o);
  console.log(scenes);
  const clonedScene = scenes[0].clone(false);
  for (const scene in scenes) {
    Object.assign(clonedScene.userData, scene.userData);
  }

  // Combine the "AvatarRoot" nodes
  const avatarRoots = avatarGroup.children
    .map((o) => {
      return findChildByName(o, "AvatarRoot");
    })
    .filter((o) => !!o);
  const clonedAvatarRoot = avatarRoots[0].clone(false);
  for (const avatarRoot of avatarRoots) {
    clonedAvatarRoot.userData = combineHubsComponents(clonedAvatarRoot.userData, avatarRoot.userData);
  }

  // Clone skinned meshes, bind them to a new skeleton
  const clonedSkinnedMeshes = findChildrenByType(avatarGroup, "SkinnedMesh").map((o) => {
    return o.clone(false);
  });
  const clonedSkeleton = cloneSkeleton(clonedSkinnedMeshes[0]);
  for (const skinnedMesh of clonedSkinnedMeshes) {
    skinnedMesh.bind(clonedSkeleton);
  }

  // Combine clones
  clonedScene.add(clonedAvatarRoot);
  clonedAvatarRoot.add(clonedSkeleton.bones[0]); // Assume bones[0] is root bone
  for (const skinnedMesh of clonedSkinnedMeshes) {
    clonedAvatarRoot.add(skinnedMesh);
  }
  return clonedScene;
}

export function exportAvatar(avatarGroup) {
  const avatar = cloneIntoAvatar(avatarGroup);
  console.log(describeObject3D(avatar));
  exportGLTF(avatar, false);
  exportGLTF(avatar, true);
}
