import React from "react";

export const AvatarPartContainer = React.forwardRef(({ onKeyDown, isExpanded, children }, ref) => {
  return (
    <div
      tabIndex="0"
      role="button"
      className={"partSelector " + (isExpanded ? "expanded" : "collapsed")}
      onKeyDown={onKeyDown}
      ref={ref}
    >
      {children}
    </div>
  );
});
