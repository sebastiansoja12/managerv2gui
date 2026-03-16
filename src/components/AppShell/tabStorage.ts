export const OPEN_TABS_STORAGE_KEY = "manager.openTabs";

export const clearStoredTabs = () => {
    try {
        window.localStorage.removeItem(OPEN_TABS_STORAGE_KEY);
    } catch {
        // Browser storage can be unavailable in private mode; tabs still work for the current session.
    }
};

