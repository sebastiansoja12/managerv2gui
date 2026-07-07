import PickupPointService from "./PickupPointService";
import http from "../http-common";

jest.mock("../http-common", () => ({
    __esModule: true,
    default: {
        request: jest.fn(),
    },
}));

beforeEach(() => {
    jest.clearAllMocks();
});

test("searches pickup points with server-side filters and pagination", async () => {
    (http.request as jest.Mock).mockResolvedValue({
        data: {items: [], page: 2, size: 25, totalElements: 0, totalPages: 0, evaluatedAt: "2026-09-09T08:00:00Z"},
        status: 200,
    });

    await PickupPointService.search({
        query: "WAW",
        status: "ACTIVE",
        departmentId: "9007199254740993",
        page: 2,
        size: 25,
    });

    expect(http.request).toHaveBeenCalledWith(expect.objectContaining({
        method: "GET",
        url: "/pickup-points",
        params: {
            query: "WAW",
            status: "ACTIVE",
            departmentId: "9007199254740993",
            page: 2,
            size: 25,
        },
    }));
});

test("passes complete shipment eligibility context to pickup point search", async () => {
    (http.request as jest.Mock).mockResolvedValue({
        data: {items: [], page: 0, size: 25, totalElements: 0, totalPages: 0, evaluatedAt: "2026-09-09T08:00:00Z"},
        status: 200,
    });

    await PickupPointService.findEligible({
        capability: "COLLECTION",
        type: "PARCEL_LOCKER",
        countryCode: "PL",
        shipmentSize: "SMALL",
        hasDangerousGoods: false,
    });

    expect(http.request).toHaveBeenCalledWith(expect.objectContaining({
        method: "GET",
        url: "/pickup-points/eligible",
        params: {
            capability: "COLLECTION",
            type: "PARCEL_LOCKER",
            countryCode: "PL",
            shipmentSize: "SMALL",
            hasDangerousGoods: false,
        },
    }));
});

test("encodes pickup point identifier in status request path", async () => {
    (http.request as jest.Mock).mockResolvedValue({data: {}, status: 200});

    await PickupPointService.changeStatus("point/id", {
        status: "SUSPENDED",
        reason: "Maintenance",
    });

    expect(http.request).toHaveBeenCalledWith(expect.objectContaining({
        method: "PUT",
        url: "/pickup-points/point%2Fid/status",
        data: {
            status: "SUSPENDED",
            reason: "Maintenance",
        },
    }));
});
