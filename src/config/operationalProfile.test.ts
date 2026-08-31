import {availableOperationalProfiles, isPathAllowedForProfile, resolveOperationalProfile} from "./operationalProfile";

describe("operationalProfile", () => {
    it("limits supplier users to the courier profile", () => {
        expect(availableOperationalProfiles("SUPPLIER")).toEqual(["courier"]);
        expect(resolveOperationalProfile("SUPPLIER", "warehouse")).toBe("courier");
        expect(isPathAllowedForProfile("/couriers", resolveOperationalProfile("SUPPLIER", "warehouse"))).toBe(false);
        expect(isPathAllowedForProfile("/processes", resolveOperationalProfile("SUPPLIER", "warehouse"))).toBe(true);
        expect(isPathAllowedForProfile("/processes/6f0f3a5e-2d0c-4b8e-9a39-2f7d0d3c1a11", "courier")).toBe(true);
    });

    it("keeps the selected profile for other roles", () => {
        expect(availableOperationalProfiles("ADMIN")).toEqual(["courier", "warehouse"]);
        expect(resolveOperationalProfile("ADMIN", "warehouse")).toBe("warehouse");
        expect(resolveOperationalProfile("MANAGER", "courier")).toBe("courier");
        expect(resolveOperationalProfile(undefined, "warehouse")).toBe("warehouse");
    });
});
