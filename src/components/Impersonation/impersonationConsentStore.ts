import {useSyncExternalStore} from "react";
import ImpersonationConsentService from "../../hooks/ImpersonationConsentService";
import {ImpersonationConsent} from "./model/ImpersonationConsent";

export const IMPERSONATION_CONSENT_POLL_INTERVAL_MS = 15_000;

export type ImpersonationConsentState = {
    enabled: boolean;
    pending: ImpersonationConsent[];
    active: ImpersonationConsent[];
};

const emptyState: ImpersonationConsentState = {enabled: false, pending: [], active: []};

let state: ImpersonationConsentState = emptyState;
let timer: ReturnType<typeof setInterval> | null = null;
let generation = 0;
const listeners = new Set<() => void>();

const update = (nextState: ImpersonationConsentState) => {
    state = nextState;
    listeners.forEach((listener) => listener());
};

export const refreshImpersonationConsents = async () => {
    if (!state.enabled) {
        return;
    }
    const currentGeneration = generation;
    try {
        const [pending, active] = await Promise.all([
            ImpersonationConsentService.getPending(),
            ImpersonationConsentService.getActive(),
        ]);
        if (currentGeneration === generation && state.enabled) {
            update({enabled: true, pending, active});
        }
    } catch {
        // Keep the last known state; the next poll will retry.
    }
};

const refreshOnFocus = () => {
    void refreshImpersonationConsents();
};

export const startImpersonationConsentPolling = () => {
    if (state.enabled) {
        return;
    }
    generation += 1;
    update({...emptyState, enabled: true});
    void refreshImpersonationConsents();
    timer = setInterval(() => void refreshImpersonationConsents(), IMPERSONATION_CONSENT_POLL_INTERVAL_MS);
    window.addEventListener("focus", refreshOnFocus);
};

export const stopImpersonationConsentPolling = () => {
    generation += 1;
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    window.removeEventListener("focus", refreshOnFocus);
    if (state !== emptyState) {
        update(emptyState);
    }
};

const runAndRefresh = async <T,>(action: () => Promise<T>) => {
    const result = await action();
    await refreshImpersonationConsents();
    return result;
};

export const approveImpersonationConsent = (consentId: number | string, durationMinutes: number) => (
    runAndRefresh(() => ImpersonationConsentService.approve(consentId, durationMinutes))
);

export const rejectImpersonationConsent = (consentId: number | string) => (
    runAndRefresh(() => ImpersonationConsentService.reject(consentId))
);

export const revokeImpersonationConsent = (consentId: number | string) => (
    runAndRefresh(() => ImpersonationConsentService.revoke(consentId))
);

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

const getSnapshot = () => state;

export const useImpersonationConsents = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
