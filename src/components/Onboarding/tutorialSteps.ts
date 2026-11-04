import {isPathAllowedForRole} from "../../config/roleAccess";
import {OnboardingEvent} from "./onboardingEvents";

export type TutorialStepId =
    | "welcome"
    | "mainMenu"
    | "quickNav"
    | "tabs"
    | "createMenu"
    | "userMenu"
    | "createShipment"
    | "cancelShipment"
    | "createCourier"
    | "configuration";

export type TutorialProgress = {
    stepIndex: number;
    trackingNumber?: string;
};

export type TutorialStep = {
    id: TutorialStepId;
    target?: string;
    path?: (progress: TutorialProgress) => string | undefined;
    completedBy?: OnboardingEvent["type"];
};

export const tutorialSteps: TutorialStep[] = [
    {id: "welcome"},
    {id: "mainMenu", target: "main-menu"},
    {id: "quickNav", target: "quick-nav"},
    {id: "tabs", target: "app-tabs"},
    {id: "createMenu", target: "create-menu"},
    {id: "userMenu", target: "user-menu"},
    {id: "createShipment", path: () => "/shipments/create", completedBy: "shipmentCreated"},
    {
        id: "cancelShipment",
        target: "shipment-operations",
        path: (progress) => progress.trackingNumber
            ? `/shipments/tracking/${encodeURIComponent(progress.trackingNumber)}/edit`
            : "/shipments/list",
        completedBy: "shipmentCancelled",
    },
    {id: "createCourier", target: "courier-create", path: () => "/couriers", completedBy: "courierCreated"},
    {id: "configuration", target: "global-configuration", path: () => "/global-configuration"},
];

export const tutorialStepsFor = (role?: string | null): TutorialStep[] => tutorialSteps.filter((step) => {
    const path = step.path?.({stepIndex: 0});
    return !path || isPathAllowedForRole(path, role);
});

export const nextProgress = (steps: TutorialStep[],
                             progress: TutorialProgress,
                             event: OnboardingEvent): TutorialProgress => {
    const step = steps[progress.stepIndex];
    if (!step || step.completedBy !== event.type) {
        return progress;
    }

    return {
        ...progress,
        stepIndex: progress.stepIndex + 1,
        trackingNumber: event.type === "shipmentCreated" ? event.trackingNumber : progress.trackingNumber,
    };
};

const storageKey = (userKey: string) => `manager.onboarding.tutorial.${userKey}`;

export const readTutorialProgress = (userKey: string, steps: TutorialStep[]): TutorialProgress => {
    try {
        const storedProgress = window.localStorage.getItem(storageKey(userKey));
        const parsedProgress = storedProgress ? JSON.parse(storedProgress) as TutorialProgress : null;
        if (parsedProgress && Number.isInteger(parsedProgress.stepIndex)
            && parsedProgress.stepIndex >= 0 && parsedProgress.stepIndex < steps.length) {
            return parsedProgress;
        }
    } catch {
        return {stepIndex: 0};
    }
    return {stepIndex: 0};
};

export const storeTutorialProgress = (userKey: string, progress: TutorialProgress) => {
    try {
        window.localStorage.setItem(storageKey(userKey), JSON.stringify(progress));
    } catch {
        return;
    }
};

export const clearTutorialProgress = (userKey: string) => {
    try {
        window.localStorage.removeItem(storageKey(userKey));
    } catch {
        return;
    }
};
