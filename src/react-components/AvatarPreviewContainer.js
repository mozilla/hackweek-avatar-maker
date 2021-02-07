import React from "react";

export function AvatarPreviewContainer({ thumbnailMode, canvasUrl }) {
  return (
    <div id="sceneContainer">
      {!thumbnailMode && (
        <div className="waveContainer" style={{ backgroundImage: canvasUrl ? `url("${canvasUrl}")` : "none" }}></div>
      )}
      <canvas id="scene"></canvas>
    </div>
  );
}
