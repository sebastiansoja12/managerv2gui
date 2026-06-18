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
            url: "/shipments/returns/123",
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

        const returns = await ReturnService.getAllByDepartment("KT1");

        expect(returns.map((item) => item.returnPackageId.value)).toEqual(["123", "124"]);
        expect(mockManagerRequest).toHaveBeenNthCalledWith(1, {
            method: "GET",
            url: "/shipments/returns",
            params: {departmentCode: "KT1", page: 0, size: 100},
            headers: undefined,
        });
        expect(mockManagerRequest).toHaveBeenNthCalledWith(2, {
            method: "GET",
            url: "/shipments/returns",
            params: {departmentCode: "KT1", page: 1, size: 100},
            headers: undefined,
        });
        expect(mockReturningRequest).not.toHaveBeenCalled();
    });
});
