import React from "react";
import { usePersistenceUIEnabled } from "../persistence";

import { AvatarPersistenceSaved } from "./AvatarPersistenceSaved";

export function AvatarPersistenceContainer() {
    const [uiEnabled, setUIEnabled] = usePersistenceUIEnabled();

    if (uiEnabled) {
        return (
            <div>
                <div>persistence</div>
                <AvatarPersistenceSaved />
            </div>
        )        
    } else {
        return (
            <></>
        )
    }
}