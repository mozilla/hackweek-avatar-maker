import React, { useState } from "react";
import { faSave, faWindowClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { saveAvatarConfig } from "../persistence";

export function AvatarPersistenceSaveAs({ avatarConfig }) {
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState('');

    function openSaveAs() {
        setAdding(true);
    }

    function cancel() {
        setAdding(false);
        setName('');
    }

    function cancelOnEscape(e) {
        if (e.keyCode === 27) {
            cancel();
        }
    }

    function save() {
        saveAvatarConfig(name, avatarConfig);
        setAdding(false);
        setName('');
    }

    function saveDisabled() {
        return name === "";
    }

    if (adding) {
        return (
            <li className="saveAs open">
                <div>
                    <input type="text" value={name} autoFocus 
                        onChange={e => setName(e.target.value)} 
                        onKeyDown={cancelOnEscape}
                        placeholder="Save Current Avatar as ..."/>
                </div>
                <div className="savedItemActions">
                    <button className="savedItemAction" title="Cancel" onClick={cancel}>
                        <FontAwesomeIcon icon={ faWindowClose } />
                    </button>
                    <button className="savedItemAction" title="Save" onClick={save} disabled={saveDisabled()} >
                        <FontAwesomeIcon icon={ faSave } />
                    </button>
                </div>
            </li>
        )    
    } else {
        return (
            <li className="saveAs closed">
                <button onClick={openSaveAs}>Save Current As...</button>
            </li>
        )
    }
}