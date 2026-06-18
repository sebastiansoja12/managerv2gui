import http from "../http-common";
import {LoginRequest} from "../components/LoginPage/model/LoginRequest";
import {AuthenticationToken} from "../components/LoginPage/model/AuthenticationToken";
import {ChangePasswordRequest, CurrentUserDto} from "../auth/UserProfileDto";
import {RefreshTokenRequestDto} from "../auth/RefreshTokenRequestDto";
import BackendClient from "../api/BackendClient";

const authClient = new BackendClient(http);

const login = (loginRequest: LoginRequest) => {
    return http.post<AuthenticationToken>(`/auth/login`, loginRequest);
}

const me = () => {
    return http.get<CurrentUserDto>(`/auth/me`);
};

const changePassword = (request: ChangePasswordRequest) => {
    return http.put<void>(`/auth/me/password`, request);
};

const signup = () => {
    return http.post<any>(`/auth/signup`);
}

const logout = (request: RefreshTokenRequestDto) => {
    return authClient.delete<RefreshTokenRequestDto, undefined>(`/auth/logout`, request);
}

const AuthService = {
    login,
    me,
    changePassword,
    signup,
    logout
};

export default AuthService;
