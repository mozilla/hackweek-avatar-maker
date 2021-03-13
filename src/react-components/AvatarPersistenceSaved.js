import React, { useLayoutEffect } from "react";
import { useAvatarConfigSlotKeys } from "../persistence";

export function AvatarPersistenceSaved() {
    const avatarConfigSlotKeys = useAvatarConfigSlotKeys();

    const listItems = avatarConfigSlotKeys.map((key) => (
        <li key={key}>{key}</li>
    ));

    return (
        <ul>
            {listItems}
        </ul>
    )

}