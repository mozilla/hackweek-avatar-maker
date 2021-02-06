import "./styles.css";
import "./game";
import React from "react";
import ReactDOM from "react-dom";
import { AvatarEditorContainer } from "./react-components/AvatarEditorContainer";
import { dispatch } from "./dispatch";
import constants from "./constants";

// Used externally by the generate-thumbnails script
window.renderThumbnail = (category, part) => {
  dispatch(constants.renderThumbnail, { thumbnailConfig: { category, part } });
};

ReactDOM.render(<AvatarEditorContainer />, document.getElementById("root"));
