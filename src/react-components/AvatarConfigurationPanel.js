import React, { useState, useContext } from "react";
import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.min.css";
import { AvatarPartSelector } from "./AvatarPartSelector";
import { Collapsible } from "./Collapsible";
import { ThumbnailButton } from "./ThumbnailButton";
import { TipContext } from "./TipContext";

function match({ description, part }) {
  if (!part.description) return false;
  for (const param of Object.keys(description)) {
    if (part.description[param] !== description[param]) {
      return false;
    }
  }
  return true;
}

export function configForCategory({ category, categoryName, selectedPart, updateAvatarConfig, setHoveredConfig }) {
  const wholeSelectedPart = category.parts.find((part) => {
    return part.value === selectedPart;
  });
  const optionNames = Object.keys(category.description);

  return optionNames.map((optionName) => {
    const options = category.description[optionName];
    const parts = options.map((option) => {
      const description = Object.assign({}, wholeSelectedPart.description);
      description[optionName] = option;
      const part = category.parts.find((part) => {
        return match({ description, part });
      });
      const tip = option.split("-").map((p) => capitalize(p)).join(" ");
      return { part, tip };
    });

    return (
      <>
        <h2>{optionName}</h2>
        {parts.map(({ part, tip }) => {
          return (
            <ThumbnailButton
              tip={tip}
              image={part.value}
              key={part.value}
              part={part}
              selected={part.value === selectedPart}
              onClick={() => {
                updateAvatarConfig({ [categoryName]: part.value });
              }}
              onMouseOver={() => {
                setHoveredConfig({ [categoryName]: part.value });
              }}
              onMouseOut={() => {
                setHoveredConfig({});
              }}
            />
          );
        })}
      </>
    );
  });
}

export function AvatarConfigurationPanel({
  showTip,
  hideTip,
  categoryNames,
  avatarConfig,
  updateAvatarConfig,
  assets,
  setHoveredConfig,
}) {
  const [expandedCategory, setExpandedCategory] = useState(null);

  function contentFor(category, categoryName, selectedPart) {
    const inner = category.description
      ? configForCategory({
          category,
          categoryName,
          selectedPart,
          updateAvatarConfig,
          setHoveredConfig,
        })
      : category.parts.map((part) => {
          return (
            <ThumbnailButton
              tip={part.displayName}
              image={part.value}
              key={part.value}
              part={part}
              selected={part.value === selectedPart}
              onClick={() => {
                updateAvatarConfig({ [categoryName]: part.value });
              }}
              onMouseOver={() => {
                setHoveredConfig({ [categoryName]: part.value });
              }}
              onMouseOut={() => {
                setHoveredConfig({});
              }}
            />
          );
        });

    return <Collapsible>{inner}</Collapsible>;
  }

  return (
    <div className="selector">
      <TipContext.Provider value={{ showTip, hideTip }}>
        <SimpleBar className="simpleBar" style={{ height: "100%" }} scrollableNodeProps={{ onScroll: hideTip }}>
          {categoryNames.map((categoryName) => {
            const category = assets[categoryName];
            const selectedPart = avatarConfig[categoryName];
            return (
              <AvatarPartSelector
                expanded={expandedCategory === categoryName}
                setExpanded={(expand) => setExpandedCategory(expand ? categoryName : null)}
                expandedContent={contentFor(category, categoryName, selectedPart)}
                key={categoryName}
                categoryName={categoryName}
                selectedPart={selectedPart}
                category={category}
              ></AvatarPartSelector>
            );
          })}
        </SimpleBar>
      </TipContext.Provider>
    </div>
  );
}

function capitalize(str) {
  return str[0].toUpperCase() + str.substring(1);
}
