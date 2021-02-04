import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import constants from "./constants";
import { exportAvatar } from "./export";
import { loadGLTFCached, forEachMaterial, generateEnvironmentMap, createSky } from "./utils";
import { renderThumbnail } from "./render-thumbnail";

// TODO: Don't do this
function urlFor(value) {
  if (value.startsWith("blob")) {
    return value;
  } else {
    return `assets/${value}.glb`;
  }
}

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

function ensureAvatarNode(category) {
  if (!state.avatarNodes[category]) {
    state.avatarNodes[category] = new THREE.Group();
    state.avatarGroup.add(state.avatarNodes[category]);
  }
}

function resetView() {
  state.controls.reset();
}

function createSkydome() {
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
  const uniforms = {
    topColor: { value: new THREE.Color(0x0096db) }, // TODO: match primary color
    bottomColor: { value: new THREE.Color(0xc6dde5) },
    offset: { value: 33 },
    exponent: { value: 1.0 },
  };

  // TODO Pixel push these values to perfection!!!
  const geometry = new THREE.SphereGeometry(400, 16, 16);
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

  // TODO: Consider removing this for thumbnails
  const skydome = createSkydome();
  scene.add(skydome);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0.6, 1);
  state.camera = camera;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  // TODO: Square this with react
  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("scene"), antialias: true });
  state.renderer = renderer;

  const sky = createSky();
  state.envMap = generateEnvironmentMap(sky, renderer);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotate = true;
  controls.autoRotateSpeed = -1;
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
    const { renderer, scene, camera, controls } = state;

    controls.update();
    renderer.render(scene, camera);
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
    window.requestAnimationFrame(tick);
  }
}

window.requestAnimationFrame(tick);
