import {buildActivationQrPayload, resolveActivationServerUrl} from "./deviceActivationQr";

describe("deviceActivationQr", () => {
    it("resolves a relative API path against the panel origin", () => {
        expect(resolveActivationServerUrl("/v1/api", "https://manager.example.com")).toBe("https://manager.example.com/v1/api");
    });

    it("keeps an absolute API address without the trailing slash", () => {
        expect(resolveActivationServerUrl("http://192.168.1.11:8080/v1/api/", "http://localhost:3000")).toBe("http://192.168.1.11:8080/v1/api");
    });

    it("builds the payload scanned by the terminal application", () => {
        expect(buildActivationQrPayload("ABCD-EFGH", "https://manager.example.com/v1/api")).toEqual({
            type: "MANAGER_DEVICE_ACTIVATION",
            serverUrl: "https://manager.example.com/v1/api",
            activationCode: "ABCD-EFGH",
        });
    });
});
