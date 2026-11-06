import {
    canEditDepartmentConfiguration,
    canEditOperatorConfiguration,
    canManageCourierConfiguration,
    isPathAllowedForRole,
} from "./roleAccess";

describe("roleAccess", () => {
    it.each(["USER", "MANAGER", "SUPPLIER", undefined])("hides configuration from %s", (role) => {
        expect(isPathAllowedForRole("/global-configuration", role)).toBe(false);
        expect(canManageCourierConfiguration(role)).toBe(false);
        expect(canEditOperatorConfiguration(role)).toBe(false);
    });

    it("lets a department admin change only department scoped configuration", () => {
        expect(isPathAllowedForRole("/global-configuration", "ADMIN")).toBe(true);
        expect(canEditDepartmentConfiguration("ADMIN")).toBe(true);
        expect(canManageCourierConfiguration("ADMIN")).toBe(true);
        expect(canEditOperatorConfiguration("ADMIN")).toBe(false);
    });

    it("lets a superadmin change the whole configuration", () => {
        expect(isPathAllowedForRole("/global-configuration", "SUPERADMIN")).toBe(true);
        expect(canEditOperatorConfiguration("SUPERADMIN")).toBe(true);
    });

    it("does not restrict other paths", () => {
        expect(isPathAllowedForRole("/couriers", "USER")).toBe(true);
    });
});
