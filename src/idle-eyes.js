import * as THREE from "three";

const idleEyesAnimationNames = ["idle_eyes", "Blinks"];

function idleEyesAnimationsForGltf(gltf) {
  return gltf.animations && gltf.animations.filter(({ name }) => idleEyesAnimationNames.includes(name));
}

export default {
  hasIdleEyes(gltf) {
    const idleEyesAnimations = idleEyesAnimationsForGltf(gltf);
    return !!(idleEyesAnimations && idleEyesAnimations.length);
  },

  mixerForGltf(gltf) {
    const mixer = new THREE.AnimationMixer(gltf.scene);
    const idleEyesAnimations = idleEyesAnimationsForGltf(gltf);
    for (const animation of idleEyesAnimations) {
      const action = mixer.clipAction(animation);
      action.enabled = true;
      action.setLoop(THREE.LoopRepeat, Infinity).play();
    }
    return mixer;
  },
};
