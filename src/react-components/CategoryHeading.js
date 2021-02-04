import React from "react";

import { Thumbnail } from "./Thumbnail";
import { Chevron } from "./Chevron";

export function CategoryHeading({ categoryName, selectedPartInfo, onClick, expanded }) {
  return (
    <div className="categoryHeading" onClick={onClick}>
      <h2 className="categoryName">{categoryName}</h2>
      <Chevron {...{ expanded }} />
      <h2 className="selectedPartName">{selectedPartInfo.displayName}</h2>
      <Thumbnail image={selectedPartInfo.value} />
    </div>
  );
}
