import http from "../http-super-admin";
import {
    ChangePlatformOwnerPasswordRequest,
    CreatePlatformOwnerRequest,
    PlatformOwnerAccount,
} from "../components/SuperAdmin/accounts/model/PlatformOwnerAccount";

const getAll = () => http.get<PlatformOwnerAccount[]>("/platform/owners").then((response) => response.data);

const create = (request: CreatePlatformOwnerRequest) => http.post<{value: number}>("/platform/owners", request);

const block = (platformOwnerId: number) => http.put<void>(`/platform/owners/${platformOwnerId}/block`);

const unblock = (platformOwnerId: number) => http.put<void>(`/platform/owners/${platformOwnerId}/unblock`);

const changePassword = (platformOwnerId: number, request: ChangePlatformOwnerPasswordRequest) => (
    http.put<void>(`/platform/owners/${platformOwnerId}/password`, request)
);

const PlatformOwnerAccountService = {
    getAll,
    create,
    block,
    unblock,
    changePassword,
};

export default PlatformOwnerAccountService;
