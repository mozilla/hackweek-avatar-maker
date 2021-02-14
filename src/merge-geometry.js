import * as THREE from "three";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils";
import constants from "./constants";
import { GLTFCubicSplineInterpolant } from "./gltf-cubic-spline-interpolant";

function mergeSourceTargetInfluences(meshes, source, dest) {
  const destMorphTargetInfluences = [];
  new Array(Object.keys(dest.morphTargetDictionary).length).fill(0);
  Object.entries(dest.morphTargetDictionary).map(([morphName, destIndex]) => {
    const mesh = meshes.find((mesh) => {
      const sourceMorphTargetDictionary = source.morphTargetDictionary.get(mesh);
      return sourceMorphTargetDictionary.hasOwnProperty(morphName);
    });

    const sourceIndex = mesh.morphTargetDictionary[morphName];
    destMorphTargetInfluences[destIndex] = mesh.morphTargetInfluences[sourceIndex];
    // TODO: Stop / reset animations so that if these morph influences are animated they return to 0, but if it is baked into the asset (like the eye brows), we keep it.
  });
  return destMorphTargetInfluences;
}

function findSceneGroup(object3D) {
  if (object3D.name === "Scene" && object3D.type === "Group") {
    return object3D;
  }
  if (!object3D.parent) {
    return null;
  }
  return findSceneGroup(object3D.parent);
}

function mergeSourceAttributes(source) {
  const propertyNames = new Set(); // e.g. ["normal", "position", "skinIndex", "skinWeight", "tangent", "uv", "uv2"]
  const allSourceAttributes = Array.from(source.attributes.values());
  allSourceAttributes.forEach((sourceAttributes) => {
    Object.keys(sourceAttributes).forEach((name) => propertyNames.add(name));
  });

  const destAttributes = {};
  Array.from(propertyNames.keys()).map((name) => {
    destAttributes[name] = BufferGeometryUtils.mergeBufferAttributes(
      allSourceAttributes.map((sourceAttributes) => sourceAttributes[name]).flat()
    );
  });

  return destAttributes;
}

function mergeSourceMorphTargetDictionary(source) {
  const morphNames = new Set(); // e.g. ["MouthFlap", "Blink", "Eye Narrow", "Eye Rotation"]
  const allSourceDictionaries = Array.from(source.morphTargetDictionary.values());
  allSourceDictionaries.forEach((dictionary) => {
    Object.keys(dictionary).forEach((name) => morphNames.add(name));
  });

  const destMorphTargetDictionary = {};
  Array.from(morphNames.keys()).map((name, i) => {
    destMorphTargetDictionary[name] = i;
  });

  return destMorphTargetDictionary;
}

function mergeSourceMorphAttributes(source, destMorphTargetDictionary) {
  const propertyNameSet = new Set(); // e.g. ["position", "normal"]
  const allSourceMorphAttributes = Array.from(source.morphAttributes.values());
  allSourceMorphAttributes.forEach((sourceMorphAttributes) => {
    Object.keys(sourceMorphAttributes).forEach((name) => propertyNameSet.add(name));
  });

  const propertyNames = Array.from(propertyNameSet);
  const morphNames = Object.keys(destMorphTargetDictionary);
  const meshes = Array.from(source.morphAttributes.keys());

  const unmerged = {};
  propertyNames.forEach((propName) => {
    unmerged[propName] = [];
    morphNames.forEach((morphName) => {
      const destMorphIndex = destMorphTargetDictionary[morphName];
      unmerged[propName][destMorphIndex] = [];

      meshes.forEach((mesh) => {
        let bufferAttribute;
        const morphTargetDictionary = source.morphTargetDictionary.get(mesh);
        if (morphTargetDictionary.hasOwnProperty(morphName)) {
          const sourceMorphIndex = morphTargetDictionary[morphName];
          bufferAttribute = mesh.geometry.morphAttributes[propName][sourceMorphIndex];
        } else {
          const attribute = mesh.geometry.attributes[propName];
          const array = new attribute.array.constructor(new Array(attribute.array.length).fill(0));
          bufferAttribute = new THREE.BufferAttribute(array, attribute.itemSize, attribute.normalized);
        }
        unmerged[propName][destMorphIndex].push(bufferAttribute);
      });
    });
  });

  const merged = {};
  propertyNames.forEach((propName) => {
    merged[propName] = [];
    morphNames.forEach((morphName) => {
      const destMorphIndex = destMorphTargetDictionary[morphName];
      merged[propName][destMorphIndex] = BufferGeometryUtils.mergeBufferAttributes(unmerged[propName][destMorphIndex]);
    });
  });

  return merged;
}

