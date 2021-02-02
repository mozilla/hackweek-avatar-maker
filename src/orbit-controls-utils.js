// Helper function that I wish was on OrbitControls
export function createSnapshot(controls) {
  return {
    target: controls.target.clone(),
    position: controls.object.position.clone(),
    zoom: controls.object.zoom,
  };
}

// Helper function that I wish was on OrbitControls
export function snapTo(controls, { target, position, zoom = 1 }) {
  controls.target.copy(target);
  controls.object.position.copy(position);
  controls.object.zoom = zoom;

  controls.object.updateProjectionMatrix();
  controls.dispatchEvent({ type: "change" });

  controls.update();
}
