import http from "../http-super-admin";
import {AuthenticationToken} from "../components/LoginPage/model/AuthenticationToken";
import {LoginRequest} from "../components/LoginPage/model/LoginRequest";

const login = (loginRequest: LoginRequest) => {
    return http.post<AuthenticationToken>("/auth/login", loginRequest);
};

const SuperAdminAuthService = {
    login,
};

export default SuperAdminAuthService;
