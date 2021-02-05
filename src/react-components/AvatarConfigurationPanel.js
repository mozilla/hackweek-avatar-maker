import React, { useState, useContext } from "react";
import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.min.css";
import { AvatarPartSelector } from "./AvatarPartSelector";
import { CategoryContainer } from "./CategoryContainer";
import { TipContext } from "./TipContext";

export function AvatarConfigurationPanel({
  onScroll,
  avatarConfig,
  assets,
  onSelectAvatarPart,
  onHoverAvatarPart,
  onUnhoverAvatarPart,
}) {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const categoryNames = Object.keys(assets);

  const partSelectors = categoryNames.map((categoryName) => {
    const category = assets[categoryName];
    const currentSelection = category.parts.find((part) => part.value === avatarConfig[categoryName]);
    return (
      <AvatarPartSelector
        key={categoryName}
        isExpanded={expandedCategory === categoryName}
        setExpanded={(expand) => setExpandedCategory(expand ? categoryName : null)}
        categoryName={categoryName}
        currentSelection={currentSelection}
        expandedContent={
          <CategoryContainer
            {...{
              category,
              categoryName,
              currentSelection,
              onSelectAvatarPart,
              onHoverAvatarPart,
              onUnhoverAvatarPart,
            }}
          />
        }
      />
    );
  });

  return (
    <div className="selector">
      <SimpleBar className="simpleBar" style={{ height: "100%" }} scrollableNodeProps={{ onScroll }}>
        {partSelectors}
      </SimpleBar>
    </div>
  );
}
