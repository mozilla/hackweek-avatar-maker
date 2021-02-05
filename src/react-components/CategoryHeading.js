import React from "react";

import { Thumbnail } from "./Thumbnail";
import { Chevron } from "./Chevron";

export function CategoryHeading({ name, onClick, isExpanded, selectedPartName, image }) {
  return (
    <div className="categoryHeading" onClick={onClick}>
      <h2 className="categoryName">{name}</h2>
      <Chevron {...{ isExpanded }} />
      <h2 className="selectedPartName">{selectedPartName}</h2>
      <Thumbnail image={image} />
    </div>
  );
}
