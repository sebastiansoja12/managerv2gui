const STORAGE_KEY = "manager.shipmentScanner.preferences";

export type ScannerPreferences = {
    tabletMode: boolean;
    soundEnabled: boolean;
};

const defaultPreferences: ScannerPreferences = {tabletMode: false, soundEnabled: true};

// Kept per browser: a tablet on the hall stays in tablet mode, a desk computer does not.
export const readScannerPreferences = (): ScannerPreferences => {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) as Partial<ScannerPreferences> : {};
        return {
            tabletMode: typeof parsed.tabletMode === "boolean" ? parsed.tabletMode : defaultPreferences.tabletMode,
            soundEnabled: typeof parsed.soundEnabled === "boolean" ? parsed.soundEnabled : defaultPreferences.soundEnabled,
        };
    } catch {
        return defaultPreferences;
    }
};

export const saveScannerPreferences = (preferences: ScannerPreferences) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
        // Storage can be unavailable; the preference then lasts until the view is closed.
    }
};
