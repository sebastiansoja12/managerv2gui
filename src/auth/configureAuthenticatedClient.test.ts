import {resolveRequestPath} from "./configureAuthenticatedClient";

describe("resolveRequestPath", () => {
    test("supports a relative API server URL", () => {
        expect(resolveRequestPath("/auth/login", "/v2/api")).toBe("/auth/login");
        expect(resolveRequestPath("/v2/api/auth/csrf", "/v2/api")).toBe("/v2/api/auth/csrf");
    });

    test("continues to support absolute API server URLs", () => {
        expect(resolveRequestPath("/auth/refresh", "https://manager.example/v2/api"))
            .toBe("/auth/refresh");
    });
});
