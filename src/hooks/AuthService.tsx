import http from "../http-common";
import {LoginRequest} from "../components/LoginPage/model/LoginRequest";
import {AuthenticationToken} from "../components/LoginPage/model/AuthenticationToken";
import {ChangeLanguageRequest, ChangePasswordRequest, CurrentUserDto} from "../auth/UserProfileDto";
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

const changeLanguage = (request: ChangeLanguageRequest) => {
    return http.put<CurrentUserDto>(`/auth/me/language`, request);
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
    changeLanguage,
    signup,
    logout
};

export default AuthService;
