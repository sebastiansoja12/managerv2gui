import {useSyncExternalStore} from "react";
import {CurrentSubscription} from "./model/Subscription";

export type SubscriptionState = {
    blocked: boolean;
    subscription: CurrentSubscription | null;
};

const unblocked: SubscriptionState = {blocked: false, subscription: null};

let state: SubscriptionState = unblocked;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

const sameSubscription = (left: CurrentSubscription | null, right: CurrentSubscription) => (
    left?.status === right.status
    && left?.plan === right.plan
    && left?.startDate === right.startDate
    && left?.endDate === right.endDate
);

export const reportInactiveSubscription = (subscription: CurrentSubscription) => {
    if (state.blocked && sameSubscription(state.subscription, subscription)) {
        return;
    }
    state = {blocked: true, subscription};
    emit();
};

export const clearInactiveSubscription = () => {
    if (!state.blocked) {
        return;
    }
    state = unblocked;
    emit();
};

export const getSubscriptionState = () => state;

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

export const useSubscriptionState = () => useSyncExternalStore(subscribe, getSubscriptionState, getSubscriptionState);

export const isInactiveSubscriptionResponse = (status?: number, data?: unknown) => (
    status === 402
    && Boolean(data)
    && typeof data === "object"
    && (data as {subscriptionInactive?: unknown}).subscriptionInactive === true
);
