export type OnboardingEvent =
    | {type: "shipmentCreated"; trackingNumber: string}
    | {type: "shipmentCancelled"}
    | {type: "courierCreated"}
    | {type: "tutorialRestartRequested"};

type OnboardingEventListener = (event: OnboardingEvent) => void;

const listeners = new Set<OnboardingEventListener>();

export const emitOnboardingEvent = (event: OnboardingEvent) => {
    listeners.forEach((listener) => listener(event));
};

export const subscribeOnboardingEvents = (listener: OnboardingEventListener) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};
