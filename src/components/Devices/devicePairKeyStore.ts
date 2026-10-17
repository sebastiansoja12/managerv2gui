const STORAGE_PREFIX = "manager.devicePairKeys.";
const PAIR_KEY_VALIDITY_MS = 48 * 60 * 60 * 1000;

type StoredPairKey = {
    pairKey: string;
    savedAt: number;
};

type StoredPairKeys = Record<string, StoredPairKey>;

const storageKey = (userId: string | number) => `${STORAGE_PREFIX}${userId}`;

const readAll = (userId: string | number): StoredPairKeys => {
    try {
        const storedValue = window.localStorage.getItem(storageKey(userId));
        const parsed = storedValue ? JSON.parse(storedValue) as StoredPairKeys : {};
        const now = Date.now();
        return Object.fromEntries(Object.entries(parsed)
            .filter(([, entry]) => entry?.pairKey && now - entry.savedAt < PAIR_KEY_VALIDITY_MS));
    } catch (error) {
        return {};
    }
};

const writeAll = (userId: string | number, pairKeys: StoredPairKeys) => {
    try {
        if (Object.keys(pairKeys).length) {
            window.localStorage.setItem(storageKey(userId), JSON.stringify(pairKeys));
        } else {
            window.localStorage.removeItem(storageKey(userId));
        }
    } catch (error) {
        // Storage can be unavailable (private mode, quota); the key then lives only in component state.
    }
};

export const readDevicePairKey = (userId: string | number, deviceId: string): string => (
    readAll(userId)[deviceId]?.pairKey || ""
);

export const saveDevicePairKey = (userId: string | number, deviceId: string, pairKey: string) => {
    const pairKeys = readAll(userId);
    if (pairKey.trim()) {
        pairKeys[deviceId] = {pairKey: pairKey.trim(), savedAt: Date.now()};
    } else {
        delete pairKeys[deviceId];
    }
    writeAll(userId, pairKeys);
};

export const removeDevicePairKey = (userId: string | number, deviceId: string) => {
    saveDevicePairKey(userId, deviceId, "");
};

export const clearDevicePairKeys = () => {
    try {
        Object.keys(window.localStorage)
            .filter((key) => key.startsWith(STORAGE_PREFIX))
            .forEach((key) => window.localStorage.removeItem(key));
    } catch (error) {
        // Nothing to clear when storage is unavailable.
    }
};
