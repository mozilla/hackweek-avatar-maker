import React from "react";
import { Toolbar } from "./Toolbar";
import { UploadButton } from "./UploadButton";
import { MoreMenu } from "./MoreMenu";
import { AvatarPersistenceContainer } from "./AvatarPersistenceContainer";
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
      <MoreMenu
        items={
          <>
            <UploadButton onGLBUploaded={onGLBUploaded} />
            <AvatarPersistenceContainer />
            <a href="https://github.com/mozilla/hackweek-avatar-maker" target="_blank">
              GitHub
            </a>
          </>
        }
      ></MoreMenu>
      <button onClick={randomizeConfig}>Randomize avatar</button>
      <button onClick={dispatchResetView}>Reset camera view</button>
      <button onClick={dispatchExportAvatar} className="primary">
        Export avatar
      </button>
    </Toolbar>
  );
}
