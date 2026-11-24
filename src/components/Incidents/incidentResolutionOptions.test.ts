import {availableResolutionOptions} from "./incidentResolutionOptions";

describe("availableResolutionOptions", () => {
    it("recommends the incident category group and the generic explanation", () => {
        const recommended = availableResolutionOptions("DAMAGED", "SENT")
            .filter((option) => option.recommended)
            .map((option) => option.resolution);

        expect(recommended).toEqual([
            "EXPLAINED", "REPACKED", "COSMETIC_DAMAGE_ACCEPTED", "DESTROYED_DISPOSED", "REFUSED_BY_RECIPIENT",
            "DAMAGE_CLAIM_FILED",
        ]);
    });

    it("offers only record-only resolutions for a lost shipment", () => {
        const options = availableResolutionOptions("MISSING", "LOST");

        expect(options.some((option) => option.shipmentAction || option.opensShipment)).toBe(false);
        expect(options.map((option) => option.resolution)).toContain("FOUND");
    });

    it("hides returns for shipments that were not collected yet", () => {
        const resolutions = availableResolutionOptions("INVALID_ADDRESS", "CREATED").map((option) => option.resolution);

        expect(resolutions).not.toContain("RETURN_CREATED");
        expect(resolutions).toContain("ADDRESS_CORRECTED");
    });
});
