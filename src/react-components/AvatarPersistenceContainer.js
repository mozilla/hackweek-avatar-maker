import React from "react";
import { avatarPersistenceUIEnabled } from "../persistence";

export function AvatarPersistenceContainer() {
    if (avatarPersistenceUIEnabled()) {
        return (
            <div>persistence</div>
        )        
    } else {
        return (
            <></>
        )
    }

}