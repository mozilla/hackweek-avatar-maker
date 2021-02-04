import React, { useState, useEffect, useRef, useContext } from "react";
import { faChevronDown, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function Chevron({ expanded }) {
  return (
    <div className="chevron">
      <FontAwesomeIcon icon={expanded ? faChevronDown : faChevronRight} />
    </div>
  );
}
