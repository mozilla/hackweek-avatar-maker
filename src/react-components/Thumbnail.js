import React from "react";
import cx from "classnames";

export const Thumbnail = React.forwardRef(({ as: Component = "div", image, className, children, ...props }, ref) => {
  return (
    <Component
      className={cx("partThumbnail", className)}
      style={{ backgroundImage: image ? `url("assets/thumbnails/${image}.jpg")` : "none" }}
      {...props}
      ref={ref}
    >
      {children}
    </Component>
  );
});
