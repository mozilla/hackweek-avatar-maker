import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import constants from "./constants";
import { exportAvatar } from "./export";
import { loadGLTF, forEachMaterial, generateEnvironmentMap, createSky } from "./utils";
import { createSnapshot, snapTo } from "./orbit-controls-utils";
import initialSnapshots from "./snapshots";

// TODO: Don't do this
function urlFor(value) {
  if (value.startsWith("blob")) {
    return value;
  } else {
    return `assets/${value}.glb`;
  }
}

const state = {
  DOMContentLoaded: false,
  shouldResize: true,
  didInit: false,
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  envMap: null,
  avatarNodes: {},
  avatarConfig: {},
  newAvatarConfig: {},
  shouldApplyNewAvatarConfig: false,
  shouldExportAvatar: false,
  shouldResetView: false,
  shouldSaveView: false,
  shouldGoNextView: false,
  shouldGoPreviousView: false,
  snapshots: initialSnapshots,
  viewIndex: 0,
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
document.addEventListener(constants.resetView, () => {
  state.shouldResetView = true;
});
document.addEventListener(constants.saveView, () => {
  state.shouldSaveView = true;
});
document.addEventListener(constants.deleteView, () => {
  state.shouldDeleteView = true;
});
document.addEventListener(constants.goNextView, () => {
  state.shouldGoNextView = true;
});
document.addEventListener(constants.goPreviousView, () => {
  state.shouldGoPreviousView = true;
});
document.addEventListener("keydown", (e) => {
  switch (e.key.toLowerCase()) {
    case "s":
      document.dispatchEvent(new CustomEvent(constants.saveView));
      break;
    case "d":
      document.dispatchEvent(new CustomEvent(constants.deleteView));
      break;
    case "k":
      document.dispatchEvent(new CustomEvent(constants.goPreviousView));
      break;
    case "j":
      document.dispatchEvent(new CustomEvent(constants.goNextView));
      break;
  }
});

function resetView() {
  state.controls.reset();
}

function init() {
  THREE.Cache.enabled = true;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x8b8b8a, 0.2);
  scene.background = new THREE.Color(0x8b8b8a);
  state.scene = scene;

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0.25, 1.5);
  state.camera = camera;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  // TODO: Square this with react
  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("scene"), antialias: true });
  state.renderer = renderer;

  const sky = createSky();
  state.envMap = generateEnvironmentMap(sky, renderer);

  const floor = new THREE.Mesh(new THREE.PlaneBufferGeometry(100, 100), new THREE.MeshStandardMaterial());
  floor.position.y = -0.2;
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target = new THREE.Vector3(0, 0.5, 0);
  controls.update();
  controls.saveState();
  state.controls = controls;

  state.avatarGroup = new THREE.Group();
  scene.add(state.avatarGroup);
}

async function loadIntoGroup(category, part, group) {
  const gltf = await loadGLTF(urlFor(part));
  if (state.avatarConfig[category] !== part) return;

  // TODO: Multiple of these might be in flight at any given time.
  gltf.scene.animations = gltf.animations;
  group.clear();
  group.add(gltf.scene);

  gltf.scene.traverse((obj) => {
    forEachMaterial(obj, (material) => {
      if (material.isMeshStandardMaterial) {
        material.envMap = state.envMap;
        material.needsUpdate = true;
      }
    });
  });
}

function tick(time) {
  {
    if (state.DOMContentLoaded && !state.didInit) {
      state.didInit = true;
      init();
    }
    if (!state.didInit) {
      requestAnimationFrame(tick);
      return;
    }
  }

  {
    if (state.shouldResize) {
      state.shouldResize = false;
      const { renderer, camera } = state;

      const width = renderer.domElement.parentNode.clientWidth;
      const height = renderer.domElement.parentNode.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }

  {
    if (state.shouldApplyNewAvatarConfig) {
      state.shouldApplyNewAvatarConfig = false;

      const categories = new Set(Object.keys(state.newAvatarConfig).concat(Object.keys(state.avatarConfig)));

      for (const category of categories) {
        if (!state.avatarNodes[category]) {
          state.avatarNodes[category] = new THREE.Group();
          state.avatarGroup.add(state.avatarNodes[category]);
        }

        if (state.newAvatarConfig[category] !== state.avatarConfig[category]) {
          if (state.newAvatarConfig[category] !== null) {
            loadIntoGroup(category, state.newAvatarConfig[category], state.avatarNodes[category]);
          } else {
            state.avatarNodes[category].clear();
          }
          state.avatarConfig[category] = state.newAvatarConfig[category];
        }
      }
    }
  }

  {
    if (state.shouldExportAvatar) {
      state.shouldExportAvatar = false;
      exportAvatar(state.avatarGroup);
    }
  }

  {
    if (state.shouldResetView) {
      state.shouldResetView = false;
      resetView();
    }
  }

  if (state.shouldSaveView) {
    state.shouldSaveView = false;
    const { snapshots, controls } = state;
    snapshots.push(createSnapshot(controls));
    state.viewIndex = snapshots.length - 1;
  }
  if (state.shouldDeleteView) {
    state.shouldDeleteView = false;
    const { snapshots, controls } = state;
    if (snapshots.length && state.viewIndex < snapshots.length) {
      snapshots.splice(state.viewIndex, 1);
      state.shouldGoPreviousView = true;
    }
  }

  if (state.shouldGoNextView) {
    state.shouldGoNextView = false;
    const { snapshots, controls } = state;
    if (snapshots.length) {
      state.viewIndex = (state.viewIndex + 1) % snapshots.length;
      snapTo(controls, snapshots[state.viewIndex]);
    }
  }
  if (state.shouldGoPreviousView) {
    state.shouldGoPreviousView = false;
    const { snapshots, controls } = state;
    if (snapshots.length) {
      state.viewIndex = (state.viewIndex + snapshots.length - 1) % snapshots.length;
      snapTo(controls, snapshots[state.viewIndex]);
    }
  }

  {
    const { renderer, scene, camera } = state;
    renderer.render(scene, camera);
  }

  {
    window.requestAnimationFrame(tick);
  }
}

window.requestAnimationFrame(tick);
