import React from "react";
import { useAvatarConfigSlotKeys } from "../persistence";
import { AvatarPersistenceSavedItem } from "./AvatarPersistenceSavedItem";
import { AvatarPersistenceSaveAs } from "./AvatarPersistenceSaveAs";

export function AvatarPersistenceSaved({ setAvatarConfig, avatarConfig }) {
    const avatarConfigSlotKeys = useAvatarConfigSlotKeys();
    const listItems = avatarConfigSlotKeys.map((key) => (
        <AvatarPersistenceSavedItem slotKey={key} key={key} {...{ setAvatarConfig }} />
    ));

    return (
        <ul>
            {listItems}
            <AvatarPersistenceSaveAs {...{ avatarConfig }} />
        </ul>
    )
}