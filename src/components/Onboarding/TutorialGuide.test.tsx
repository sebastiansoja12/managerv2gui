import React from "react";
import {act, fireEvent, render, screen} from "@testing-library/react";
import pl from "../../i18n/translate";
import {emitOnboardingEvent} from "./onboardingEvents";
import TutorialGuide from "./TutorialGuide";
import {storeTutorialProgress, tutorialSteps} from "./tutorialSteps";

let mockRole = "SUPERADMIN";

jest.mock("../../auth/AuthState", () => ({
    useAuthState: () => ({status: "authenticated", user: {role: mockRole, userId: {value: 1}}}),
}));

const stepIndex = (id: string) => tutorialSteps.findIndex((step) => step.id === id);

describe("TutorialGuide", () => {
    beforeEach(() => {
        window.localStorage.clear();
        mockRole = "SUPERADMIN";
    });

    it("moves from the welcome step to the main menu", () => {
        render(<TutorialGuide onComplete={jest.fn()} onOpenTab={jest.fn()} onSkip={jest.fn()} userKey="1"/>);

        fireEvent.click(screen.getByRole("button", {name: pl.onboarding.tutorial.start}));

        expect(screen.getByText(pl.onboarding.tutorial.steps.mainMenu.title)).toBeInTheDocument();
    });

    it("advances to cancelling after the user creates a shipment", () => {
        storeTutorialProgress("1", {stepIndex: stepIndex("createShipment")});
        render(<TutorialGuide onComplete={jest.fn()} onOpenTab={jest.fn()} onSkip={jest.fn()} userKey="1"/>);

        act(() => emitOnboardingEvent({type: "shipmentCreated", trackingNumber: "TRK-9"}));

        expect(screen.getByText(pl.onboarding.tutorial.completedSteps.createShipment)).toBeInTheDocument();
        expect(screen.getByText(pl.onboarding.tutorial.steps.cancelShipment.title)).toBeInTheDocument();
    });

    it("opens the configuration and completes on the last step", () => {
        const onOpenTab = jest.fn();
        const onComplete = jest.fn();
        storeTutorialProgress("1", {stepIndex: stepIndex("createCourier")});
        render(<TutorialGuide onComplete={onComplete} onOpenTab={onOpenTab} onSkip={jest.fn()} userKey="1"/>);

        fireEvent.click(screen.getByRole("button", {name: pl.onboarding.tutorial.skipStep}));
        expect(onOpenTab).toHaveBeenCalledWith(expect.objectContaining({path: "/global-configuration"}));
        fireEvent.click(screen.getByRole("button", {name: pl.onboarding.tutorial.finish}));

        expect(onComplete).toHaveBeenCalled();
    });

    it("finishes after the courier step for a user without configuration access", () => {
        mockRole = "USER";
        const onComplete = jest.fn();
        storeTutorialProgress("1", {stepIndex: stepIndex("createCourier")});
        render(<TutorialGuide onComplete={onComplete} onOpenTab={jest.fn()} onSkip={jest.fn()} userKey="1"/>);

        act(() => emitOnboardingEvent({type: "courierCreated"}));

        expect(onComplete).toHaveBeenCalled();
    });
});
