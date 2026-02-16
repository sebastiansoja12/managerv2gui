export type RolePermissionApi = {
    role: string;
};

export type UserIdDto = {
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
    rolePermissions: RolePermissionApi[];
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
};

export type ChangePasswordRequest = {
    currentPassword: string;
    newPassword: string;
};
