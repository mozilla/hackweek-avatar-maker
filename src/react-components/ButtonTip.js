import React from "react";

export function ButtonTip({ visible, top, left, text }) {
  return (
    <div className="buttonTip" style={{ display: visible ? "block" : "none", top, left }}>
      {text}
    </div>
  );
}
