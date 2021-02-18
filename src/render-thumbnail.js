import * as THREE from "three";
import { findChildrenByType, findChildByType } from "./utils";
import constants from "./constants";
import assets from "./assets";

function bisectGeometry(mesh) {
  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3());

  // TODO: Could probably simplify this considerably by actually using indexed geometry
  // and removing indices of bisected attributes instead of the attribute values themselves.
  const geometry = mesh.geometry.toNonIndexed();

  const verts = geometry.getAttribute("position");

  const attributeNames = Object.keys(geometry.attributes);
  const newAttributes = Object.fromEntries(
    attributeNames.map((name) => {
      const { itemSize } = geometry.getAttribute(name);
      return [name, new THREE.BufferAttribute(new Float32Array((verts.count / 2) * itemSize), itemSize)];
    })
  );

  for (let i = 0, j = 0; i < verts.count; i++) {
    if (verts.getX(i) > center.x) {
      for (const attributeName of attributeNames) {
        const oldAttr = geometry.getAttribute(attributeName);
        const { itemSize } = oldAttr;
        const offset = i * itemSize;
        const values = oldAttr.array.slice(offset, offset + itemSize);
        newAttributes[attributeName].set(values, j * itemSize);
      }
      j++;
    }
  }

  for (const attributeName of attributeNames) {
    geometry.setAttribute(attributeName, newAttributes[attributeName]);
  }

  mesh.geometry = geometry;
}

function shouldBisect(categoryName, partValue) {
  const part = assets[categoryName].parts.find((part) => part.value === partValue);
  return assets[categoryName].bisectInThumbnail || part.bisectInThumbnail;
}

export function renderThumbnail(renderer, scene, gltfScene, categoryName, partValue) {
  const thumbnailSize = 128;
  renderer.setSize(thumbnailSize, thumbnailSize);

  const angle = -Math.PI / 6;
  const meshes = findChildrenByType(gltfScene, "SkinnedMesh");
  meshes.map((mesh, i) => {
    mesh.pose();
    if (shouldBisect(categoryName, partValue)) {
      bisectGeometry(mesh);
    }
    mesh.geometry.rotateY(angle);
    mesh.geometry.rotateX(-angle);
  });

  const box = new THREE.Box3().setFromObject(gltfScene);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const halfWidth = size.x / 2;
  const halfHeight = size.y / 2;
  const camSize = Math.max(halfWidth, halfHeight) * 1.1;
  const camera = new THREE.OrthographicCamera(-camSize, camSize, camSize, -camSize, 0.0001, 10);
  const unitZ = new THREE.Vector3(0, 0, 1);

  camera.position.copy(new THREE.Vector3().copy(center).add(unitZ.multiplyScalar(size.z)));

  renderer.render(scene, camera);

  renderer.domElement.toBlob((blob) => {
    const result = document.createElement("img");
    result.id = constants.thumbnailResult;
    document.body.append(result);
    result.src = URL.createObjectURL(blob);
  });
}
