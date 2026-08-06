import {User, UserRole} from "./User";

const roleLevels: Record<UserRole, number> = {
    USER: 0,
    SUPPLIER: 0,
    MANAGER: 1,
    ADMIN: 2,
    SUPERADMIN: 3,
};

export const userRoles: UserRole[] = ["USER", "SUPPLIER", "MANAGER", "ADMIN", "SUPERADMIN"];

const roleLevel = (role?: string) => roleLevels[role as UserRole] ?? -1;

export const isSuperadministrator = (role?: string) => role === "SUPERADMIN";

export const isAdministrator = (role?: string) => roleLevel(role) >= roleLevels.ADMIN;

export const canManageUsers = (role?: string) => roleLevel(role) >= roleLevels.MANAGER;

export const canAssignRole = (currentRole: string | undefined, role: UserRole) => (
    isSuperadministrator(currentRole)
        ? roleLevel(currentRole) >= roleLevel(role)
        : roleLevel(currentRole) > roleLevel(role)
);

export const assignableRoles = (currentRole?: string) => userRoles.filter((role) => canAssignRole(currentRole, role));

export const canAccessDepartment = (currentRole: string | undefined,
                                    currentDepartmentCode: string | undefined,
                                    departmentCode: string | undefined) => (
    isSuperadministrator(currentRole) || currentDepartmentCode === departmentCode
);

export const canManageUser = (currentUser: {role?: string; departmentCode?: string; userId?: {value: string | number}} | null | undefined,
                              user: User | undefined) => {
    if (!currentUser || !user) {
        return false;
    }

    if (currentUser.userId && String(currentUser.userId.value) === String(user.userId?.value)) {
        return true;
    }

    return canAccessDepartment(currentUser.role, currentUser.departmentCode, user.departmentCode)
        && canAssignRole(currentUser.role, user.role);
};
