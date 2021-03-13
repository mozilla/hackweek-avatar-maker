import React, { useLayoutEffect } from "react";
import { faArrowAltCircleRight, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAvatarConfigSlotKeys } from "../persistence";

export function AvatarPersistenceSavedItem({slotKey}) {

    return (
        <li>
            <div>{slotKey}</div>
            <div className="savedItemActions">
                <button className="savedItemAction" title="Delete Icon">
                    <FontAwesomeIcon icon={ faTrashAlt } />
                </button>
                <button className="savedItemAction" title="Load Avatar">
                    <FontAwesomeIcon icon={ faArrowAltCircleRight } />
                </button>
            </div>
        </li>
    )

}