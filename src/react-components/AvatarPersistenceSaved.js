import React, { useLayoutEffect } from "react";
import { useAvatarConfigSlotKeys } from "../persistence";
import { AvatarPersistenceSavedItem } from "./AvatarPersistenceSavedItem";

export function AvatarPersistenceSaved({ setAvatarConfig }) {
    const avatarConfigSlotKeys = useAvatarConfigSlotKeys();
    const listItems = avatarConfigSlotKeys.map((key) => (
        <AvatarPersistenceSavedItem slotKey={key} key={key} {...{ setAvatarConfig }} />
    ));

    return (
        <ul>{listItems}</ul>
    )
}