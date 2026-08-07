import {useSyncExternalStore} from "react";

export type MaintenanceState = {
    active: boolean;
    message: string | null;
};

const inactive: MaintenanceState = {active: false, message: null};

let state: MaintenanceState = inactive;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export const reportMaintenance = (message?: string | null) => {
    const nextMessage = message?.trim() ? message.trim() : null;
    if (state.active && state.message === nextMessage) {
        return;
    }
    state = {active: true, message: nextMessage};
    emit();
};

export const clearMaintenance = () => {
    if (!state.active) {
        return;
    }
    state = inactive;
    emit();
};

export const getMaintenanceState = () => state;

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

export const useMaintenanceState = () => useSyncExternalStore(subscribe, getMaintenanceState, getMaintenanceState);

export const isMaintenanceResponse = (status?: number, data?: unknown) => (
    status === 503
    && Boolean(data)
    && typeof data === "object"
    && (data as {maintenance?: unknown}).maintenance === true
);
