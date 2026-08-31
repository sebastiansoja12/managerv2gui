import {DeviceAssignmentModeDto, DeviceDto} from "./dto/DeviceDto";

const STORAGE_KEY = "manager.browserDevice";
const INSTALLATION_ID_KEY = "manager.browserInstallationId";
const LEGACY_PAIR_KEYS_PREFIX = "manager.devicePairKeys.";

export type BrowserDevice = {
    deviceId: string;
    deviceType: string | null;
    departmentCode: string | null;
    version: string | null;
    assignmentMode: DeviceAssignmentModeDto | null;
    pairKey: string;
};

export const toBrowserDevice = (device: DeviceDto, pairKey: string): BrowserDevice => ({
    deviceId: device.deviceId?.value || "",
    deviceType: device.deviceType,
    departmentCode: device.depotCode?.value || null,
    version: device.version?.value || null,
    assignmentMode: device.assignmentMode || null,
    pairKey,
});

export const readBrowserDevice = (): BrowserDevice | null => {
    try {
        const storedValue = window.localStorage.getItem(STORAGE_KEY);
        const parsed = storedValue ? JSON.parse(storedValue) as BrowserDevice : null;
        return parsed?.deviceId && parsed.pairKey ? parsed : null;
    } catch (error) {
        return null;
    }
};

export const saveBrowserDevice = (device: BrowserDevice) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(device));
    } catch (error) {
        // Storage can be unavailable (private mode, quota); the device then has to be activated again next time.
    }
};

export const clearBrowserDevice = () => {
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        // Nothing to clear when storage is unavailable.
    }
};

const generateInstallationId = () => (
    typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
);

export const browserInstallationId = (): string => {
    try {
        const storedValue = window.localStorage.getItem(INSTALLATION_ID_KEY);
        if (storedValue) {
            return storedValue;
        }
        const installationId = `web-${generateInstallationId()}`;
        window.localStorage.setItem(INSTALLATION_ID_KEY, installationId);
        return installationId;
    } catch (error) {
        return `web-${generateInstallationId()}`;
    }
};

export const removeLegacyPairKeys = () => {
    try {
        Object.keys(window.localStorage)
            .filter((key) => key.startsWith(LEGACY_PAIR_KEYS_PREFIX))
            .forEach((key) => window.localStorage.removeItem(key));
    } catch (error) {
        // Nothing to clear when storage is unavailable.
    }
};
