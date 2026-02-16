export interface AuthenticationToken {
    authenticationToken: string;
    loginResponse?: {
        refreshToken?: {
            token?: string;
            value?: string;
        };
    };
}
