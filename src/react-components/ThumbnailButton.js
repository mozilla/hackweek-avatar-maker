import React from "react";
import { Thumbnail } from "./Thumbnail";
import cx from "classnames";

export const ThumbnailButton = React.forwardRef(({ tip, image, selected, onClick, onMouseOver, onMouseOut }, ref) => {
  return (
    <Thumbnail
      as="button"
      onClick={onClick}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      aria-label={tip}
      className={cx("avatarPartButton", { selected })}
      image={image}
      ref={ref}
    ></Thumbnail>
  );
});
