import React from "react";

export function AvatarEditor({ thumbnailMode, leftPanel, rightPanel, buttonTip, toolbar }) {
  return (
    <>
      <div className="main">
        {!thumbnailMode && leftPanel}
        {rightPanel}
        {buttonTip}
      </div>
      {!thumbnailMode && toolbar}
    </>
  );
}
