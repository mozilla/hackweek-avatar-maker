import * as THREE from "three";

function uvScrollComponentFromMesh(mesh) {
  const { userData } = mesh;
  const hubsComponents = userData.gltfExtensions && userData.gltfExtensions.MOZ_hubs_components;
  return hubsComponents && hubsComponents["uv-scroll"];
}

export default {
  isValidMesh(mesh) {
    const hasUVScrollComponent = !!uvScrollComponentFromMesh(mesh);
    return mesh.isSkinnedMesh && hasUVScrollComponent;
  },

  initialStateForMesh(mesh) {
    const uvScrollComponent = uvScrollComponentFromMesh(mesh);
    return {
      map: mesh.material.map || mesh.material.emissiveMap,
      speed: uvScrollComponent.speed,
      increment: uvScrollComponent.increment,
      offset: new THREE.Vector2(),
    };
  },

  update({ offset, speed, increment, map }, delta) {
    offset.addScaledVector(speed, delta);

    offset.x = offset.x % 1.0;
    offset.y = offset.y % 1.0;

    map.offset.x = increment.x ? offset.x - (offset.x % increment.x) : offset.x;
    map.offset.y = increment.y ? offset.y - (offset.y % increment.y) : offset.y;
  },
};
