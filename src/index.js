import React, { useState, useEffect, useRef, useContext } from "react";
import ReactDOM from "react-dom";
import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";

import "./game";
import constants from "./constants";
import initialAssets from "./assets";
import { generateWave, isThumbnailMode } from "./utils";

function dispatch(eventName, detail) {
  document.dispatchEvent(new CustomEvent(eventName, { detail }));
}

// Used externally by the generate-thumbnails script
window.renderThumbnail = (category, part) => {
  dispatch(constants.renderThumbnail, { thumbnailConfig: { category, part } });
};

const TipContext = React.createContext();

function Chevron({ expanded }) {
  return (
    <div className="chevron">
      <FontAwesomeIcon icon={expanded ? faChevronDown : faChevronRight} />
    </div>
  );
}

const PartThumbnail = React.forwardRef(({ as: Component = "div", image, className, children, ...props }, ref) => {
  return (
    <Component
      className={cx("partThumbnail", className)}
      style={{ backgroundImage: image ? `url("assets/thumbnails/${image}.jpg")` : "none" }}
      {...props}
      ref={ref}
    >
      {children}
    </Component>
  );
});

function CategoryHeading({ categoryName, selectedPartInfo, onClick, expanded }) {
  return (
    <div className="categoryHeading" onClick={onClick}>
      <h2 className="categoryName">{categoryName}</h2>
      <Chevron {...{ expanded }} />
      <h2 className="selectedPartName">{selectedPartInfo.displayName}</h2>
      <PartThumbnail image={selectedPartInfo.value} />
    </div>
  );
}

function AvatarPartList({ parts, selectedPart, ...props }) {
  return (
    <div className="avatarPartList">
      {parts.map((part) => {
        return <AvatarPartButton key={part.value} selected={part.value === selectedPart} part={part} {...props} />;
      })}
    </div>
  );
}

function AvatarPartButton({ part, selected, onPartSelected, onPartEnter, onPartLeave }) {
  const tipContext = useContext(TipContext);
  const buttonRef = useRef(null);
  return (
    <PartThumbnail
      as="button"
      onClick={() => {
        onPartSelected(part.value);
      }}
      onMouseOver={() => {
        onPartEnter(part.value);
        const [rect] = buttonRef.current.getClientRects();
        tipContext.showTip(part.displayName, rect.bottom, rect.left + rect.width / 2);
      }}
      onMouseOut={() => {
        onPartLeave();
        tipContext.hideTip();
      }}
      aria-label={part.displayName}
      className={cx("avatarPartButton", { selected })}
      image={part.value}
      ref={buttonRef}
    ></PartThumbnail>
  );
}

const AvatarPartContainer = React.forwardRef(({ expanded, setExpanded, children }, ref) => {
  return (
    <div
      tabIndex="0"
      role="button"
      className={"partSelector " + (expanded ? "expanded" : "collapsed")}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          setExpanded(!expanded);
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      ref={ref}
    >
      {children}
    </div>
  );
});

function AvatarPartSelector({
  onPartSelected,
  onPartEnter,
  onPartLeave,
  setExpanded,
  expanded,
  parts,
  selectedPart,
  categoryName,
}) {
  const containerEl = useRef(null);
  useEffect(() => {
    if (expanded) {
      containerEl.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [containerEl, expanded]);
  const selectedPartInfo = parts.find((part) => part.value === selectedPart);
  return (
    <AvatarPartContainer ref={containerEl} {...{ expanded, setExpanded }}>
      <CategoryHeading
        categoryName={categoryName}
        selectedPartInfo={selectedPartInfo}
        onClick={() => setExpanded(!expanded)}
        expanded={expanded}
      />
      <AvatarPartList {...{ parts, selectedPart, onPartSelected, onPartEnter, onPartLeave }} />
    </AvatarPartContainer>
  );
}

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
  const [expandedCategory, setExpandedCategory] = useState(null);

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
          <div className="selector">
            <TipContext.Provider value={{ showTip, hideTip }}>
              <SimpleBar className="simpleBar" style={{ height: "100%" }} scrollableNodeProps={{ onScroll: hideTip }}>
                {categories.map((category) => (
                  <AvatarPartSelector
                    expanded={expandedCategory === category}
                    setExpanded={(expand) => setExpandedCategory(expand ? category : null)}
                    key={category}
                    categoryName={category}
                    selectedPart={avatarConfig[category]}
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
            </TipContext.Provider>
          </div>
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
