import React, { useState } from "react";

export function MoreMenu({ items }) {
  const [menuVisible, setMenuVisible] = useState(false);
  return (
    <div className="menuContainer">
      <button className="menuButton" onClick={() => setMenuVisible(!menuVisible)}>
        ···
      </button>
      {menuVisible && <div className="menu">{items}</div>}
    </div>
  );
}
