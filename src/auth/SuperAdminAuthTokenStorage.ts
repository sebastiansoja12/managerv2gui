const SUPER_ADMIN_AUTH_TOKEN_KEY = "superAdminAuthToken";

export const getSuperAdminAuthToken = () => localStorage.getItem(SUPER_ADMIN_AUTH_TOKEN_KEY);

export const setSuperAdminAuthToken = (token: string) => {
    localStorage.setItem(SUPER_ADMIN_AUTH_TOKEN_KEY, token);
};

export const clearSuperAdminAuthToken = () => {
    localStorage.removeItem(SUPER_ADMIN_AUTH_TOKEN_KEY);
};

export const isSuperAdminAuthenticated = () => Boolean(getSuperAdminAuthToken());
