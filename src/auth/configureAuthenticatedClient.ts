import axios, {AxiosError, AxiosInstance, AxiosRequestConfig} from "axios";
import {setUnauthenticated} from "./AuthState";

type RetryableRequestConfig = AxiosRequestConfig & {
    _authRetry?: boolean;
};

const AUTH_LIFECYCLE_PATHS = ["/auth/login", "/auth/refresh", "/auth/logout", "/auth/csrf"];
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const XSRF_COOKIE_NAME = "XSRF-TOKEN";
const XSRF_HEADER_NAME = "X-XSRF-TOKEN";
const serverUrl = process.env.REACT_APP_SERVER_URL;

const refreshClient = axios.create({
    baseURL: serverUrl,
    headers: {"Content-type": "application/json"},
    withCredentials: true,
    withXSRFToken: true,
    xsrfCookieName: XSRF_COOKIE_NAME,
    xsrfHeaderName: XSRF_HEADER_NAME,
});

let refreshPromise: Promise<void> | null = null;
let csrfPromise: Promise<void> | null = null;

const hasXsrfCookie = () => document.cookie
    .split("; ")
    .some((cookie) => cookie.startsWith(`${XSRF_COOKIE_NAME}=`));

const ensureCsrfCookie = () => {
    if (hasXsrfCookie()) {
        return Promise.resolve();
    }

    if (!csrfPromise) {
        csrfPromise = refreshClient.get("/auth/csrf").then(() => undefined).finally(() => {
            csrfPromise = null;
        });
    }

    return csrfPromise;
};

const isAuthLifecycleRequest = (url?: string) => {
    if (!url) {
        return false;
    }

    const path = new URL(url, serverUrl || window.location.origin).pathname;
    return AUTH_LIFECYCLE_PATHS.some((authPath) => path.endsWith(authPath));
};

const refreshAccessToken = () => {
    if (!refreshPromise) {
        refreshPromise = ensureCsrfCookie()
            .then(() => refreshClient.post<void>("/auth/refresh"))
            .then(() => undefined)
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
};

export const configureAuthenticatedClient = (http: AxiosInstance) => {
    http.defaults.withCredentials = true;
    http.defaults.withXSRFToken = true;
    http.defaults.xsrfCookieName = XSRF_COOKIE_NAME;
    http.defaults.xsrfHeaderName = XSRF_HEADER_NAME;

    http.interceptors.request.use(async (config) => {
        const method = config.method?.toUpperCase();
        if (method && UNSAFE_METHODS.has(method)) {
            await ensureCsrfCookie();
        }

        return config;
    });

    http.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const request = error.config as RetryableRequestConfig | undefined;
            if (error.response?.status !== 401
                || !request
                || request._authRetry
                || isAuthLifecycleRequest(request.url)) {
                return Promise.reject(error);
            }

            request._authRetry = true;
            try {
                await refreshAccessToken();
                return http.request(request);
            } catch (refreshError) {
                setUnauthenticated();
                return Promise.reject(refreshError);
            }
        },
    );

    return http;
};
