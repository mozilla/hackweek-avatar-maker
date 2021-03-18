import { useState, useEffect } from 'react'
import { simplePubSub } from "./utils/pub-sub";

const storageKey = "avatarMaker";

const slotKeyChange = simplePubSub();

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
    slotKeyChange.publish();
}

/**
 * Returns the specified Avatar config object
 * @param {string} slotKey The key for the desired Avatar config
 * @returns {object} Avatar config
 */
export function getAvatarConfig(slotKey) {
    if (!window.localStorage) {
        console.log("No localStorage...bailing.");
        return {};
    }

    const storedConfig = getConfigFromLocalStorage();

    return storedConfig.avatars[slotKey];
}

/**
 * Deletes the specified Avatar config object
 * @param {string} slotKey The key for the desired Avatar config
 */
export function deleteAvatarConfig(slotKey) {
    if (!window.localStorage) {
        console.log("No localStorage...bailing.");
        return;
    }

    const storedConfig = getConfigFromLocalStorage();

    delete storedConfig.avatars[slotKey];
    persistToLocalStorage(storedConfig);
    slotKeyChange.publish();
}

/**
 * Returns list of the Avatar slotKeys
 * @returns {Array} List of Avatar slotKeys that have stored data.
 */
export function getAvatarConfigSlotKeys() {
    if (!window.localStorage) {
        console.log("No localStorage...bailing.");
        return [];
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
        return storedConfig.uiEnabled || true;
    }
}


// Expose the pieces that need to be reactive
export function usePersistenceUIEnabled() {
    const [storedValue, setStoredValue] = useState(avatarPersistenceUIEnabled());

    const setValue = (value) => {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        avatarPersistenceUIEnabled(valueToStore);
    };

    return [storedValue, setValue];
}

export function useAvatarConfigSlotKeys() {
    const [slotKeys, setSlotKeys] = useState(getAvatarConfigSlotKeys);

    useEffect(() => {
        //Subscribe to changes
        const subscriptionId = slotKeyChange
            .subscribe(() => setSlotKeys(getAvatarConfigSlotKeys()));

        return function cleanup() {
            slotKeyChange.unsubscribe(subscriptionId);
        }
    });

    return slotKeys;
} 
