import {getConfiguredDraftShipmentStatus, getConfiguredShipmentStatuses} from "./ShipmentDetails";

describe("getConfiguredDraftShipmentStatus", () => {
    it.each([
        ["CREATED", "CREATED"],
        ["PREPARED", "PREPARED"],
        ["ACCEPTED", "ACCEPTED"],
    ] as const)("uses %s from the operator shipment configuration", (configuredStatus, expectedStatus) => {
        expect(getConfiguredDraftShipmentStatus(configuredStatus)).toBe(expectedStatus);
    });

    it("falls back to created when the configuration does not provide a draft status", () => {
        expect(getConfiguredDraftShipmentStatus(null)).toBe("CREATED");
        expect(getConfiguredDraftShipmentStatus(undefined)).toBe("CREATED");
    });

    it("keeps one configured draft status and all regular shipment statuses", () => {
        expect(getConfiguredShipmentStatuses("PREPARED")).toEqual([
            "PREPARED",
            "REROUTE",
            "SENT",
            "DELIVERY",
            "RETURN",
            "REDIRECT",
        ]);
    });
});
