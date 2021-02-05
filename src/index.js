import React, { useState, useEffect, useRef, useContext } from "react";
import ReactDOM from "react-dom";

import "./styles.css";
import "./game";
import constants from "./constants";
import initialAssets from "./assets";
import { generateWave, isThumbnailMode } from "./utils";
//import { PageLayout } from "./react-components/PageLayout";
import { Thumbnail } from "./react-components/Thumbnail";
import { AvatarConfigurationPanel } from "./react-components/AvatarConfigurationPanel";

function dispatch(eventName, detail) {
  document.dispatchEvent(new CustomEvent(eventName, { detail }));
}

// Used externally by the generate-thumbnails script
window.renderThumbnail = (category, part) => {
  dispatch(constants.renderThumbnail, { thumbnailConfig: { category, part } });
};

function Toolbar({ onGLBUploaded, randomizeConfig, dispatchResetView, dispatchExport }) {
  return (
    <div className="toolbar">
      <span className="appName">babw</span>
      <label className="uploadButton" tabIndex="0">
        Upload custom part
        <input onChange={onGLBUploaded} type="file" id="input" accept="model/gltf-binary,.glb"></input>
      </label>
      <button onClick={randomizeConfig}>Randomize avatar</button>
      <button onClick={dispatchResetView}>Reset camera view</button>
      <button onClick={dispatchExport} className="primary">
        Export avatar
      </button>
    </div>
  );
}

function App() {
  // Used externally by the generate-thumbnails script
  const thumbnailMode = isThumbnailMode();

  const [assets, setAssets] = useState(initialAssets);
  const [hoveredConfig, setHoveredConfig] = useState({});
  const [canvasUrl, setCanvasUrl] = useState(null);

  const categoryNames = Object.keys(assets);

  function generateRandomConfig() {
    const newConfig = {};
    for (const categoryName of categoryNames) {
      const categoryAssets = assets[categoryName].parts.filter((part) => !part.excludeFromRandomize);
      if (categoryAssets.length === 0) continue;
      const randomIndex = Math.floor(Math.random() * categoryAssets.length);
      newConfig[categoryName] = categoryAssets[randomIndex].value;
    }
    return newConfig;
  }

  const initialAvatarConfig = generateRandomConfig();
  const [avatarConfig, setAvatarConfig] = useState(initialAvatarConfig);

  function onGLBUploaded(e) {
    const file = e.target.files[0];
    const filename = file.name;
    const category = filename.substring(0, filename.indexOf("_")) || "custom";
    const displayName = filename.substring(filename.indexOf("_") + 1, filename.lastIndexOf("."));
    const url = URL.createObjectURL(file);

    const clone = { ...assets };
    clone[category] = clone[category] || {
      parts: [
        {
          displayName: "None",
          value: null,
        },
      ],
    };
    clone[category].parts.push({
      displayName,
      value: url,
    });
    setAssets(clone);

    updateAvatarConfig({ [category]: url });
  }

  useEffect(() => {
    if (!thumbnailMode) {
      dispatch(constants.avatarConfigChanged, { avatarConfig: { ...avatarConfig, ...hoveredConfig } });
    }
    dispatch(constants.reactIsLoaded);
  });

  // TODO: Save the wave to a static image, or actually do some interesting animation with it.
  useEffect(async () => {
    if (canvasUrl === null) {
      setCanvasUrl(await generateWave());
    }
  });

  function updateAvatarConfig(newConfig) {
    setAvatarConfig({ ...avatarConfig, ...newConfig });
  }

  function randomizeConfig() {
    setAvatarConfig(generateRandomConfig());
  }

  function dispatchExport() {
    dispatch(constants.exportAvatar);
  }

  function dispatchResetView() {
    dispatch(constants.resetView);
  }

  const [tipState, setTipState] = useState({ visible: false, text: "", top: 0, left: 0 });
  function showTip(text, top, left) {
    setTipState({ visible: true, text, top, left });
  }

  function hideTip() {
    setTipState({ visible: false });
  }

  return (
    <>
      <div className="main">
        {!thumbnailMode && (
          <AvatarConfigurationPanel
            showTip={showTip}
            hideTip={hideTip}
            categoryNames={categoryNames}
            avatarConfig={avatarConfig}
            updateAvatarConfig={updateAvatarConfig}
            assets={assets}
            setHoveredConfig={setHoveredConfig}
          />
        )}
        <div id="sceneContainer">
          {!thumbnailMode && <div className="waveContainer" style={{ backgroundImage: `url("${canvasUrl}")` }}></div>}
          <canvas id="scene"></canvas>
        </div>
        <div
          className="buttonTip"
          style={{ display: tipState.visible ? "block" : "none", top: tipState.top, left: tipState.left }}
        >
          {tipState.text}
        </div>
      </div>
      {!thumbnailMode && <Toolbar {...{ onGLBUploaded, randomizeConfig, dispatchResetView, dispatchExport }} />}
    </>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
