import React, { useState, useEffect } from "react";
import constants from "../constants";
import { generateWave } from "../utils";
import { ToolbarContainer } from "./ToolbarContainer";
import { ButtonTip } from "./ButtonTip";
import { AvatarPreviewContainer } from "./AvatarPreviewContainer";
import { AvatarConfigurationPanel } from "./AvatarConfigurationPanel";
import { AvatarEditor } from "./AvatarEditor";
import { dispatch } from "../dispatch";
import { generateRandomConfig } from "../generate-random-config";

export function AvatarEditorContainer({ initialAssets, thumbnailMode }) {
  const [assets, setAssets] = useState(initialAssets);
  const [hoveredConfig, setHoveredConfig] = useState({});
  const [canvasUrl, setCanvasUrl] = useState(null);

  const initialAvatarConfig = generateRandomConfig(assets);
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
    setAvatarConfig(generateRandomConfig(assets));
  }

  const [tipState, setTipState] = useState({ visible: false, text: "", top: 0, left: 0 });

  function showTip(text, top, left) {
    setTipState({ visible: true, text, top, left });
  }

  function hideTip() {
    setTipState({ visible: false });
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
              showTip,
              hideTip,
              onSelectAvatarPart: ({ categoryName, part }) => {
                updateAvatarConfig({ [categoryName]: part.value });
              },
              onHoverAvatarPart: ({ categoryName, part, tip, rect }) => {
                setHoveredConfig({ [categoryName]: part.value });
                showTip(tip, rect.bottom, rect.left + rect.width / 2);
              },
              onUnhoverAvatarPart: () => {
                setHoveredConfig({});
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