function mergeSourceIndices(source) {
  const meshes = Array.from(source.attributes.keys());

  var indexOffset = 0;
  var mergedIndex = [];

  meshes.forEach((mesh) => {
    const index = mesh.geometry.index;

    for (var j = 0; j < index.count; ++j) {
      mergedIndex.push(index.getX(j) + indexOffset);
    }

    indexOffset += mesh.geometry.attributes.position.count;
  });

  return mergedIndex;
}

function dedupBy(items, propName) {
  const deduped = new Set();
  items.forEach((item) => {
    deduped.add(item[propName]);
  });
  return Array.from(deduped).map((value) => {
    return items.find((item) => item[propName] === value);
  });
}

//
// remapTrack
//
//   Remap tracks that animate morph target influences.
//
//   We assume the sourceTrack is
//   - using CubicSpline interpolation and
//   - animating morphTargetInfluences.
//
//   TODO: Support other interpolation types. (Adding linear should be easy.)
//
//   The values buffer of the sourceTrack contains a sequence of keyframes:
//
//   [ frame 0 | frame 1 | frame 2 | frame 3 ... ]
//
//   Each keyframe contains three numbers for each morph target (influence) of the sourceMesh:
//   - an inTangent (tanIn)
//   - an influence (value)
//   - an outTangent (tanOut)
//
//   Each frame orders the numbers by type: inTangents first, then values, then outTangents.
//   So if there are M morph targets, frame N will look like:
//   [
//     ...
//     |                              |                             |                                |
//     | tanIn_N_0, ... ,  tanIn_N_M, | value_N_0, ... , value_N_M, | tanOut_N_0,  ... , tanOut_N_M, |  // < -- frame N
//     |                              |                             |                                |
//     ...
//   ]
//
//   So for example, if the sourceMesh has 2 morph targets and the track has three keyframes, the values buffer contains:
//   [
//      tanIn_0_0, tanIn_0_1, value_0_0, value_0_1, tanOut_0_0, tanOut_0_1, // <-- Frame 0
//      tanIn_1_0, tanIn_1_1, value_1_0, value_1_1, tanOut_1_0, tanOut_1_1, // <-- Frame 1
//      tanIn_2_0, tanIn_2_1, value_2_0, value_2_1, tanOut_2_0, tanOut_2_1  // <-- Frame 2
//   ]
//
//   See the GLTF spec for details about how this is represented in GLTF:
//     https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#animations
//   See THREE's GLTFLoader for details about how this is loaded and represented in THREE:
//     https://github.com/mrdoob/three.js/blob/350f0a021943d6fa1d039a7c14c303653daa463f/examples/jsm/loaders/GLTFLoader.js#L3634
//
//   This function creates a new (dest) track that can will work with the combined (dest) mesh.
//   Each morph target influence index in the source mesh has a corresponding index in the dest mesh.
//   The dest mesh will have the sum of all the morph targets of its source meshes, so we will
//   insert several zeros into the track so the dest mesh's morphTargetInfluences that should not
//   be changed by this track are left alone.
//
//   Continuing the example above,
//   If the sourceMesh has two morph targets and sourceTrack has three keyframes,
//   and if the destMesh has three morph targets, then there will be some mapping
//   of morphTargetInfluences from source to dest:
//   {
//     sourceMorph0 -> destMorph2,
//     sourceMorph1 -> destMorph1
//   }
//
//   Assuming the same values buffer from before, the new values buffer will be:
//   [
//      0, tanIn_0_1, tanIn_0_0, 0, value_0_1, value_0_0, 0, tanOut_0_1, tanOut_0_0, // <-- Frame 0
//      0, tanIn_1_1, tanIn_1_0, 0, value_1_1, value_1_0, 0, tanOut_1_1, tanOut_1_0, // <-- Frame 1
//      0, tanIn_2_1, tanIn_2_0, 0, value_2_1, value_2_0, 0, tanOut_2_1, tanOut_2_0  // <-- Frame 2
//   ]
//
//   Notice that:
//   - zeroes have been inserted for destMorph0,
//   - the numbers associated with sourceMorph0 will now be associated with destMorph2, and
//   - the numbers associated with sourceMorph1 will now be associated with destMorph1
function remapTrack({ sourceTrack, source, dest }) {
  const sourceMeshName = sourceTrack.name.split(".")[0];
  const sourceMesh = source.meshes.find((mesh) => mesh.name === sourceMeshName);
  const sourceFrame = {
    size: Object.keys(source.morphTargetDictionary.get(sourceMesh)).length * 3,
  };
  sourceFrame.tanInOffset = 0;
  sourceFrame.valueOffset = sourceFrame.size / 3;
  sourceFrame.tanOutOffset = (sourceFrame.size * 2) / 3;

  const destFrame = {
    size: Object.keys(dest.morphTargetDictionary).length * 3,
  };
  destFrame.tanInOffset = 0;
  destFrame.valueOffset = destFrame.size / 3;
  destFrame.tanOutOffset = (destFrame.size * 2) / 3;

  const numFrames = sourceTrack.times.length;
  const destMorphNames = Object.keys(dest.morphTargetDictionary);
  const sourceMorphTargetDictionary = source.morphTargetDictionary.get(sourceMesh);

  // Write keyframes for new animation track
  const keyframes = [];
  for (let frameIndex = 0; frameIndex < numFrames; frameIndex++) {
    const frame = [];
    destMorphNames.forEach((morphName) => {
      const destMorphIndex = dest.morphTargetDictionary[morphName];
      const isInSourceTrack = sourceMorphTargetDictionary.hasOwnProperty(morphName);
      if (isInSourceTrack) {
        const sourceMorphIndex = sourceMorphTargetDictionary[morphName];
        frame[destFrame.tanInOffset + destMorphIndex] =
          sourceTrack.values[frameIndex * sourceFrame.size + sourceFrame.tanInOffset + sourceMorphIndex];
        frame[destFrame.valueOffset + destMorphIndex] =
          sourceTrack.values[frameIndex * sourceFrame.size + sourceFrame.valueOffset + sourceMorphIndex];
        frame[destFrame.tanOutOffset + destMorphIndex] =
          sourceTrack.values[frameIndex * sourceFrame.size + sourceFrame.tanOutOffset + sourceMorphIndex];
      } else {
        frame[destFrame.tanInOffset + destMorphIndex] = 0;
        frame[destFrame.valueOffset + destMorphIndex] = 0;
        frame[destFrame.tanOutOffset + destMorphIndex] = 0;
      }
    });
    keyframes.push(frame);
  }

  const destTrackName = `${constants.combinedMeshName}.morphTargetInfluences`;
  const destTrack = new THREE.NumberKeyframeTrack(destTrackName, sourceTrack.times, keyframes.flat());

  destTrack.createInterpolant = function InterpolantFactoryMethodGLTFCubicSpline(result) {
    return new GLTFCubicSplineInterpolant(this.times, this.values, this.getValueSize() / 3, result);
  };
  destTrack.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = true;

  return destTrack;
}

