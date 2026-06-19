const mockManagerRequest = jest.fn();

jest.mock("../http-common", () => ({
    __esModule: true,
    default: {
        request: (...args: unknown[]) => mockManagerRequest(...args),
    },
}));

import ShipmentService from "./ShipmentService";

describe("ShipmentService", () => {
    beforeEach(() => {
        mockManagerRequest.mockReset();
    });

    it("searches shipments only through the read model endpoint", async () => {
        mockManagerRequest.mockResolvedValue({data: [], status: 200});

        await ShipmentService.search({
            senderName: "Anna",
            shipmentSizes: ["BIG"],
            page: 0,
            size: 100,
        });

        expect(mockManagerRequest).toHaveBeenCalledWith({
            method: "POST",
            url: "/shipments/read-model/search",
            data: {
                senderName: "Anna",
                shipmentSizes: ["BIG"],
                page: 0,
                size: 100,
            },
        });
    });
});
