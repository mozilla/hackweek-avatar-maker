import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./game";
import constants from "./constants";
import initialAssets from "./assets";

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

function AvatarPartButton({ part, onPartSelected, onPartEnter, onPartLeave }) {
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
          className="avatarPartButton"
        >
        </button>
    </>
  );
}

function AvatarPartSelector({ onPartSelected, onPartEnter, onPartLeave, parts, selected, categoryName }) {
  const selectedPart = parts.find((part) => part.value === selected);
  return (
    <>
      <CategoryHeading categoryName={categoryName} selectedPartName={selectedPart.displayName} />
      <AvatarPartList>
        {parts.map((part) => {
          return (
            <AvatarPartButton
              key={part.value}
              onPartSelected={onPartSelected}
              onPartEnter={onPartEnter}
              onPartLeave={onPartLeave}
              part={part}
            />
          );
        })}
      </AvatarPartList>
    </>
  );
}

function App() {
  const [assets, setAssets] = useState(initialAssets);
  const [hoveredConfig, setHoveredConfig] = useState({});

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
    document.dispatchEvent(
      new CustomEvent(constants.avatarConfigChanged, {
        detail: { avatarConfig: { ...avatarConfig, ...hoveredConfig } },
      })
    );
    document.dispatchEvent(new CustomEvent(constants.reactIsLoaded));
  });

  function updateAvatarConfig(newConfig) {
    setAvatarConfig({ ...avatarConfig, ...newConfig });
  }

  function randomizeConfig() {
    setAvatarConfig(generateRandomConfig());
  }

  function dispatchExport() {
    document.dispatchEvent(new CustomEvent(constants.exportAvatar));
  }

  function dispatchResetView() {
    document.dispatchEvent(new CustomEvent(constants.resetView));
  }

  return (
    <>
      <div className="main">
        <div className="selector">
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
        </div>
        <div id="sceneContainer">
          <canvas id="scene"></canvas>
        </div>
      </div>
      <div id="toolbar">
        <button onClick={randomizeConfig}>Randomize avatar</button>
        <button onClick={dispatchExport}>Export avatar</button>
        <button onClick={dispatchResetView}>Reset camera view</button>
        <label>
          Upload custom part:
          <input onChange={onGLBUploaded} type="file" id="input" accept="model/gltf-binary,.glb"></input>
        </label>
      </div>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
