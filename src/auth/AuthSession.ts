import AuthService from "../hooks/AuthService";
import {setAuthenticated, setUnauthenticated} from "./AuthState";

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

export const logoutAuthSession = async () => {
    try {
        await AuthService.logout();
    } finally {
        setUnauthenticated();
        await refreshCsrfToken();
    }
};
