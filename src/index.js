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
    >
      {parts.map((part, i) => (
        <option key={i} value={part.value} selected={selected === part.value}>
          {part.displayName}
        </option>
      ))}
    </select>
  );
}

function App() {
  const [assets, setAssets] = useState(initialAssets);

  const categories = Object.keys(assets);
  const initialAvatarConfig = {};
  for (const category of categories) {
    initialAvatarConfig[category] = assets[category][0].value;
  }
  const [avatarConfig, setAvatarConfig] = useState(initialAvatarConfig);

  function onGLBUploaded(e) {
    const file = e.target.files[0];
    const filename = file.name;
    const category = filename.substring(0, filename.indexOf("_"));
    const displayName = filename.substring(filename.indexOf("_") + 1, filename.lastIndexOf("."));
    const url = URL.createObjectURL(file);

    const clone = { ...assets };
    clone[category] = clone[category] || [
      {
        displayName: "None",
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

  function dispatchExport() {
    document.dispatchEvent(new CustomEvent(constants.exportAvatar));
  }

  function dispatchResetView() {
    document.dispatchEvent(new CustomEvent(constants.resetView));
  }

  return (
    <>
      {categories.map((category) => (
        <AvatarPartSelector
          selected={avatarConfig[category]}
          key={category}
          onPartSelected={(selection) => {
            updateAvatarConfig({ [category]: selection });
          }}
          parts={assets[category]}
        />
      ))}
      <button onClick={dispatchExport}>export</button>
      <button onClick={dispatchResetView}>reset view</button>
      <input onChange={onGLBUploaded} type="file" id="input" accept="model/gltf-binary,.glb"></input>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
