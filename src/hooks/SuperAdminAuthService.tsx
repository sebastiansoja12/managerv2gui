import http from "../http-super-admin";
import {LoginRequest} from "../components/LoginPage/model/LoginRequest";
import {PlatformOwnerProfile} from "../components/SuperAdmin/auth/model/PlatformOwnerProfile";

const login = (loginRequest: LoginRequest) => {
    return http.post<void>("/platform/auth/login", loginRequest);
};

const me = () => {
    return http.get<PlatformOwnerProfile>("/platform/auth/me");
};

const logout = () => {
    return http.post<void>("/platform/auth/logout");
};

const startImpersonation = (operatorId: string | number) => {
    return http.post<{userId: number; username: string; operatorId: number}>("/platform/auth/impersonations", {operatorId});
};

const SuperAdminAuthService = {
    login,
    me,
    logout,
    startImpersonation,
};

export default SuperAdminAuthService;
