import {availableOperationalProfiles, isPathAllowedForProfile, resolveOperationalProfile} from "./operationalProfile";

describe("operationalProfile", () => {
    it("limits supplier users to the courier profile", () => {
        expect(availableOperationalProfiles("SUPPLIER")).toEqual(["courier"]);
        expect(resolveOperationalProfile("SUPPLIER", "warehouse")).toBe("courier");
        expect(isPathAllowedForProfile("/couriers", resolveOperationalProfile("SUPPLIER", "warehouse"))).toBe(false);
    });

    it("keeps the selected profile for other roles", () => {
        expect(availableOperationalProfiles("ADMIN")).toEqual(["courier", "warehouse"]);
        expect(resolveOperationalProfile("ADMIN", "warehouse")).toBe("warehouse");
        expect(resolveOperationalProfile("MANAGER", "courier")).toBe("courier");
        expect(resolveOperationalProfile(undefined, "warehouse")).toBe("warehouse");
    });
});
