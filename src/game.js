import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import constants from "./constants";
import assets from "./assets";
import { exportAvatar } from "./export";
import { loadGLTF, forEachMaterial, generateEnvironmentMap, createSky } from "./utils";

const avatarParts = Object.keys(assets);

const state = {
  DOMContentLoaded: false,
  shouldResize: false,
  didInit: false,
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  envMap: null,
  // TODO: Important to initialize each part to null?
  avatarNodes: {},
  avatarConfig: {},
  newAvatarConfig: {},
  shouldApplyNewAvatarConfig: false,
  shouldExportAvatar: false,
  shouldResetView: false,
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

function resetView() {
  state.controls.reset();
}

function init() {
  THREE.Cache.enabled = true;
  const scene = new THREE.Scene();
  state.scene = scene;
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0.25, 1.5);
  state.camera = camera;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const renderer = new THREE.WebGLRenderer();
  state.renderer = renderer;
  renderer.setSize(window.innerWidth, window.innerHeight);
  // TODO: Square this with react
  document.body.appendChild(renderer.domElement);

  const sky = createSky();
  state.envMap = generateEnvironmentMap(sky, renderer);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target = new THREE.Vector3(0, 0.5, 0);
  controls.update();
  controls.saveState();
  state.controls = controls;

  state.avatarGroup = new THREE.Group();
  scene.add(state.avatarGroup);
  for (const part of avatarParts) {
    state.avatarNodes[part] = new THREE.Group();
    state.avatarGroup.add(state.avatarNodes[part]);
  }
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
      state.renderer.setSize(window.innerWidth, window.innerHeight);
      state.camera.aspect = window.innerWidth / window.innerHeight;
      state.camera.updateProjectionMatrix();
    }
  }

  {
    const { renderer, scene, camera } = state;
    renderer.render(scene, camera);
  }

  {
    if (state.shouldApplyNewAvatarConfig) {
      state.shouldApplyNewAvatarConfig = false;
      for (const part of avatarParts) {
        if (state.newAvatarConfig[part] !== state.avatarConfig[part]) {
          state.avatarNodes[part].clear();
          if (state.newAvatarConfig[part] !== null) {
            loadGLTF(`assets/${state.newAvatarConfig[part]}.glb`).then((gltf) => {
              // TODO: Multiple of these might be in flight at any given time.
              gltf.scene.animations = gltf.animations;
              state.avatarNodes[part].add(gltf.scene);

              gltf.scene.traverse(obj => {
                forEachMaterial(obj, material => {
                  if (material.isMeshStandardMaterial) {
                    material.envMap = state.envMap;
                    material.needsUpdate = true;
                  }
                });
              });
            });
          }
          state.avatarConfig[part] = state.newAvatarConfig[part];
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

  {
    window.requestAnimationFrame(tick);
  }
}

window.requestAnimationFrame(tick);
