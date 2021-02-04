import React, { useRef, useContext } from "react";
import { Thumbnail } from "./Thumbnail";
import { TipContext } from "./TipContext";
import cx from "classnames";

export function ThumbnailButton({ tip, image, selected, onClick, onMouseOver, onMouseOut }) {
  const tipContext = useContext(TipContext);
  const buttonRef = useRef(null);
  return (
    <Thumbnail
      as="button"
      onClick={onClick}
      onMouseOver={() => {
        onMouseOver();
        const [rect] = buttonRef.current.getClientRects();
        tipContext.showTip(tip, rect.bottom, rect.left + rect.width / 2);
      }}
      onMouseOut={() => {
        onMouseOut();
        tipContext.hideTip();
      }}
      aria-label={tip}
      className={cx("avatarPartButton", { selected })}
      image={image}
      ref={buttonRef}
    ></Thumbnail>
  );
}
