import {useSyncExternalStore} from "react";
import {CurrentUserDto} from "./UserProfileDto";

export type AuthStatus = "initializing" | "authenticated" | "unauthenticated";

type AuthState = {
    status: AuthStatus;
    user: CurrentUserDto | null;
};

let state: AuthState = {
    status: "initializing",
    user: null,
};

const listeners = new Set<() => void>();

const updateState = (nextState: AuthState) => {
    state = nextState;
    listeners.forEach((listener) => listener());
};

export const setAuthenticated = (user: CurrentUserDto) => {
    updateState({status: "authenticated", user});
};

export const setUnauthenticated = () => {
    updateState({status: "unauthenticated", user: null});
};

export const subscribeAuthState = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const getAuthState = () => state;

export const useAuthState = () => useSyncExternalStore(subscribeAuthState, getAuthState, getAuthState);
