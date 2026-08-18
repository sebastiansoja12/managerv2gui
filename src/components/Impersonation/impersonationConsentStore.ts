import {useSyncExternalStore} from "react";
import ImpersonationConsentService from "../../hooks/ImpersonationConsentService";
import RealtimeService from "../../hooks/RealtimeService";
import {ImpersonationConsent} from "./model/ImpersonationConsent";

export const IMPERSONATION_CONSENT_DESTINATION = "/user/queue/impersonation-consents";

const MAX_TIMER_DELAY_MS = 2_147_483_647;

export type ImpersonationConsentState = {
    enabled: boolean;
    pending: ImpersonationConsent[];
    active: ImpersonationConsent[];
};

const emptyState: ImpersonationConsentState = {enabled: false, pending: [], active: []};

let state: ImpersonationConsentState = emptyState;
let unsubscribe: (() => void) | null = null;
let expiryTimer: ReturnType<typeof setTimeout> | null = null;
let generation = 0;
const listeners = new Set<() => void>();

const update = (nextState: ImpersonationConsentState) => {
    state = nextState;
    listeners.forEach((listener) => listener());
};

const clearExpiryTimer = () => {
    if (expiryTimer) {
        clearTimeout(expiryTimer);
        expiryTimer = null;
    }
};

const nextExpiry = (pending: ImpersonationConsent[], active: ImpersonationConsent[]) => (
    [...pending.map((consent) => consent.requestExpiresAt), ...active.map((consent) => consent.accessExpiresAt)]
        .map((value) => (value ? new Date(value).getTime() : Number.NaN))
        .filter((value) => !Number.isNaN(value))
        .reduce<number | null>((earliest, value) => (earliest === null || value < earliest ? value : earliest), null)
);

const scheduleExpiryRefresh = (pending: ImpersonationConsent[], active: ImpersonationConsent[]) => {
    clearExpiryTimer();
    const expiresAt = nextExpiry(pending, active);
    if (expiresAt === null) {
        return;
    }
    const delay = Math.min(Math.max(expiresAt - Date.now(), 0) + 1000, MAX_TIMER_DELAY_MS);
    expiryTimer = setTimeout(() => void refreshImpersonationConsents(), delay);
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
            scheduleExpiryRefresh(pending, active);
        }
    } catch {
        return;
    }
};

const onConsentsChanged = () => {
    void refreshImpersonationConsents();
};

export const startImpersonationConsentUpdates = () => {
    if (state.enabled) {
        return;
    }
    generation += 1;
    update({...emptyState, enabled: true});
    void refreshImpersonationConsents();
    unsubscribe = RealtimeService.subscribe(IMPERSONATION_CONSENT_DESTINATION, onConsentsChanged, onConsentsChanged);
};

export const stopImpersonationConsentUpdates = () => {
    generation += 1;
    unsubscribe?.();
    unsubscribe = null;
    clearExpiryTimer();
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
