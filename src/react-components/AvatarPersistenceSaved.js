import React, { useLayoutEffect } from "react";
import { useAvatarConfigSlotKeys } from "../persistence";
import { AvatarPersistenceSavedItem } from "./AvatarPersistenceSavedItem";

export function AvatarPersistenceSaved() {
    const avatarConfigSlotKeys = useAvatarConfigSlotKeys();
    const listItems = avatarConfigSlotKeys.map((key) => (
        <AvatarPersistenceSavedItem slotKey={key} key={key} />
    ));

    return (
        <ul>{listItems}</ul>
    )
}