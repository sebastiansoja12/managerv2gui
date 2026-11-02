import axios, {AxiosError, AxiosHeaders, AxiosInstance, AxiosRequestConfig} from "axios";
import {setUnauthenticated} from "./AuthState";

type RetryableRequestConfig = AxiosRequestConfig & {
    _authRetry?: boolean;
    _csrfRetry?: boolean;
};

type CsrfResponse = {
    token?: string | null;
};

type AuthenticatedClientOptions = {
    refreshSession?: boolean;
    refreshPath?: string;
    onUnauthenticated?: () => void;
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

const refreshPromises = new Map<string, Promise<void>>();
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

export const resolveRequestPath = (url: string, apiBaseUrl?: string) => {
    const resolvedServerUrl = new URL(apiBaseUrl || "/", window.location.origin);
    return new URL(url, resolvedServerUrl).pathname;
};

const isAuthLifecycleRequest = (url?: string) => {
    if (!url) {
        return false;
    }

    const path = resolveRequestPath(url, serverUrl);
    return AUTH_LIFECYCLE_PATHS.some((authPath) => path.endsWith(authPath));
};

const isUnsafeRequest = (request?: AxiosRequestConfig) => {
    const method = request?.method?.toUpperCase();
    return !!method && UNSAFE_METHODS.has(method);
};

const lastRefreshKey = (refreshPath: string) => `auth:lastRefreshAt:${refreshPath}`;

const readLastRefreshAt = (refreshPath: string) => {
    try {
        return Number(window.localStorage.getItem(lastRefreshKey(refreshPath))) || 0;
    } catch {
        return 0;
    }
};

const writeLastRefreshAt = (refreshPath: string, time: number) => {
    try {
        window.localStorage.setItem(lastRefreshKey(refreshPath), String(time));
    } catch {
    }
};

// All tabs share one refresh cookie, so refreshes must not run in parallel across tabs.
const withCrossTabLock = <T>(name: string, task: () => Promise<T>): Promise<T> => {
    const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
    return locks ? locks.request(name, task) : task();
};

const responseStatus = (error: unknown) => (error as AxiosError | undefined)?.response?.status;

const postRefresh = async (refreshPath: string) => {
    try {
        await refreshClient.post<void>(refreshPath, undefined, {headers: xsrfHeaders(await ensureCsrfToken())});
    } catch (error) {
        if (responseStatus(error) !== 403) {
            throw error;
        }
        csrfToken = null;
        await refreshClient.post<void>(refreshPath, undefined, {headers: xsrfHeaders(await ensureCsrfToken())});
    }
};

// Only an explicit 401 from the refresh endpoint ends the session; network errors and 5xx are transient.
export const isSessionRejected = (error: unknown) => responseStatus(error) === 401;

const refreshAccessToken = (refreshPath: string) => {
    const pendingRefresh = refreshPromises.get(refreshPath);
    if (pendingRefresh) {
        return pendingRefresh;
    }

    const requestedAt = Date.now();
    const refreshPromise = withCrossTabLock(`auth-refresh:${refreshPath}`, async () => {
        if (readLastRefreshAt(refreshPath) >= requestedAt) {
            // Another tab refreshed the session while this one was waiting for the lock.
            return;
        }
        await postRefresh(refreshPath);
        writeLastRefreshAt(refreshPath, Date.now());
    })
        .finally(() => {
            refreshPromises.delete(refreshPath);
        });
    refreshPromises.set(refreshPath, refreshPromise);
    return refreshPromise;
};

export const configureAuthenticatedClient = (
    http: AxiosInstance,
    {
        refreshSession = true,
        refreshPath = "/auth/refresh",
        onUnauthenticated = setUnauthenticated,
    }: AuthenticatedClientOptions = {},
) => {
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

            if (!refreshSession) {
                onUnauthenticated();
                return Promise.reject(error);
            }

            request._authRetry = true;
            try {
                await refreshAccessToken(refreshPath);
                return http.request(request);
            } catch (refreshError) {
                if (isSessionRejected(refreshError)) {
                    onUnauthenticated();
                }
                return Promise.reject(refreshError);
            }
        },
    );

    return http;
};
