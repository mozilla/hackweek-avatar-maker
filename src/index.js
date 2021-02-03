import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.min.css";
import "./game";
import constants from "./constants";
import initialAssets from "./assets";
import { generateWave } from "./utils";

function dispatch(eventName, detail) {
  document.dispatchEvent(new CustomEvent(eventName, { detail }));
}

// Used externally by the generate-thumbnails script
window.renderThumbnail = (category, part) => {
  dispatch(constants.renderThumbnail, { thumbnailConfig: { category, part } });
};

function CategoryHeading({ categoryName, selectedPartName }) {
  return (
    <div className="categoryHeading">
      <h2 className="categoryName">{categoryName}</h2>
      <h2 className="selectedPartName">{selectedPartName}</h2>
    </div>
  );
}

function AvatarPartList({ children }) {
  return <>{children}</>;
}

function AvatarPartButton({ part, selected, onPartSelected, onPartEnter, onPartLeave }) {
  return (
    <>
      <button
        onClick={() => {
          onPartSelected(part.value);
        }}
        onPointerEnter={() => {
          onPartEnter(part.value);
        }}
        onPointerLeave={() => {
          onPartLeave();
        }}
        className={"avatarPartButton " + (selected && "selected")}
        style={{ backgroundImage: part.value ? `url("assets/thumbnails/${part.value}.png")` : "none" }}
      ></button>
    </>
  );
}

function AvatarPartSelector({ onPartSelected, onPartEnter, onPartLeave, parts, selected, categoryName }) {
  const selectedPart = parts.find((part) => part.value === selected);
  return (
    <div className="partSelector">
      <CategoryHeading categoryName={categoryName} selectedPartName={selectedPart.displayName} />
      <AvatarPartList>
        {parts.map((part) => {
          return (
            <AvatarPartButton
              key={part.value}
              selected={part.value === selected}
              onPartSelected={onPartSelected}
              onPartEnter={onPartEnter}
              onPartLeave={onPartLeave}
              part={part}
            />
          );
        })}
      </AvatarPartList>
    </div>
  );
}

function App() {
  // Used externally by the generate-thumbnails script
  const thumbnailMode = new URLSearchParams(location.search).get("thumbnail") !== null;

  const [assets, setAssets] = useState(initialAssets);
  const [hoveredConfig, setHoveredConfig] = useState({});
  const [canvasUrl, setCanvasUrl] = useState(null);

  const categories = Object.keys(assets);

  function generateRandomConfig() {
    const newConfig = {};
    for (const category of categories) {
      const categoryAssets = assets[category].filter((part) => !part.excludeFromRandomize);
      if (categoryAssets.length === 0) continue;
      const randomIndex = Math.floor(Math.random() * categoryAssets.length);
      newConfig[category] = categoryAssets[randomIndex].value;
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
    clone[category] = clone[category] || [
      {
        displayName: "none",
        value: null,
      },
    ];
    clone[category].push({
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

  return (
    <>
      <div className="main">
        {!thumbnailMode && (
          <div className="selector">
            <SimpleBar style={{ height: "100%" }}>
              {categories.map((category) => (
                <AvatarPartSelector
                  key={category}
                  categoryName={category}
                  selected={avatarConfig[category]}
                  onPartSelected={(selection) => {
                    updateAvatarConfig({ [category]: selection });
                  }}
                  onPartEnter={(selection) => {
                    setHoveredConfig({ [category]: selection });
                  }}
                  onPartLeave={() => {
                    setHoveredConfig({});
                  }}
                  parts={assets[category]}
                />
              ))}
            </SimpleBar>
          </div>
        )}
        <div id="sceneContainer">
          {!thumbnailMode && <div className="waveContainer" style={{ backgroundImage: `url("${canvasUrl}")` }}></div>}
          <canvas id="scene"></canvas>
        </div>
      </div>
      {!thumbnailMode && (
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
      )}
    </>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
