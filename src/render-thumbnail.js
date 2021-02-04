import * as THREE from "three";
import { findChildrenByType, findChildByType } from "./utils";
import constants from "./constants";

export function renderThumbnail(renderer, scene, gltfScene, category, part) {
  const thumbnailSize = 128;
  renderer.setSize(thumbnailSize, thumbnailSize);

  const angle = -Math.PI / 6;
  const meshes = findChildrenByType(gltfScene, "SkinnedMesh");
  meshes.map((mesh, i) => {
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

  meshes.map((mesh, i) => {
    mesh.geometry.rotateY(angle);
    mesh.geometry.rotateX(-angle);
  });
}
