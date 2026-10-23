import AuthService from "../hooks/AuthService";
import {setAuthenticated, setUnauthenticated} from "./AuthState";
import DeviceService from "../hooks/DeviceService";
import {readBrowserDevice, removeLegacyPairKeys} from "../components/Devices/browserDeviceStore";

let initializationPromise: Promise<void> | null = null;

const removeLegacyAuthKeys = () => {
    window.localStorage.removeItem("authToken");
    window.localStorage.removeItem("superAdminAuthToken");
    window.localStorage.removeItem("accessToken");
    window.localStorage.removeItem("refreshToken");
};

export const refreshCsrfToken = async () => {
    await AuthService.csrf();
};

export const loadCurrentUser = async () => {
    const response = await AuthService.me();
    setAuthenticated(response.data);
    return response.data;
};

export const initializeAuthSession = () => {
    if (!initializationPromise) {
        removeLegacyAuthKeys();
        initializationPromise = refreshCsrfToken()
            .then(loadCurrentUser)
            .then(() => undefined)
            .catch(() => setUnauthenticated());
    }

    return initializationPromise;
};

export const authenticateCurrentUser = async () => {
    await refreshCsrfToken();
    return loadCurrentUser();
};

const endBrowserDeviceSession = async () => {
    const browserDevice = readBrowserDevice();
    if (browserDevice) {
        await DeviceService.endOperatorSession(browserDevice.pairKey).catch(() => undefined);
    }
};

export const logoutAuthSession = async () => {
    try {
        await endBrowserDeviceSession();
        await AuthService.logout();
    } finally {
        removeLegacyPairKeys();
        setUnauthenticated();
        await refreshCsrfToken();
    }
};
