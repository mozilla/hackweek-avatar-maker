import "./styles.css";
import "./game";

import React from "react";
import ReactDOM from "react-dom";
import initialAssets from "./assets";
import { isThumbnailMode } from "./utils";
import { AvatarEditorContainer } from "./react-components/AvatarEditorContainer";

// Used externally by the generate-thumbnails script
window.renderThumbnail = (category, part) => {
  dispatch(constants.renderThumbnail, { thumbnailConfig: { category, part } });
};

// Used externally by the generate-thumbnails script
const thumbnailMode = isThumbnailMode();

ReactDOM.render(<AvatarEditorContainer {...{ initialAssets, thumbnailMode }} />, document.getElementById("root"));
