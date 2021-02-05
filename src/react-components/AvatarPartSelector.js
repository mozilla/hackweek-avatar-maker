import React, { useEffect, useRef } from "react";
import { AvatarPartContainer } from "./AvatarPartContainer";
import { CategoryHeading } from "./CategoryHeading";
import { Collapsible } from "./Collapsible";

export function AvatarPartSelector({ setExpanded, isExpanded, expandedContent, currentSelection, categoryName }) {
  const containerEl = useRef(null);
  useEffect(() => {
    if (isExpanded) {
      containerEl.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [containerEl, isExpanded]);

  return (
    <AvatarPartContainer
      ref={containerEl}
      {...{
        isExpanded,
        onKeyDown: (e) => {
          if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
            setExpanded(!isExpanded);
            e.preventDefault();
            e.stopPropagation();
          }
        },
      }}
    >
      <CategoryHeading
        {...{
          name,
          selectedPartName: currentSelection.displayName,
          image: currentSelection.value,
          isExpanded,
          onClick: () => setExpanded(!isExpanded),
        }}
      />
      {isExpanded && <Collapsible>{expandedContent}</Collapsible>}
    </AvatarPartContainer>
  );
}
