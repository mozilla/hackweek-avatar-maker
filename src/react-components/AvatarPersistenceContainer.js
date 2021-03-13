import React from "react";
import { usePersistenceUIEnabled } from "../persistence";

import { AvatarPersistenceSaved } from "./AvatarPersistenceSaved";

export function AvatarPersistenceContainer({ setAvatarConfig }) {
    const [uiEnabled, setUIEnabled] = usePersistenceUIEnabled();

    if (uiEnabled) {
        return (
            <div className="peristenceContainer">
                <h2>Saved Avatars</h2>
                <AvatarPersistenceSaved {...{ setAvatarConfig }} />
            </div>
        )        
    } else {
        return (
            <></>
        )
    }
}