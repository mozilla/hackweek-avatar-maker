import React, { useState } from "react";
import { faSave, faWindowClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { saveAvatarConfig } from "../persistence";

export function AvatarPersistenceSaveAs({ avatarConfig }) {
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState('');

    function toggleAdding() {
        setAdding(!adding);
    }

    function save() {
        console.log(`save as '${name}'`);
        saveAvatarConfig(name, avatarConfig);
        toggleAdding();
    }

    if (adding) {
        return (
            <li className="saveAs">
                <div>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Save Current Avatar as ..."/>
                </div>
                <div className="savedItemActions">
                    <button className="savedItemAction" title="Cancel" onClick={toggleAdding}>
                        <FontAwesomeIcon icon={ faWindowClose } />
                    </button>
                    <button className="savedItemAction" title="Save" onClick={save} >
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