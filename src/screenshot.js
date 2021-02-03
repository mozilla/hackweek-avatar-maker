import * as THREE from "three";
import { findChildrenByType, findChildByType } from "./utils";

// export function screenshot2(object3D, category) {
//   const scene = new THREE.Scene();
//   const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
//   scene.add(ambientLight);
//   const fov = window.fov || 70;
//   const camera = new THREE.PerspectiveCamera(fov, 1, 0.001, 100);
//   const renderer = new THREE.WebGLRenderer({ antialias: true });
//   renderer.setSize(128, 128);
//   const parent = object3D.parent;
//   scene.add(object3D);
//   scene.background = new THREE.Color().setHSL(Math.random(), 1, 0.5);

//   const box = new THREE.Box3().setFromObject(object3D);
//   const center = box.getCenter(new THREE.Vector3());
//   const size = box.getSize(new THREE.Vector3());
//   const halfWidth = size.x / 2;
//   const halfHeight = size.y / 2;
//   const halfDepth = size.z / 2;
//   const unitZ = new THREE.Vector3(0, 0, 1);

//   // sin theta = opposite / adjacent
//   // sin (fov) = height / cameraDistance;
//   // cameraDistance = height / sin(fov);
//   const theta = camera.fov * THREE.MathUtils.DEG2RAD;
//   const distanceToNearPlane = Math.max(halfHeight, halfWidth) / Math.sin(theta);
//   const distanceToObjectCenter = halfDepth + distanceToNearPlane;
//   const cameraPosition = new THREE.Vector3().copy(center).add(unitZ.multiplyScalar(distanceToObjectCenter));
//   camera.position.copy(cameraPosition);
//   console.log(camera.matrixWorld);

//   const canvas = renderer.domElement;
//   canvas.setAttribute("category", category);
//   document.body.append(canvas);
//   renderer.render(scene, camera);

//   return new Promise((resolve, reject) => {
//     canvas.toBlob((blob) => {
//       parent.add(object3D);
//       resolve(URL.createObjectURL(blob));
//     });
//   });
// }

export function screenshot(object3D, category, part) {
  const scene = new THREE.Scene();
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);
  const fov = window.fov || 70;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  const thumbnailSize = 512;
  renderer.setSize(thumbnailSize, thumbnailSize);
  const parent = object3D.parent;
  scene.add(object3D);
  scene.background = new THREE.Color().setHSL(Math.random(), 1, 0.5);

  const angle = -Math.PI / 6;
  const rootBone = findChildByType(object3D, "Bone");
  const meshes = findChildrenByType(object3D, "SkinnedMesh");
  meshes.map((mesh, i) => {
    mesh.geometry.rotateY(angle);
  });

  const box = new THREE.Box3().setFromObject(object3D);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const halfWidth = size.x / 2;
  const halfHeight = size.y / 2;
  const maxDimension = Math.max(halfWidth, halfHeight);
  const camera = new THREE.OrthographicCamera(-maxDimension, maxDimension, maxDimension, -maxDimension, 0.0001, 10);
  const unitZ = new THREE.Vector3(0, 0, 1);

  camera.position.copy(new THREE.Vector3().copy(center).add(unitZ.multiplyScalar(size.z)));

  const canvas = renderer.domElement;
  canvas.setAttribute("category", category);
  document.body.append(canvas);
  renderer.render(scene, camera);

  meshes.map((mesh, i) => {
    mesh.geometry.rotateY(-1 * angle);
  });
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      parent.add(object3D);
      resolve(URL.createObjectURL(blob));
    });
  });
}
