import React, { useEffect, useRef } from "react";
import { AvatarPartContainer } from "./AvatarPartContainer";
import { CategoryHeading } from "./CategoryHeading";

export function AvatarPartSelector({
  onPartSelected,
  onPartEnter,
  onPartLeave,
  setExpanded,
  expanded,
  expandedContent,
  category,
  selectedPart,
  categoryName,
}) {
  const containerEl = useRef(null);
  useEffect(() => {
    if (expanded) {
      containerEl.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [containerEl, expanded]);
  const selectedPartInfo = category.parts.find((part) => part.value === selectedPart);

  return (
    <AvatarPartContainer ref={containerEl} {...{ expanded, setExpanded }}>
      <CategoryHeading
        categoryName={categoryName}
        selectedPartInfo={selectedPartInfo}
        onClick={() => setExpanded(!expanded)}
        expanded={expanded}
      />
      {expanded && expandedContent}
    </AvatarPartContainer>
  );
}
