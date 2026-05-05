import http from "../http-common";
import {
    CreateUserRequest,
    UpdateUserRequest,
    User,
    UserPermission,
    UserRole,
} from "../components/Users/model/User";

const getAll = () => http.get<User[]>("/users");

const create = (request: CreateUserRequest) => http.post<{value: string | number}>("/users", request);

const update = (userId: string | number, request: UpdateUserRequest) => (
    http.put<User>(`/users/${userId}`, request)
);

const changeRole = (userId: string | number, role: UserRole) => (
    http.put<void>(`/users/roles/${userId}`, undefined, {params: {role}})
);

const addPermission = (userId: string | number, permission: UserPermission) => (
    http.put<void>(`/users/permissions/${userId}`, undefined, {params: {permission}})
);

const removePermission = (userId: string | number, permission: UserPermission) => (
    http.delete<void>(`/users/permissions/${userId}`, {params: {permission}})
);

const UserManagementService = {
    getAll,
    create,
    update,
    changeRole,
    addPermission,
    removePermission,
};

export default UserManagementService;
