export type RolePermissionApi = {
    role: string;
};

export type UserIdDto = {
    value: number;
};

export type OperatorIdDto = {
    value: number;
};

export type CurrentUserDto = {
    userId: UserIdDto;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    departmentCode: string;
    language: string;
    hasApiKey: boolean;
    apiKey?: string | null;
    rolePermissions: RolePermissionApi[];
    deleted: boolean;
    operatorId?: OperatorIdDto | null;
    createdAt: string;
    updatedAt: string;
};

export type ChangePasswordRequest = {
    currentPassword: string;
    newPassword: string;
};

export type ChangeLanguageRequest = {
    language: string;
};

export type ChangeFullNameRequest = {
    firstName: string;
    lastName: string;
};

export type GeneratedApiKeyResponse = {
    apiKey: string;
};
