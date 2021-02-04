import React from "react";

export const AvatarPartContainer = React.forwardRef(({ expanded, setExpanded, children }, ref) => {
  return (
    <div
      tabIndex="0"
      role="button"
      className={"partSelector " + (expanded ? "expanded" : "collapsed")}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          setExpanded(!expanded);
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      ref={ref}
    >
      {children}
    </div>
  );
});
