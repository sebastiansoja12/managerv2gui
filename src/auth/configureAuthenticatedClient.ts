import axios, {AxiosError, AxiosHeaders, AxiosInstance, AxiosRequestConfig} from "axios";
import {setUnauthenticated} from "./AuthState";

type RetryableRequestConfig = AxiosRequestConfig & {
    _authRetry?: boolean;
    _csrfRetry?: boolean;
};

type CsrfResponse = {
    token?: string | null;
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
let csrfPromise: Promise<string | null> | null = null;
let csrfToken: string | null = null;

const fetchCsrfToken = () => {
    if (!csrfPromise) {
        csrfPromise = refreshClient.get<CsrfResponse>("/auth/csrf")
            .then((response) => {
                csrfToken = response.data?.token || null;
                return csrfToken;
            })
            .finally(() => {
                csrfPromise = null;
            });
    }

    return csrfPromise;
};

const ensureCsrfToken = () => csrfToken ? Promise.resolve(csrfToken) : fetchCsrfToken();

const rememberCsrfToken = (data: unknown) => {
    const token = (data as CsrfResponse | undefined)?.token;
    if (token) {
        csrfToken = token;
    }
};

const setXsrfHeader = (config: AxiosRequestConfig, token: string | null) => {
    if (!token) {
        return;
    }

    if (!config.headers) {
        config.headers = new AxiosHeaders();
    }

    if (config.headers instanceof AxiosHeaders) {
        config.headers.set(XSRF_HEADER_NAME, token);
        return;
    }

    config.headers = {
        ...config.headers,
        [XSRF_HEADER_NAME]: token,
    };
};

const xsrfHeaders = (token: string | null) => token ? {[XSRF_HEADER_NAME]: token} : undefined;

const isAuthLifecycleRequest = (url?: string) => {
    if (!url) {
        return false;
    }

    const path = new URL(url, serverUrl || window.location.origin).pathname;
    return AUTH_LIFECYCLE_PATHS.some((authPath) => path.endsWith(authPath));
};

const isUnsafeRequest = (request?: AxiosRequestConfig) => {
    const method = request?.method?.toUpperCase();
    return !!method && UNSAFE_METHODS.has(method);
};

const refreshAccessToken = () => {
    if (!refreshPromise) {
        refreshPromise = ensureCsrfToken()
            .then((token) => refreshClient.post<void>("/auth/refresh", undefined, {
                headers: xsrfHeaders(token),
            }))
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
        if (isUnsafeRequest(config)) {
            const token = await ensureCsrfToken();
            setXsrfHeader(config, token);
        }

        return config;
    });

    http.interceptors.response.use(
        (response) => {
            if (isAuthLifecycleRequest(response.config.url)) {
                rememberCsrfToken(response.data);
            }

            return response;
        },
        async (error: AxiosError) => {
            const request = error.config as RetryableRequestConfig | undefined;
            if (error.response?.status === 403 && request && isUnsafeRequest(request) && !request._csrfRetry) {
                request._csrfRetry = true;
                csrfToken = null;
                const token = await ensureCsrfToken();
                setXsrfHeader(request, token);
                return http.request(request);
            }

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
