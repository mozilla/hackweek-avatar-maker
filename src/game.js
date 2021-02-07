import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import constants from "./constants";
import { exportAvatar } from "./export";
import { loadGLTF, loadGLTFCached, forEachMaterial, generateEnvironmentMap, createSky, isThumbnailMode } from "./utils";
import { renderThumbnail } from "./render-thumbnail";
import { combine } from "./mesh-combination";
import { getMaterialInfo } from "./get-material-info";
import { urlFor } from "./url-for";
import { createSkydome } from "./create-skydome";
import uvScroll from "./uv-scroll";
import idleEyes from "./idle-eyes";

// Used to test mesh combination
window.combineCurrentAvatar = async function () {
  return await combine({ avatar: state.avatarGroup });
};

const state = {
  reactIsLoaded: false,
  shouldResize: true,
  didInit: false,
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  clock: null,
  delta: 0,
  envMap: null,
  avatarGroup: null,
  avatarNodes: {},
  avatarConfig: {},
  newAvatarConfig: {},
  shouldApplyNewAvatarConfig: false,
  shouldExportAvatar: false,
  shouldResetView: false,
  thumbnailConfig: {},
  shouldRenderThumbnail: false,
  shouldRotateLeft: false,
  shouldRotateRight: false,
  idleEyesMixers: {},
  uvScrollMaps: {},
};
window.gameState = state;

window.onresize = () => {
  state.shouldResize = true;
};
document.addEventListener(constants.reactIsLoaded, () => {
  state.reactIsLoaded = true;
});
document.addEventListener(constants.avatarConfigChanged, (e) => {
  state.newAvatarConfig = e.detail.avatarConfig;
  state.shouldApplyNewAvatarConfig = true;
});
document.addEventListener(constants.renderThumbnail, (e) => {
  state.thumbnailConfig = e.detail.thumbnailConfig;
  state.shouldRenderThumbnail = true;
});
document.addEventListener(constants.exportAvatar, () => {
  state.shouldExportAvatar = true;
});
document.addEventListener(constants.resetView, () => {
  state.shouldResetView = true;
});

function onKeyChange(e) {
  switch (e.key) {
    case "ArrowRight":
      state.shouldRotateRight = e.type === "keydown";
      break;
    case "ArrowLeft":
      state.shouldRotateLeft = e.type === "keydown";
      break;
  }
}
["keydown", "keyup"].map((e) => {
  document.addEventListener(e, onKeyChange);
});
document.addEventListener("blur", () => {
  state.shouldRotateLeft = false;
  state.shouldRotateRight = false;
});

function ensureAvatarNode(category) {
  if (!state.avatarNodes[category]) {
    state.avatarNodes[category] = new THREE.Group();
    state.avatarGroup.add(state.avatarNodes[category]);
  }
}

function resetView() {
  state.controls.reset();
}

function init() {
  THREE.Cache.enabled = !isThumbnailMode();

  const scene = new THREE.Scene();
  state.scene = scene;

  const skydome = createSkydome(isThumbnailMode() ? 2 : 400);
  scene.add(skydome);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0.6, 1);
  state.camera = camera;

  const directionalLight = new THREE.DirectionalLight(0xffffff, 4.0);
  directionalLight.position.set(10, 20, 5);
  scene.add(directionalLight);

  // TODO: Square this with react
  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("scene"), antialias: true });
  renderer.physicallyCorrectLights = true;
  renderer.gammaOutput = true;
  state.renderer = renderer;

  state.clock = new THREE.Clock();

  const sky = createSky();
  state.envMap = generateEnvironmentMap(sky, renderer);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target = new THREE.Vector3(0, 0.5, 0);
  controls.update();
  controls.saveState();
  state.controls = controls;

  state.avatarGroup = new THREE.Group();
  scene.add(state.avatarGroup);
}

async function loadIntoGroup({ category, part, group, cached = true }) {
  try {
    const load = cached ? loadGLTFCached : loadGLTF;
    const gltf = await load(urlFor(part));

    if (state.avatarConfig[category] !== part) return;

    gltf.scene.animations = gltf.animations;

    if (idleEyes.hasIdleEyes(gltf)) {
      state.idleEyesMixers[category] = idleEyes.mixerForGltf(gltf);
    }

    if (state.uvScrollMaps[category]) {
      state.uvScrollMaps[category].length = 0;
    }

    gltf.scene.traverse((obj) => {
      forEachMaterial(obj, (material) => {
        if (material.isMeshStandardMaterial) {
          material.envMap = state.envMap;
          material.envMapIntensity = 0.4;
          if (material.map) {
            material.map.anisotropy = state.renderer.capabilities.getMaxAnisotropy();
          }
          material.needsUpdate = true;
        }
      });

      if (uvScroll.isValidMesh(obj)) {
        state.uvScrollMaps[category] = state.uvScrollMaps[category] || [];
        state.uvScrollMaps[category].push(uvScroll.initialStateForMesh(obj));
      }
    });

    group.clear();
    group.add(gltf.scene);

    return gltf.scene;
  } catch (ex) {
    console.error("Failed to load avatar part", category, part, ex);
    if (state.avatarConfig[category] !== part) return;
    group.clear();
    return;
  }
}

function tick(time) {
  {
    if (state.reactIsLoaded && !state.didInit) {
      state.didInit = true;
      init();
    }
    if (!state.didInit) {
      requestAnimationFrame(tick);
      return;
    }
  }

  {
    state.delta = state.clock.getDelta();
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
        ensureAvatarNode(category);

        if (state.newAvatarConfig[category] !== state.avatarConfig[category]) {
          state.avatarConfig[category] = state.newAvatarConfig[category];
          if (state.newAvatarConfig[category] !== null) {
            loadIntoGroup({ category, part: state.newAvatarConfig[category], group: state.avatarNodes[category] });
          } else {
            state.avatarNodes[category].clear();
          }
        }
      }
    }
  }

  {
    if (state.shouldRenderThumbnail) {
      state.shouldRenderThumbnail = false;

      const { category, part } = state.thumbnailConfig;

      ensureAvatarNode(category);

      for (const category of Object.keys(state.avatarNodes)) {
        state.avatarNodes[category].clear();
      }

      state.avatarConfig[category] = part;

      loadIntoGroup({ category, part, group: state.avatarNodes[category], cached: false }).then((gltfScene) => {
        renderThumbnail(state.renderer, state.scene, gltfScene, category, part);
      });
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
    let speed = 0;
    if (state.shouldRotateLeft) {
      speed -= 30;
    }
    if (state.shouldRotateRight) {
      speed += 30;
    }
    const { controls } = state;
    controls.autoRotate = true;
    controls.autoRotateSpeed = speed;
    controls.update();
  }

  {
    window.requestAnimationFrame(tick);
  }

  {
    for (const categoryName in state.idleEyesMixers) {
      if (!state.idleEyesMixers.hasOwnProperty(categoryName)) continue;
      const mixer = state.idleEyesMixers[categoryName];
      mixer.update(state.delta);
    }
  }

  {
    for (const categoryName in state.uvScrollMaps) {
      if (!state.uvScrollMaps.hasOwnProperty(categoryName)) continue;
      for (const uvScrollState of state.uvScrollMaps[categoryName]) {
        uvScroll.update(uvScrollState, state.delta);
      }
    }
  }

  {
    const { renderer, scene, camera, controls } = state;
    renderer.render(scene, camera);
  }
}

window.requestAnimationFrame(tick);