function mergeAndRewriteAnimations({ source, dest }) {
  const clips = dedupBy(Array.from(source.animations.values()).flat(), "name");
  return clips.map((clip) => {
    const destTracks = clip.tracks.map((sourceTrack) =>
      sourceTrack.name.endsWith("morphTargetInfluences") ? remapTrack({ sourceTrack, source, dest }) : sourceTrack
    );
    const { name, duration, blendMode } = clip;
    return new THREE.AnimationClip(name, duration, destTracks, blendMode);
  });
}

export function mergeGeometry(meshes) {
  const source = {
    meshes,
    attributes: new Map(meshes.map((m) => [m, m.geometry.attributes])),
    morphAttributes: new Map(meshes.map((m) => [m, m.geometry.morphAttributes])),
    morphTargetDictionary: new Map(meshes.map((m) => [m, m.morphTargetDictionary || {}])),
    morphTargetInfluences: new Map(meshes.map((m) => [m, m.morphTargetInfluences || []])),
    animations: new Map(meshes.map((m) => [m, findSceneGroup(m).animations])),
  };

  const dest = {};
  dest.attributes = mergeSourceAttributes(source);
  dest.morphTargetDictionary = mergeSourceMorphTargetDictionary(source);
  dest.morphAttributes = mergeSourceMorphAttributes(source, dest.morphTargetDictionary);
  dest.morphTargetInfluences = mergeSourceTargetInfluences(meshes, source, dest);
  dest.index = mergeSourceIndices(source);
  dest.animations = mergeAndRewriteAnimations({ source, dest });

  return { source, dest };
}
