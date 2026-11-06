const normalizedRole = (role?: string | null) => (role || "").toUpperCase();

export const canEditOperatorConfiguration = (role?: string | null) => normalizedRole(role) === "SUPERADMIN";

export const canEditDepartmentConfiguration = (role?: string | null) => (
    ["ADMIN", "SUPERADMIN"].includes(normalizedRole(role))
);

export const canManageCourierConfiguration = canEditDepartmentConfiguration;

export const canActOnBehalfOfAnyDepartment = canEditOperatorConfiguration;

const roleRestrictedPaths: Record<string, (role?: string | null) => boolean> = {
    "/global-configuration": canEditDepartmentConfiguration,
};

export const isPathAllowedForRole = (path: string, role?: string | null) => (
    roleRestrictedPaths[path]?.(role) ?? true
);
