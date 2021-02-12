import * as THREE from "three";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils";
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

function reverseMorphTargetDictionaries(source) {
  const meshes = Array.from(source.morphTargetDictionary.keys());
  return new Map(
    meshes.map((mesh) => {
      const reverseDictionary = {};
      const dictionary = source.morphTargetDictionary.get(mesh);
      Object.entries(dictionary).forEach(([morphName, index]) => {
        reverseDictionary[index] = morphName;
      });
      return [mesh, reverseDictionary];
    })
  );
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

export function mergeGeometry(meshes) {
  const source = {
    attributes: new Map(meshes.map((m) => [m, m.geometry.attributes])),
    morphAttributes: new Map(meshes.map((m) => [m, m.geometry.morphAttributes])),
    morphTargetDictionary: new Map(meshes.map((m) => [m, m.morphTargetDictionary || {}])),
    morphTargetInfluences: new Map(meshes.map((m) => [m, m.morphTargetInfluences || []])),
    animations: new Map(meshes.map((m) => [m, findSceneGroup(m).animations])),
  };
  source.reverseMorphTargetDictionary = reverseMorphTargetDictionaries(source);
  console.log(source);

  const dest = {};
  dest.attributes = mergeSourceAttributes(source);
  dest.morphTargetDictionary = mergeSourceMorphTargetDictionary(source);
  dest.morphAttributes = mergeSourceMorphAttributes(source, dest.morphTargetDictionary);

  dest.morphTargetInfluences = mergeSourceTargetInfluences(meshes, source, dest);

  dest.index = mergeSourceIndices(source);

  return { source, dest };
}
