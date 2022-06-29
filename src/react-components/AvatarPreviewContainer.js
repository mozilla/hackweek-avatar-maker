import React, { useEffect, useRef } from "react";

export function AvatarPreviewContainer({ thumbnailMode, canvasUrl }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvasEl = canvasRef.current;
    window.gameState.initRenderer(canvasEl);
    return () => {
      window.gameState.disposeRenderer();
    };
  }, [canvasRef]);
  return (
    <div id="sceneContainer">
      {!thumbnailMode && (
        <div className="waveContainer" style={{ backgroundImage: canvasUrl ? `url("${canvasUrl}")` : "none" }}></div>
      )}
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
