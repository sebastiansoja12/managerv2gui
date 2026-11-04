import AuthService from "../hooks/AuthService";
import {getActingDepartment, setActingDepartment} from "./actingDepartment";
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
    if (getActingDepartment() && response.data.departmentCode !== getActingDepartment()) {
        setActingDepartment(null);
    }
    setAuthenticated(response.data);
    return response.data;
};

export const switchActingDepartment = async (departmentCode: string | null) => {
    setActingDepartment(departmentCode);
    return loadCurrentUser();
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
        setActingDepartment(null);
        setUnauthenticated();
        await refreshCsrfToken();
    }
};
