import React from "react";
import { Toolbar } from "./Toolbar";
import { UploadButton } from "./UploadButton";
import { dispatch } from "../dispatch";
import constants from "../constants";

function dispatchResetView() {
  dispatch(constants.resetView);
}

function dispatchExportAvatar() {
  dispatch(constants.exportAvatar);
}

export function ToolbarContainer({ onGLBUploaded, randomizeConfig }) {
  return (
    <Toolbar>
      <span className="appName">Hackweek Avatar Maker</span>
      <UploadButton onGLBUploaded={onGLBUploaded} />
      <button onClick={randomizeConfig}>Randomize avatar</button>
      <button onClick={dispatchResetView}>Reset camera view</button>
      <button onClick={dispatchExportAvatar} className="primary">
        Export avatar
      </button>
    </Toolbar>
  );
}
