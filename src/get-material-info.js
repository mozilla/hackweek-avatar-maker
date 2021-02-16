import { findChildrenByType, loadGLTFCached } from "./utils";
import { urlFor } from "./url-for";

function collectMaterialInfo(object3D) {
  const meshes = findChildrenByType(object3D, "SkinnedMesh");
  const materials = meshes.map((m) => m.material);
  return materials;
}

function nonNullParts(assets) {
  return Object.keys(assets)
    .map((categoryName) => {
      return assets[categoryName].parts;
    })
    .flat()
    .filter((part) => {
      return part.value;
    });
}

async function loadPart(part) {
  const gltf = await loadGLTFCached(urlFor(part.value));
  return {
    part,
    gltf,
  };
}

function preload(assets) {
  const parts = nonNullParts(assets);
  return parts.slice(0).map(loadPart);
}

export async function getMaterialInfo(assets) {
  console.log("Preloading assets...", assets);

  let info = await Promise.all(preload(assets));
  info = info.map(({ part, gltf }) => {
    const materials = collectMaterialInfo(gltf.scene);
    return {
      part,
      gltf,
      materials,
    };
  });

  function addMat(acc, mat) {
    const nested = ["aoMap", "map", "normalMap"];

    const normalProps = Object.keys(mat).filter((p) => !nested.includes(p));
    for (const propName of normalProps) {
      const prop = mat[propName];

      acc[propName] = acc[propName] || [];
      acc[propName].push(prop);
    }

    for (const outerPropName of nested) {
      const outerProp = mat[outerPropName];
      for (const innerPropName of Object.keys(outerProp || {})) {
        const prop = outerProp[innerPropName];
        const key = `${outerPropName}:${innerPropName}`;
        acc[key] = acc[key] || [];
        acc[key].push(prop);
      }
    }

    return acc;
  }
  const materials = info
    .map((i) => i.materials)
    .flat()
    .reduce(addMat, {});

  function groupByValue(arr) {
    const groups = {};
    arr.map((value) => {
      groups[value] = groups[value] || 0;
      groups[value] += 1;
    });
    return groups;
  }
  const groupedMatValues = {};
  Object.keys(materials).map((name) => {
    const groups = groupByValue(materials[name]);
    groupedMatValues[name] = groups;
    // TODO: This is a just a reduce
  });

  const nonSingularGroups = Object.keys(groupedMatValues)
    .filter((propName) => {
      const groups = groupedMatValues[propName];
      return Object.keys(groups).length !== 1;
    })
    .reduce((acc, propName) => {
      acc[propName] = groupedMatValues[propName];
      return acc;
    }, {});

  console.log("materials", materials);
  console.log("groupedMatValues", groupedMatValues);
  console.log("nonSingularGroups", nonSingularGroups);

  return nonSingularGroups;
}
