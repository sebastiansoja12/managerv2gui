import {useSyncExternalStore} from "react";
import SuperAdminAuthService from "../../../hooks/SuperAdminAuthService";
import {LoginRequest} from "../../LoginPage/model/LoginRequest";
import {PlatformOwnerProfile} from "./model/PlatformOwnerProfile";

export type PlatformOwnerSessionStatus = "initializing" | "authenticated" | "unauthenticated";

type PlatformOwnerSessionState = {
    status: PlatformOwnerSessionStatus;
    platformOwner: PlatformOwnerProfile | null;
};

let state: PlatformOwnerSessionState = {
    status: "initializing",
    platformOwner: null,
};

let initializationPromise: Promise<void> | null = null;

const listeners = new Set<() => void>();

const updateState = (nextState: PlatformOwnerSessionState) => {
    state = nextState;
    listeners.forEach((listener) => listener());
};

const setPlatformOwnerAuthenticated = (platformOwner: PlatformOwnerProfile) => {
    updateState({status: "authenticated", platformOwner});
};

export const setPlatformOwnerUnauthenticated = () => {
    updateState({status: "unauthenticated", platformOwner: null});
};

const loadPlatformOwner = async () => {
    const response = await SuperAdminAuthService.me();
    setPlatformOwnerAuthenticated(response.data);
    return response.data;
};

export const initializePlatformOwnerSession = () => {
    if (!initializationPromise) {
        initializationPromise = loadPlatformOwner()
            .then(() => undefined)
            .catch(() => setPlatformOwnerUnauthenticated());
    }

    return initializationPromise;
};

export const loginPlatformOwner = async (loginRequest: LoginRequest) => {
    await SuperAdminAuthService.login(loginRequest);
    return loadPlatformOwner();
};

export const logoutPlatformOwner = async () => {
    try {
        await SuperAdminAuthService.logout();
    } finally {
        setPlatformOwnerUnauthenticated();
    }
};

const subscribePlatformOwnerSession = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const getPlatformOwnerSession = () => state;

export const usePlatformOwnerSession = () => useSyncExternalStore(
    subscribePlatformOwnerSession,
    getPlatformOwnerSession,
    getPlatformOwnerSession,
);
