import http from "../http-common";
import {LoginRequest} from "../components/LoginPage/model/LoginRequest";
import {
    ChangeFullNameRequest,
    ChangeLanguageRequest,
    ChangePasswordRequest,
    CurrentUserDto,
    GeneratedApiKeyResponse,
} from "../auth/UserProfileDto";

const login = (loginRequest: LoginRequest) => {
    return http.post<void>(`/auth/login`, loginRequest);
}

const csrf = () => http.get<{token: string}>(`/auth/csrf`);

const me = () => {
    return http.get<CurrentUserDto>(`/auth/me`);
};

const changePassword = (request: ChangePasswordRequest) => {
    return http.put<void>(`/auth/me/password`, request);
};

const changeFullName = (request: ChangeFullNameRequest) => {
    return http.put<void>(`/auth/me/fullnames`, request);
};

const changeLanguage = (request: ChangeLanguageRequest) => {
    return http.put<CurrentUserDto>(`/auth/me/language`, request);
};

const generateApiKey = () => {
    return http.post<GeneratedApiKeyResponse>(`/auth/me/api-key`);
};

const deleteApiKey = () => {
    return http.delete<void>(`/auth/me/api-key`);
};

const signup = () => {
    return http.post<any>(`/auth/signup`);
}

const logout = () => http.post<void>(`/auth/logout`);

const AuthService = {
    login,
    csrf,
    me,
    changePassword,
    changeFullName,
    changeLanguage,
    generateApiKey,
    deleteApiKey,
    signup,
    logout
};

export default AuthService;
