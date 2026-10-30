import {nextProgress, readTutorialProgress, storeTutorialProgress, tutorialSteps, tutorialStepsFor} from "./tutorialSteps";

const stepIndex = (id: string) => tutorialSteps.findIndex((step) => step.id === id);

describe("tutorialSteps", () => {
    beforeEach(() => window.localStorage.clear());

    it("advances the create shipment step and remembers the tracking number", () => {
        const progress = nextProgress(tutorialSteps, {stepIndex: stepIndex("createShipment")},
            {type: "shipmentCreated", trackingNumber: "TRK-1"});

        expect(progress.stepIndex).toBe(stepIndex("cancelShipment"));
        expect(progress.trackingNumber).toBe("TRK-1");
        expect(tutorialSteps[progress.stepIndex].path?.(progress)).toBe("/shipments/tracking/TRK-1/edit");
    });

    it("ignores events that do not belong to the current step", () => {
        const progress = {stepIndex: stepIndex("createShipment")};

        expect(nextProgress(tutorialSteps, progress, {type: "courierCreated"})).toBe(progress);
    });

    it("keeps the order: show, create shipment, cancel it, create courier, configuration", () => {
        expect(tutorialSteps.map((step) => step.id).slice(stepIndex("createShipment"))).toEqual([
            "createShipment", "cancelShipment", "createCourier", "configuration",
        ]);
    });

    it("restores stored progress and rejects invalid values", () => {
        storeTutorialProgress("7", {stepIndex: 3});
        expect(readTutorialProgress("7", tutorialSteps).stepIndex).toBe(3);

        storeTutorialProgress("7", {stepIndex: 99});
        expect(readTutorialProgress("7", tutorialSteps).stepIndex).toBe(0);
    });

    it("shows the configuration step only to roles that can change configuration", () => {
        const ids = (role: string) => tutorialStepsFor(role).map((step) => step.id);

        expect(ids("SUPERADMIN")).toContain("configuration");
        expect(ids("ADMIN")).toContain("configuration");
        expect(ids("USER")).not.toContain("configuration");
        expect(ids("MANAGER")).not.toContain("configuration");
    });
});
