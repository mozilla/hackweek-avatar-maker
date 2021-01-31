import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import logger from "./logger";
import constants from "./constants";
import assets from "./assets";
import { describeObject3D } from "./utils";
import { combineAvatarParts, exportGLTF } from "./export";

const avatarParts = Object.keys(assets);

const state = {
  DOMContentLoaded: false,
  shouldResize: false,
  didInit: false,
  scene: null,
  camera: null,
  renderer: null,
  // TODO: Important to initialize each part to null?
  avatarNodes: {},
  avatarConfig: {},
  newAvatarConfig: {},
  shouldApplyNewAvatarConfig: false,
  shouldExportAvatar: false,
};
window.gameState = state;

window.addEventListener("DOMContentLoaded", () => {
  state.DOMContentLoaded = true;
});
window.onresize = () => {
  state.shouldResize = true;
};
document.addEventListener(constants.avatarConfigChanged, (e) => {
  state.newAvatarConfig = e.detail.avatarConfig;
  state.shouldApplyNewAvatarConfig = true;
});
document.addEventListener(constants.exportAvatar, () => {
  state.shouldExportAvatar = true;
});

const loadGLTF = (function () {
  const loader = new GLTFLoader();
  return function loadGLTF(url) {
    return new Promise(function (resolve, reject) {
      loader.load(
        url,
        function (gltf) {
          resolve(gltf);
          // gltf.animations; // Array<THREE.AnimationClip>
          // gltf.scene; // THREE.Group
          // gltf.scenes; // Array<THREE.Group>
          // gltf.cameras; // Array<THREE.Camera>
          // gltf.asset; // Object
        },
        function (xhr) {
          logger.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        },
        function (error) {
          logger.log("An error happened");
          reject(error);
        }
      );
    });
  };
})();

function init() {
  THREE.Cache.enabled = true;
  const scene = new THREE.Scene();
  state.scene = scene;
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0.25, 1.5);
  state.camera = camera;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0, 2, 1);
  scene.add(directionalLight);

  const renderer = new THREE.WebGLRenderer();
  state.renderer = renderer;
  renderer.setSize(window.innerWidth, window.innerHeight);
  // TODO: Square this with react
  document.body.appendChild(renderer.domElement);

  state.avatarGroup = new THREE.Group();
  scene.add(state.avatarGroup);
  for (const part of avatarParts) {
    state.avatarNodes[part] = new THREE.Group();
    state.avatarGroup.add(state.avatarNodes[part]);
  }
}

function removeBones(node) {
  const childrenToRemove = [];
  for (const child of node.children) {
    if (child.type === "Bone") {
      childrenToRemove.push(child);
    } else {
      removeBones(child);
    }
  }
  for (const child of childrenToRemove) {
    node.remove(child);
  }
}

function findSkeleton(node) {
  if (node.type === "SkinnedMesh") return node.skeleton;
  for (const child of node.children) {
    const skeleton = findSkeleton(child);
    if (skeleton) return skeleton;
  }
}

function setSkeleton(node, skeleton) {
  node.traverse((child) => {
    if (child.type === "SkinnedMesh") {
      child.skeleton = skeleton;
    }
  });
}

function renameAvatarRoot(node) {
  node.traverse((child) => {
    if (child.name === "AvatarRoot") {
      child.name = "";
    }
  });
}

function exportAvatar() {
  const exporter = new GLTFExporter();
  const avatarGroupClone = state.avatarGroup.clone(true);
  const childWithSkeleton = avatarGroupClone.children.find((child) => !!findSkeleton(avatarGroupClone));
  const skeleton = findSkeleton(childWithSkeleton);
  console.log(childWithSkeleton,  skeleton);
  for (const child of avatarGroupClone.children) {
    if (child === childWithSkeleton) continue;
    removeBones(child);
    setSkeleton(child, skeleton);
    renameAvatarRoot(child);
  }
  const exportBinary = false;
  exporter.parse(
    avatarGroupClone,
    (gltf) => {
      if (exportBinary) {
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
    { binary: exportBinary }
  );
}

// TODO: There are a few problems with this export process.
// 1) We do not want to destroy the avatarGroup because we want to allow future
// edits to the avatars. However, if we try to clone an avatar part that contains
// bones and a skinned mesh, the skinned mesh's skeleton refers to the original bones.
// If we want to clone the part, we need to match old bones to new bones. Currently,
// we just operate on the original avatarGroup nodes.
//
// 2) Currently, I only take a single skinned mesh for each avatar part.
// However, it looks like one avatar part might contain multiple skinned meshes.
// An example of this can be seen with the eyes.
//
// 3) I don't know what happens to animations.
//
// 4) I don't know what happens if there are supposed to be duplicate Hubs Components
// or if the gltf export settings are _different_ for two of the parts. I think we
// can ignore that for now.
function exportAvatar2() {
  console.log("BEFORE:\n", describeObject3D(state.avatarGroup));
  const avatar = combineAvatarParts(state.avatarGroup);
  console.log("AFTER:\n", describeObject3D(avatar));

  //  exportGLTF(avatar, false);
  exportGLTF(avatar, true);
}

function tick(time) {
  {
    if (state.DOMContentLoaded && !state.didInit) {
      state.didInit = true;
      init();
    }
    if (!state.didInit) {
      return;
    }
  }

  {
    if (state.shouldResize) {
      state.shouldResize = false;
      state.renderer.setSize(window.innerWidth, window.innerHeight);
      state.camera.aspect = window.innerWidth / window.innerHeight;
      state.camera.updateProjectionMatrix();
    }
  }

  {
    // Render scene
    const { renderer, scene, camera } = state;
    renderer.render(scene, camera);
    // TODO: Do we need to update the camera aspect and call updateProjectionMatrix?
  }

  {
    if (state.shouldApplyNewAvatarConfig) {
      state.shouldApplyNewAvatarConfig = false;
      for (const part of avatarParts) {
        if (state.newAvatarConfig[part] !== state.avatarConfig[part]) {
          state.avatarNodes[part].clear();
          if (state.newAvatarConfig[part] !== null) {
            loadGLTF(`assets/${state.newAvatarConfig[part]}.glb`).then((gltf) =>
              // TODO: Multiple of these might be in flight at any given time.
              state.avatarNodes[part].add(gltf.scene)
            );
          }
          state.avatarConfig[part] = state.newAvatarConfig[part];
        }
      }
    }
  }

  {
    if (state.shouldExportAvatar) {
      state.shouldExportAvatar = false;
      //exportAvatar();
      exportAvatar2();
    }
  }

  {
    window.requestAnimationFrame(tick);
  }
}

window.requestAnimationFrame(tick);
