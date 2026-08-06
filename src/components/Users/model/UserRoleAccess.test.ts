import {assignableRoles, canManageUser, isAdministrator} from "./UserRoleAccess";
import {User} from "./User";

const user = (role: User["role"], departmentCode: string, userId = 2): User => ({
    userId: {value: userId},
    username: "user",
    firstName: "First",
    lastName: "Last",
    email: "user@test.pl",
    role,
    departmentCode,
    language: "pl",
    deleted: false,
    operatorId: {value: 1},
    rolePermissions: [],
});

describe("UserRoleAccess", () => {
    it("treats superadmin as administrator", () => {
        expect(isAdministrator("SUPERADMIN")).toBe(true);
        expect(isAdministrator("MANAGER")).toBe(false);
    });

    it("lets superadmin assign every role and admin only lower roles", () => {
        expect(assignableRoles("SUPERADMIN")).toEqual(["USER", "SUPPLIER", "MANAGER", "ADMIN", "SUPERADMIN"]);
        expect(assignableRoles("ADMIN")).toEqual(["USER", "SUPPLIER", "MANAGER"]);
        expect(assignableRoles("USER")).toEqual([]);
    });

    it("limits admin to own department and lets superadmin manage every department", () => {
        const admin = {role: "ADMIN", departmentCode: "KT1", userId: {value: 1}};
        const superadmin = {role: "SUPERADMIN", departmentCode: "KT1", userId: {value: 1}};

        expect(canManageUser(admin, user("MANAGER", "KT1"))).toBe(true);
        expect(canManageUser(admin, user("MANAGER", "WA1"))).toBe(false);
        expect(canManageUser(superadmin, user("ADMIN", "WA1"))).toBe(true);
    });
});
