import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import constants from "./constants";
import { exportAvatar } from "./export";
import { loadGLTFCached, forEachMaterial, generateEnvironmentMap, createSky, isThumbnailMode } from "./utils";
import { renderThumbnail } from "./render-thumbnail";
import { combine } from "./mesh-combination";
import { getMaterialInfo } from "./get-material-info";
import { urlFor } from "./url-for";

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
  envMap: null,
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

function createSkydome(radius) {
  const vertexShader = `
varying vec3 vWorldPosition;

void main() {

  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  vWorldPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
`;
  const fragmentShader = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;

varying vec3 vWorldPosition;

void main() {

  float h = normalize( vWorldPosition + offset ).y;
  gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );

}
`;

  const offset = radius / 12;

  const uniforms = {
    topColor: { value: new THREE.Color(0x0096db) }, // TODO: match primary color
    bottomColor: { value: new THREE.Color(0xc6dde5) },
    offset: { value: offset },
    exponent: { value: 1.0 },
  };

  // TODO Pixel push these values to perfection!!!
  const geometry = new THREE.SphereGeometry(radius, 16, 16);
  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.BackSide,
  });

  return new THREE.Mesh(geometry, material);
}

function init() {
  THREE.Cache.enabled = true;

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

async function loadIntoGroup(category, part, group) {
  try {
    const gltf = await loadGLTFCached(urlFor(part));
    if (state.avatarConfig[category] !== part) return;

    gltf.scene.animations = gltf.animations;
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
    });

    group.clear();
    group.add(gltf.scene);
    return gltf.scene;
  } catch (ex) {
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
            loadIntoGroup(category, state.newAvatarConfig[category], state.avatarNodes[category]);
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
      for (const category in state.avatarNodes) {
        if (!state.avatarNodes.hasOwnProperty(category)) continue;
        state.avatarNodes[category].clear();
      }
      const { category, part } = state.thumbnailConfig;
      ensureAvatarNode(category);
      state.avatarConfig[category] = part;
      loadIntoGroup(category, part, state.avatarNodes[category]).then((gltfScene) => {
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
    const { renderer, scene, camera, controls } = state;
    throttle(
      "render",
      () => {
        renderer.render(scene, camera);
      },
      20
    );
  }
}

const throttle = (function () {
  const m = new Map();
  return function throttle(id, fn, t) {
    const count = m.get(id) || 0;
    if (count % t === 0) {
      fn();
    }
    m.set(id, count + 1);
  };
})();

window.requestAnimationFrame(tick);
