import http from "../http-common";
import {LoginRequest} from "../components/LoginPage/model/LoginRequest";
import {AuthenticationToken} from "../components/LoginPage/model/AuthenticationToken";

const login = (loginRequest: LoginRequest) => {
    return http.post<AuthenticationToken>(`/auth/login`, loginRequest);
}

const signup = () => {
    return http.post<any>(`/auth/signup`);
}

const AuthService = {
    login,
    signup
};

export default AuthService;