const storageKey = "avatarMaker";

function getConfigFromLocalStorage() {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
        return JSON.parse(stored);
    } else {
        return { avatars: {}, uiEnabled: false };
    }
}

function persistToLocalStorage(config) {
    localStorage.setItem(storageKey, JSON.stringify(config))
}

/**
 * Saves an Avatar config object
 * @param {string} slotKey key to store under
 * @param {object} avatarConfig Avatar config object to store
 */
export function saveAvatarConfig(slotKey, avatarConfig) {
    if (!window.localStorage) {
        console.log("No localStorage...bailing.");
    }

    const storedConfig = getConfigFromLocalStorage();

    storedConfig.avatars[slotKey] = avatarConfig;

    persistToLocalStorage(storedConfig);
}

/**
 * Returns the specified Avatar config object
 * @param {string} slotKey The key for the desired Avatar config
 * @returns {object} Avatar config
 */
export function getAvatarConfig(slotKey) {
    if (!window.localStorage) {
        console.log("No localStorage...bailing.");
    }

    const storedConfig = getConfigFromLocalStorage();

    return storedConfig.avatars[slotKey];
}

/**
 * Returns list of the Avatar slotKeys
 * @returns {Array} List of Avatar slotKeys that have stored data.
 */
export function getAvatarConfigSlotKeys() {
    if (!window.localStorage) {
        console.log("No localStorage...bailing.");
    }

    const storedConfig = getConfigFromLocalStorage();

    return Object.keys(storedConfig.avatars);
}

export function avatarPersistenceUIEnabled(newValue) {

    const storedConfig = getConfigFromLocalStorage();

    if (newValue !== undefined) {
        storedConfig.uiEnabled = newValue;
        persistToLocalStorage(storedConfig);
    } else {
        return storedConfig.uiEnabled || false;
    }
}