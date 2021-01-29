import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./game";
import constants from "./constants";
import assets from "./assets";

function App() {
  const [avatarConfig, setAvatarConfig] = useState({
    hairStyle: null,
  });

  document.body.dispatchEvent(new CustomEvent(constants.avatarConfigChanged, { detail: { avatarConfig } }));

  return (
    <>
      <select
        onChange={(e) =>
          setAvatarConfig({
            hairStyle: e.target.selectedOptions[0].getAttribute("value"),
          })
        }
      >
        {assets.hairStyles.map((hairStyle, i) => (
          <option key={i} value={hairStyle.value}>
            {hairStyle.displayName}
          </option>
        ))}
      </select>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
