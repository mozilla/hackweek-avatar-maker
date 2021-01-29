import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./game";
import constants from "./constants";
import assets from "./assets";
const avatarParts = Object.keys(assets);

function AvatarPartSelector({ onPartSelected, parts }) {
  return (
    <select
      // TODO: Figure out what to do about single options
      onChange={(e) => {
        onPartSelected(e.target.selectedOptions[0].getAttribute("value"));
      }}
    >
      {parts.map((part, i) => (
        <option key={i} value={part.value}>
          {part.displayName}
        </option>
      ))}
    </select>
  );
}

const initialAvatarConfig = {};
for (const part of avatarParts) {
  initialAvatarConfig[part] = assets[part][0].value;
}

function App() {
  const [avatarConfig, setAvatarConfig] = useState(initialAvatarConfig);

  useEffect(() => {
    document.body.dispatchEvent(new CustomEvent(constants.avatarConfigChanged, { detail: { avatarConfig } }));
  });

  function updateAvatarConfig(newConfig) {
    setAvatarConfig({ ...avatarConfig, ...newConfig });
  }


  return (
    <>
      {avatarParts.map((part) => (
        <AvatarPartSelector
          key={part}
          onPartSelected={(selection) => {
            updateAvatarConfig({ [part]: selection });
          }}
          parts={assets[part]}
        />
      ))}
    </>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
