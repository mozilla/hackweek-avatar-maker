import React, { useLayoutEffect } from "react";
import { faArrowAltCircleRight, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { saveAvatarConfig, getAvatarConfig, getAvatarConfigSlotKeys, avatarPersistenceUIEnabled } from "../persistence";

export function AvatarPersistenceSavedItem({ slotKey, setAvatarConfig }) {
    
    function loadAvatar() {
        setAvatarConfig(getAvatarConfig(slotKey));
    }

    return (
        <li>
            <div>{slotKey}</div>
            <div className="savedItemActions">
                <button className="savedItemAction" title="Delete Icon">
                    <FontAwesomeIcon icon={ faTrashAlt } />
                </button>
                <button className="savedItemAction" title="Load Avatar" onClick={loadAvatar}>
                    <FontAwesomeIcon icon={ faArrowAltCircleRight } />
                </button>
            </div>
        </li>
    )

}