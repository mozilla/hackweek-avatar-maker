import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";

function findChild({ candidates, predicate }) {
  if (!candidates.length) {
    return null;
  }

  const candidate = candidates.shift();
  if (predicate(candidate)) return candidate;

  candidates = candidates.concat(candidate.children);
  return findChild({ candidates, predicate });
}

function hasChild(container) {
  return container.children.length > 0;
}

function deconstruct(part) {
  const sceneNode = findChild({
    candidates: [part],
    predicate: (o) => {
      return o.type === "Group" && o.name === "Scene";
    },
  });

  const avatarRootNode = findChild({
    candidates: [part],
    predicate: (o) => {
      return o.name === "AvatarRoot";
    },
  });

  // TODO: Multiple skinned meshes (e.g. eyes)
  const skinnedMesh = findChild({
    candidates: [part],
    predicate: (o) => {
      return o.type === "SkinnedMesh";
    },
  });

  return {
    sceneNode,
    avatarRootNode,
    skinnedMesh,
  };
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

function combineHubsComponents(a, b) {
  ensureHubsComponents(a);
  ensureHubsComponents(b);
  if (a.gltfExtensions.MOZ_hubs_components)
    a.gltfExtensions.MOZ_hubs_components = Object.assign(
      a.gltfExtensions.MOZ_hubs_components,
      b.gltfExtensions.MOZ_hubs_components
    );

  return a;
}

function addIn(avatar, firstSkinnedMesh, { sceneNode, avatarRootNode, skinnedMesh }) {
  avatar.userData = Object.assign(avatar.userData, sceneNode.userData);
  avatar.children[0].userData = combineHubsComponents(avatar.children[0].userData, avatarRootNode.userData);
  skinnedMesh.bind(firstSkinnedMesh.skeleton);
  firstSkinnedMesh.parent.add(skinnedMesh);
  return avatar;
}

export function combineAvatarParts(avatarGroup) {
  // TODO: Clone instead of destroying the original structure.
  const parts = avatarGroup.children.filter(hasChild).map(deconstruct);
  if (!parts.length) {
    console.error("No avatar parts to combine");
    return;
  }

  const avatar = parts[0].sceneNode;

  for (let i = 1; i < parts.length; i++) {
    addIn(avatar, parts[0].skinnedMesh, parts[i]);
  }

  return avatar;
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
