const mockManagerRequest = jest.fn();

jest.mock("../http-common", () => ({
    __esModule: true,
    default: {
        request: (...args: unknown[]) => mockManagerRequest(...args),
    },
}));

import AnalyticsService from "./AnalyticsService";

describe("AnalyticsService", () => {
    beforeEach(() => {
        mockManagerRequest.mockReset();
        mockManagerRequest.mockResolvedValue({data: {}, status: 200});
    });

    it("omits empty department and currency filters", async () => {
        await AnalyticsService.performance({dateFrom: "2026-11-01", dateTo: "2026-11-17", departmentCode: "", currency: ""});

        expect(mockManagerRequest).toHaveBeenCalledWith({
            method: "GET",
            url: "/analytics/performance",
            params: {dateFrom: "2026-11-01", dateTo: "2026-11-17", departmentCode: undefined, currency: undefined},
            headers: undefined,
        });
    });

    it("requests the forecast for a department", async () => {
        await AnalyticsService.forecast("2026-11-18", "KAT");

        expect(mockManagerRequest).toHaveBeenCalledWith(expect.objectContaining({
            method: "GET",
            url: "/analytics/forecast",
            params: {date: "2026-11-18", departmentCode: "KAT"},
        }));
    });

    it("deletes a cost by its identifier", async () => {
        await AnalyticsService.deleteCost("5748961476996084888");

        expect(mockManagerRequest).toHaveBeenCalledWith(expect.objectContaining({
            method: "DELETE",
            url: "/analytics/costs/5748961476996084888",
        }));
    });
});
