import Department from "../../class/depots/Department";
import {isEligibleForAutomaticAreas, isInsidePoland} from "./polandBoundary";

const department = (overrides: Partial<Department>): Department => ({
    departmentId: 1,
    departmentCode: {value: "KT1"},
    address: {city: "Katowice", street: "", postalCode: "", countryCode: "PL"},
    coordinates: {latitude: 50.26, longitude: 19.02},
    status: "ACTIVE",
    taxId: "", telephoneNumber: "", openingHours: "", email: "", departmentType: "",
    createdAt: "", updatedAt: "",
    ...overrides,
});

describe("polandBoundary", () => {
    it("detects points inside Poland", () => {
        expect(isInsidePoland({latitude: 52.23, longitude: 21.01})).toBe(true);
        expect(isInsidePoland({latitude: 52.52, longitude: 13.4})).toBe(false);
    });

    it("accepts only active Polish departments with coordinates inside Poland", () => {
        expect(isEligibleForAutomaticAreas(department({}))).toBe(true);
        expect(isEligibleForAutomaticAreas(department({status: "INACTIVE"}))).toBe(false);
        expect(isEligibleForAutomaticAreas(department({coordinates: {latitude: 52.52, longitude: 13.4}}))).toBe(false);
    });
});
