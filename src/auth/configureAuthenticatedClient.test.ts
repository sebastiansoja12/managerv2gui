import {resolveRequestPath} from "./configureAuthenticatedClient";

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
