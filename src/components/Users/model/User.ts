export type UserRole = "USER" | "MANAGER" | "ADMIN" | "SUPPLIER";

export type UserPermission =
    | "ROLE_ADMIN_READ"
    | "ROLE_ADMIN_UPDATE"
    | "ROLE_ADMIN_CREATE"
    | "ROLE_ADMIN_DELETE"
    | "ROLE_MANAGER_READ"
    | "ROLE_MANAGER_UPDATE"
    | "ROLE_MANAGER_CREATE"
    | "ROLE_MANAGER_DELETE"
    | "ROLE_SUPPLIER_READ"
    | "ROLE_SUPPLIER_UPDATE"
    | "ROLE_SUPPLIER_CREATE"
    | "ROLE_SUPPLIER_DELETE";

export const permissionDefinitions: Array<{key: UserPermission; apiValue: string}> = [
    {key: "ROLE_ADMIN_READ", apiValue: "admin:read"},
    {key: "ROLE_ADMIN_UPDATE", apiValue: "admin:update"},
    {key: "ROLE_ADMIN_CREATE", apiValue: "admin:create"},
    {key: "ROLE_ADMIN_DELETE", apiValue: "admin:delete"},
    {key: "ROLE_MANAGER_READ", apiValue: "management:read"},
    {key: "ROLE_MANAGER_UPDATE", apiValue: "management:update"},
    {key: "ROLE_MANAGER_CREATE", apiValue: "management:create"},
    {key: "ROLE_MANAGER_DELETE", apiValue: "management:delete"},
    {key: "ROLE_SUPPLIER_READ", apiValue: "supplier:read"},
    {key: "ROLE_SUPPLIER_UPDATE", apiValue: "supplier:update"},
    {key: "ROLE_SUPPLIER_CREATE", apiValue: "supplier:create"},
    {key: "ROLE_SUPPLIER_DELETE", apiValue: "supplier:delete"},
];

export type Identifier = {
    value: string | number;
};

export type User = {
    userId: Identifier;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    departmentCode: string;
    language: string;
    deleted: boolean;
    operatorId: Identifier;
    rolePermissions: Array<{role: string}>;
    createdAt?: string;
    updatedAt?: string;
};

export type CreateUserRequest = UpdateUserRequest & {
    password: string;
    role: UserRole;
};

export type UpdateUserRequest = {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    departmentCode: string;
    language: string;
};

export const userToUpdateRequest = (user: User): UpdateUserRequest => ({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    username: user.username || "",
    email: user.email || "",
    departmentCode: user.departmentCode || "",
    language: user.language || "pl",
});
