import React, { useState } from "react";
import { faSave, faWindowClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { deleteAvatarConfig, getAvatarConfig } from "../persistence";

export function AvatarPersistenceSaveAs() {
    const [adding, setAdding] = useState(false);

    function toggleAdding() {
        setAdding(!adding);
    }

    if (adding) {
        return (
            <li className="saveAs">
                <div>
                    <input type="text" placeholder="Save Current Avatar as ..."/>
                </div>
                <div className="savedItemActions">
                    <button className="savedItemAction" title="Cancel" onClick={toggleAdding}>
                        <FontAwesomeIcon icon={ faWindowClose } />
                    </button>
                    <button className="savedItemAction" title="Save" >
                        <FontAwesomeIcon icon={ faSave } />
                    </button>
                </div>
            </li>
        )    
    } else {
        return (
            <li>
                <button onClick={toggleAdding}>Save Current As...</button>
            </li>
        )
    }
    

}