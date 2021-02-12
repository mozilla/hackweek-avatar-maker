import React, { useState, useEffect, useCallback } from "react";
import constants from "../constants";
import { generateWave } from "../utils";
import { ToolbarContainer } from "./ToolbarContainer";
import { ButtonTip } from "./ButtonTip";
import { AvatarPreviewContainer } from "./AvatarPreviewContainer";
import { AvatarConfigurationPanel } from "./AvatarConfigurationPanel";
import { AvatarEditor } from "./AvatarEditor";
import { dispatch } from "../dispatch";
import { generateRandomConfig } from "../generate-random-config";
import initialAssets from "../assets";
import { isThumbnailMode } from "../utils";
import { getMaterialInfo } from "../get-material-info";
import debounce from "../utils/debounce";

// Used externally by the generate-thumbnails script
const thumbnailMode = isThumbnailMode();

export function AvatarEditorContainer() {
  const [assets, setAssets] = useState(initialAssets);
  const [hoveredConfig, setHoveredConfig] = useState({});
  const debouncedSetHoveredConfig = useCallback(debounce(setHoveredConfig), [setHoveredConfig]);
  const [canvasUrl, setCanvasUrl] = useState(null);

  // const initialConfig = {
  //   Hair: null,
  //   Head: "head_bald-skin-7",
  //   Eyes: null,
  //   Eyebrows: null,
  //   Mouth: null,
  //   "Facial Hair": "facial-hair_beard-full-1-dark brown",
  //   Hands: "hands_skin-1",
  //   Torso: null,
  //   Hat: "hat_baseball-giants",
  //   Eyewear: null,
  //   Earring: null,
  //   Accessory: "accessory_duck-floaty",
  //   "Torso Jacket": null,
  // };
  const initialConfig = generateRandomConfig(assets);

  const [avatarConfig, setAvatarConfig] = useState(initialConfig);
  const [tipState, setTipState] = useState({ visible: false, text: "", top: 0, left: 0 });

  // Used to test material info. TODO: Remove
  window.getMaterialInfo = function () {
    return getMaterialInfo(assets);
  };

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

  function showTip(text, top, left) {
    setTipState({ visible: true, text, top, left });
  }

  function hideTip() {
    setTipState({ visible: false });
  }

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

  function randomizeConfig() {
    setAvatarConfig(generateRandomConfig(assets));
  }

  return (
    <AvatarEditor
      {...{
        thumbnailMode,
        leftPanel: (
          <AvatarConfigurationPanel
            {...{
              avatarConfig,
              assets,
              onScroll: () => {
                hideTip();
              },
              onSelectAvatarPart: ({ categoryName, part }) => {
                updateAvatarConfig({ [categoryName]: part.value });
              },
              onHoverAvatarPart: ({ categoryName, part, tip, rect }) => {
                debouncedSetHoveredConfig({ [categoryName]: part.value });
                showTip(tip, rect.bottom, rect.left + rect.width / 2);
              },
              onUnhoverAvatarPart: () => {
                debouncedSetHoveredConfig({});
                hideTip();
              },
            }}
          />
        ),
        rightPanel: <AvatarPreviewContainer {...{ thumbnailMode, canvasUrl }} />,
        buttonTip: <ButtonTip {...tipState} />,
        toolbar: <ToolbarContainer {...{ onGLBUploaded, randomizeConfig }} />,
      }}
    />
  );
}
