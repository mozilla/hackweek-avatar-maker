import React, { useState, useContext } from "react";
import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.min.css";
import { AvatarPartSelector } from "./AvatarPartSelector";
import { Collapsible } from "./Collapsible";
import { ThumbnailButton } from "./ThumbnailButton";
import { TipContext } from "./TipContext";

export function AvatarConfigurationPanel({
  showTip,
  hideTip,
  categories,
  avatarConfig,
  updateAvatarConfig,
  assets,
  setHoveredConfig,
}) {
  const [expandedCategory, setExpandedCategory] = useState(null);

  return (
    <div className="selector">
      <TipContext.Provider value={{ showTip, hideTip }}>
        <SimpleBar className="simpleBar" style={{ height: "100%" }} scrollableNodeProps={{ onScroll: hideTip }}>
          {categories.map((category) => {
            const selectedPart = avatarConfig[category];
            return (
              <AvatarPartSelector
                expanded={expandedCategory === category}
                setExpanded={(expand) => setExpandedCategory(expand ? category : null)}
                expandedContent={
                  <Collapsible>
                    {assets[category].parts.map((part) => {
                      return (
                        <ThumbnailButton
                          tip={part.displayName}
                          image={part.value}
                          key={part.value}
                          part={part}
                          selected={part.value === selectedPart}
                          onClick={() => {
                            updateAvatarConfig({ [category]: part.value });
                          }}
                          onMouseOver={() => {
                            setHoveredConfig({ [category]: part.value });
                          }}
                          onMouseOut={() => {
                            setHoveredConfig({});
                          }}
                        />
                      );
                    })}
                  </Collapsible>
                }
                key={category}
                categoryName={category}
                selectedPart={selectedPart}
                category={assets[category]}
              ></AvatarPartSelector>
            );
          })}
        </SimpleBar>
      </TipContext.Provider>
    </div>
  );
}
