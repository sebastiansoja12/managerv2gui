import {isSessionRejected, resolveRequestPath} from "./configureAuthenticatedClient";

const axiosError = (status?: number) => ({
    isAxiosError: true,
    response: status === undefined ? undefined : {status},
});

describe("isSessionRejected", () => {
    test("ends the session only on 401 from refresh", () => {
        expect(isSessionRejected(axiosError(401))).toBe(true);
    });

    test("keeps the session on network errors and server failures", () => {
        expect(isSessionRejected(axiosError())).toBe(false);
        expect(isSessionRejected(axiosError(503))).toBe(false);
        expect(isSessionRejected(new Error("boom"))).toBe(false);
    });
});

describe("resolveRequestPath", () => {
    test("supports a relative API server URL", () => {
        expect(resolveRequestPath("/auth/login", "/v1/api")).toBe("/auth/login");
        expect(resolveRequestPath("/v1/api/auth/csrf", "/v1/api")).toBe("/v1/api/auth/csrf");
    });

    test("continues to support absolute API server URLs", () => {
        expect(resolveRequestPath("/auth/refresh", "https://manager.example/v1/api"))
            .toBe("/auth/refresh");
    });
});
