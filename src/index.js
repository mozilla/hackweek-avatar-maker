import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./game";
import constants from "./constants";
import initialAssets from "./assets";

function AvatarPartSelector({ onPartSelected, parts, selected }) {
  return (
    <select
      // TODO: Figure out what to do about single options
      onChange={(e) => {
        onPartSelected(e.target.selectedOptions[0].getAttribute("value"));
      }}
      value={selected || ""}
    >
      {parts.map((part, i) => (
        <option key={i} value={part.value}>
          {part.displayName}
        </option>
      ))}
    </select>
  );
}

function App() {
  const [assets, setAssets] = useState(initialAssets);

  const categories = Object.keys(assets);

  function generateRandomConfig() {
    const newConfig = {};
    for (const category of categories) {
      const categoryAssets = assets[category].filter(part => !part.excludeFromRandomize);
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
    document.dispatchEvent(new CustomEvent(constants.avatarConfigChanged, { detail: { avatarConfig } }));
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
      {categories.map((category) => (
        <div key={category} className="category">
          <span>{category}: </span>
          <AvatarPartSelector
            selected={avatarConfig[category]}
            onPartSelected={(selection) => {
              updateAvatarConfig({ [category]: selection });
            }}
            parts={assets[category]}
          />
        </div>
      ))}
      <button onClick={randomizeConfig}>Randomize avatar</button>
      <button onClick={dispatchExport}>Export avatar</button>
      <button onClick={dispatchResetView}>Reset camera view</button>
      <label>
        Upload custom part:
        <input onChange={onGLBUploaded} type="file" id="input" accept="model/gltf-binary,.glb"></input>
      </label>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
