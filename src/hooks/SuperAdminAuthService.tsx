import http from "../http-super-admin";
import {LoginRequest} from "../components/LoginPage/model/LoginRequest";

const login = (loginRequest: LoginRequest) => {
    return http.post<void>("/auth/login", loginRequest);
};

const SuperAdminAuthService = {
    login,
};

export default SuperAdminAuthService;
