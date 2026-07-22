const mockManagerRequest = jest.fn();
const mockReturningRequest = jest.fn();

jest.mock("../http-common", () => ({
    __esModule: true,
    default: {
        request: (...args: unknown[]) => mockManagerRequest(...args),
    },
}));

jest.mock("../http-returning", () => ({
    __esModule: true,
    default: {
        request: (...args: unknown[]) => mockReturningRequest(...args),
    },
}));

import ReturnService from "./ReturnService";

describe("ReturnService", () => {
    beforeEach(() => {
        mockManagerRequest.mockReset();
        mockReturningRequest.mockReset();
    });

    it("loads a return through Manager", async () => {
        mockManagerRequest.mockResolvedValue({data: {returnPackageId: {value: "123"}}, status: 200});

        await ReturnService.get("123");

        expect(mockManagerRequest).toHaveBeenCalledWith({
            method: "GET",
            url: "/returns/packages/123",
            params: undefined,
            headers: undefined,
        });
        expect(mockReturningRequest).not.toHaveBeenCalled();
    });

    it("loads every returns page for a department through Manager", async () => {
        mockManagerRequest
            .mockResolvedValueOnce({
                data: {content: [{returnPackageId: {value: "123"}}], page: 0, size: 100, totalElements: 2, totalPages: 2},
                status: 200,
            })
            .mockResolvedValueOnce({
                data: {content: [{returnPackageId: {value: "124"}}], page: 1, size: 100, totalElements: 2, totalPages: 2},
                status: 200,
            });

        const returns = await ReturnService.getAllByDepartment("2");

        expect(returns.map((item) => item.returnPackageId.value)).toEqual(["123", "124"]);
        expect(mockManagerRequest).toHaveBeenNthCalledWith(1, {
            method: "GET",
            url: "/returns/packages",
            params: {departmentId: "2", page: 0, size: 100},
            headers: undefined,
        });
        expect(mockManagerRequest).toHaveBeenNthCalledWith(2, {
            method: "GET",
            url: "/returns/packages",
            params: {departmentId: "2", page: 1, size: 100},
            headers: undefined,
        });
        expect(mockReturningRequest).not.toHaveBeenCalled();
    });

    it("creates a return through the return controller without a client-supplied user", async () => {
        mockManagerRequest.mockResolvedValue({data: [], status: 201});

        await ReturnService.create({
            shipmentId: {value: "456"}, departmentId: {value: "2"},
            reason: "Damaged parcel", reasonCode: {value: "DAMAGED"}, returnStatus: "CREATED",
        });

        expect(mockManagerRequest).toHaveBeenCalledWith({
            method: "POST", url: "/returns/packages",
            data: {shipmentId: {value: "456"}, departmentId: {value: "2"},
                reason: "Damaged parcel", reasonCode: "DAMAGED"},
            params: undefined, headers: undefined,
        });
    });

    it("cancels a return through Manager", async () => {
        mockManagerRequest.mockResolvedValue({data: {status: "OK"}, status: 200});

        await ReturnService.cancel("123");

        expect(mockManagerRequest).toHaveBeenCalledWith({
            method: "DELETE",
            url: "/returns/packages/123",
            data: undefined,
            params: undefined,
            headers: undefined,
        });
        expect(mockReturningRequest).not.toHaveBeenCalled();
    });

    it("starts return processing through Manager", async () => {
        mockManagerRequest.mockResolvedValue({data: {status: "OK"}, status: 200});

        await ReturnService.process("123");

        expect(mockManagerRequest).toHaveBeenCalledWith({
            method: "PUT",
            url: "/returns/packages/123/process",
            data: undefined,
            params: undefined,
            headers: undefined,
        });
        expect(mockReturningRequest).not.toHaveBeenCalled();
    });

    it("completes a return through Manager", async () => {
        mockManagerRequest.mockResolvedValue({data: {status: "OK"}, status: 200});

        await ReturnService.complete("123");

        expect(mockManagerRequest).toHaveBeenCalledWith({
            method: "PUT",
            url: "/returns/packages/123/complete",
            data: undefined,
            params: undefined,
            headers: undefined,
        });
        expect(mockReturningRequest).not.toHaveBeenCalled();
    });
});
