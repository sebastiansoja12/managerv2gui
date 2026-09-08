import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import DepartmentService from "../../hooks/DepartmentService";
import PickupPointService from "../../hooks/PickupPointService";
import pl from "../../i18n/translate";
import PickupPointCatalog from "./PickupPointCatalog";

jest.mock("../../hooks/DepartmentService", () => ({
    __esModule: true,
    default: {
        getAll: jest.fn(),
    },
}));

jest.mock("../../hooks/PickupPointService", () => ({
    __esModule: true,
    default: {
        search: jest.fn(),
        getById: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
    },
}));

jest.mock("./PickupPointMap", () => ({
    __esModule: true,
    default: ({points, loading}: {points: Array<{code: string}>; loading: boolean}) => (
        <div
            data-loading={String(loading)}
            data-point-count={String(points.length)}
            data-testid="pickup-point-map"
        />
    ),
}));

beforeEach(() => {
    jest.clearAllMocks();
    (DepartmentService.getAll as jest.Mock).mockResolvedValue({data: []});
});

test("loads pickup points and renders the list", async () => {
    (PickupPointService.search as jest.Mock).mockResolvedValue({
        data: {
            items: [{
                pickupPointId: {value: "11f6a9b0-e529-4ff4-bf40-865d246f6138"},
                code: "WAW-001",
                name: "Punkt Centrum",
                type: "SERVICE_POINT",
                status: "ACTIVE",
                capabilities: ["DROP_OFF", "COLLECTION"],
                address: {
                    countryCode: "PL",
                    postalCode: "00-001",
                    city: "Warszawa",
                    street: "Marszałkowska",
                    buildingNumber: "1",
                },
                coordinates: {latitude: 52.23, longitude: 21.01},
                department: {departmentId: {value: "1"}, code: "WAW"},
                availability: {selectable: true, reasonCodes: [], isOpenNow: true},
                version: 0,
            }],
            page: 0,
            size: 20,
            totalElements: 1,
            totalPages: 1,
            evaluatedAt: "2026-09-09T08:00:00Z",
        },
    });

    render(<PickupPointCatalog/>);

    await waitFor(() => expect(PickupPointService.search).toHaveBeenCalledWith({
        query: undefined,
        type: undefined,
        status: undefined,
        capability: undefined,
        page: 0,
        size: 20,
    }));
    expect(await screen.findByText("WAW-001")).toBeInTheDocument();
    expect(screen.getByText("Punkt Centrum")).toBeInTheDocument();
    expect(screen.getByText(/Marszałkowska 1/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("pickup-point-map")).toHaveAttribute("data-point-count", "1"));
    expect(PickupPointService.search).toHaveBeenCalledWith(expect.objectContaining({page: 0, size: 100}));
});

test("loads every result page for the map independently from the table", async () => {
    const point = (id: string, code: string, latitude: number) => ({
        pickupPointId: {value: id},
        code,
        name: code,
        type: "SERVICE_POINT",
        status: "ACTIVE",
        capabilities: ["COLLECTION"],
        coordinates: {latitude, longitude: 21.01},
        availability: {selectable: true, reasonCodes: [], isOpenNow: true},
        version: 0,
    });
    (PickupPointService.search as jest.Mock).mockImplementation(({page, size}) => {
        if (size === 20) {
            return Promise.resolve({
                data: {items: [], page: 0, size: 20, totalElements: 0, totalPages: 0},
            });
        }
        return Promise.resolve({
            data: {
                items: page === 0
                    ? [point("11f6a9b0-e529-4ff4-bf40-865d246f6138", "WAW-001", 52.23)]
                    : [point("0dbb4368-ad8f-4adf-b880-f2df3dd0e153", "KRK-001", 50.06)],
                page,
                size: 100,
                totalElements: 2,
                totalPages: 2,
            },
        });
    });

    render(<PickupPointCatalog/>);

    await waitFor(() => expect(screen.getByTestId("pickup-point-map")).toHaveAttribute("data-point-count", "2"));
    expect(PickupPointService.search).toHaveBeenCalledWith(expect.objectContaining({page: 0, size: 100}));
    expect(PickupPointService.search).toHaveBeenCalledWith(expect.objectContaining({page: 1, size: 100}));
});

test("updates a pickup point without sending coordinates", async () => {
    const point = {
        pickupPointId: {value: "11f6a9b0-e529-4ff4-bf40-865d246f6138"},
        code: "WAW-001",
        name: "Punkt Centrum",
        type: "SERVICE_POINT",
        status: "ACTIVE",
        capabilities: ["DROP_OFF", "COLLECTION"],
        address: {
            countryCode: "PL",
            postalCode: "00-001",
            city: "Warszawa",
            street: "Marszałkowska",
            buildingNumber: "1",
        },
        coordinates: {latitude: 52.23, longitude: 21.01},
        department: {departmentId: {value: "1"}, code: "WAW"},
        availability: {selectable: true, reasonCodes: [], isOpenNow: true},
        servicePolicy: {allowedShipmentSizes: ["SMALL"], acceptsDangerousGoods: false},
        openingSchedule: {timeZone: "Europe/Warsaw", mode: "ALWAYS_OPEN", days: [], exceptions: []},
        version: 2,
        createdAt: "2026-09-09T08:00:00Z",
        updatedAt: "2026-09-09T08:00:00Z",
    };
    (PickupPointService.search as jest.Mock).mockResolvedValue({
        data: {items: [point], page: 0, size: 20, totalElements: 1, totalPages: 1},
    });
    (PickupPointService.getById as jest.Mock).mockResolvedValue({data: point});
    (PickupPointService.update as jest.Mock).mockResolvedValue({
        data: {...point, name: "Punkt Centrum 2", version: 3},
    });

    render(<PickupPointCatalog/>);
    fireEvent.click(await screen.findByRole("button", {name: pl.pickupPoints.edit.action}));

    await waitFor(() => expect(PickupPointService.getById).toHaveBeenCalledWith(point.pickupPointId.value));
    expect(await screen.findByText(pl.pickupPoints.edit.title)).toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue(point.name), {target: {value: "Punkt Centrum 2"}});
    fireEvent.click(screen.getByRole("button", {name: pl.pickupPoints.edit.submit}));

    await waitFor(() => expect(PickupPointService.update).toHaveBeenCalledWith(
        point.pickupPointId.value,
        expect.objectContaining({
            name: "Punkt Centrum 2",
            address: expect.objectContaining(point.address),
        }),
    ));
    expect((PickupPointService.update as jest.Mock).mock.calls[0][1]).not.toHaveProperty("coordinates");
    expect(await screen.findByText(pl.pickupPoints.edit.success)).toBeInTheDocument();
});
