const mockManagerRequest = jest.fn();

jest.mock("../http-common", () => ({
    __esModule: true,
    default: {
        request: (...args: unknown[]) => mockManagerRequest(...args),
    },
}));

import PalletService, {palletErrorCode, palletErrorDetail} from "./PalletService";

describe("PalletService", () => {
    beforeEach(() => {
        mockManagerRequest.mockReset();
        mockManagerRequest.mockResolvedValue({data: {}, status: 200});
    });

    it("scans a pallet through Manager", async () => {
        await PalletService.scan("PAL000000000001");

        expect(mockManagerRequest).toHaveBeenCalledWith({
            method: "POST",
            url: "/pallets/scan",
            data: {trackingNumber: "PAL000000000001"},
        });
    });

    it("creates a pallet from shipment identifiers kept as strings", async () => {
        await PalletService.createFromShipments(["9007199254740993"]);

        expect(mockManagerRequest).toHaveBeenCalledWith({
            method: "POST",
            url: "/pallets/shipments",
            data: {shipmentIds: ["9007199254740993"]},
        });
    });

    it("searches cancelled and empty pallets", async () => {
        await PalletService.search({variant: "cancelled", page: 1, size: 20});
        await PalletService.search({variant: "empty", page: 0, size: 20});

        expect(mockManagerRequest).toHaveBeenNthCalledWith(1, {
            method: "GET",
            url: "/pallets",
            params: {status: "CANCELLED", empty: undefined, page: 1, size: 20},
            headers: undefined,
        });
        expect(mockManagerRequest).toHaveBeenNthCalledWith(2, {
            method: "GET",
            url: "/pallets",
            params: {status: undefined, empty: true, page: 0, size: 20},
            headers: undefined,
        });
    });

    it("cancels a pallet", async () => {
        await PalletService.cancel("pallet/1");

        expect(mockManagerRequest).toHaveBeenCalledWith({
            method: "PUT",
            url: "/pallets/pallet%2F1/cancel",
            data: undefined,
            params: undefined,
        });
    });

    it("reads the problem details code of a failed request", () => {
        const error = {status: 503, message: "x", details: {detail: "Pallet service is temporarily unavailable", properties: {code: "PALLET_SERVICE_UNAVAILABLE"}}};

        expect(palletErrorCode(error)).toBe("PALLET_SERVICE_UNAVAILABLE");
        expect(palletErrorDetail(error)).toBe("Pallet service is temporarily unavailable");
        expect(palletErrorCode(new Error("network"))).toBeNull();
    });
});
