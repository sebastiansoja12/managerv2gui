import React from "react";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import ShipmentService from "../../hooks/ShipmentService";
import TrackingService from "../../hooks/TrackingService";
import pl from "../../i18n/translate";
import ShipmentList from "./ShipmentList";

jest.mock("../../hooks/ShipmentService", () => ({
    __esModule: true,
    default: {search: jest.fn()},
}));

jest.mock("../../hooks/TrackingService", () => ({
    __esModule: true,
    default: {
        getAvailableProviders: jest.fn(),
        search: jest.fn(),
    },
}));

describe("external tracking search", () => {
    const selectExternalSource = async () => {
        fireEvent.mouseDown(screen.getByLabelText(pl.shipments.externalSearch.source));
        fireEvent.click(await screen.findByRole("option", {name: pl.shipments.externalSearch.external}));
        await waitFor(() => expect(
            screen.getByRole("combobox", {name: pl.shipments.externalSearch.provider})
        ).toHaveTextContent("InPost"));
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (ShipmentService.search as jest.Mock).mockResolvedValue({data: [], status: 200});
        (TrackingService.getAvailableProviders as jest.Mock).mockResolvedValue({
            data: [{id: "INPOST", displayName: "InPost"}],
            status: 200,
        });
        (TrackingService.search as jest.Mock).mockResolvedValue({
            data: [{
                provider: "INPOST",
                trackingNumber: "TRACK123456",
                currentStatus: "In transit",
                updatedAt: "2026-08-12T10:00:00Z",
                events: [{
                    timestamp: "2026-08-12T10:00:00Z",
                    name: "Accepted",
                    eventCode: "ACCEPTED",
                    location: {name: "Warsaw depot", city: "Warsaw", country: "PL"},
                }],
            }],
            status: 200,
        });
    });

    it("keeps System as default and shows provider selection only for external source", async () => {
        render(<MemoryRouter><ShipmentList/></MemoryRouter>);

        expect(screen.getByLabelText(pl.shipments.externalSearch.source)).toHaveTextContent(
            pl.shipments.externalSearch.system);
        expect(screen.queryByLabelText(pl.shipments.externalSearch.provider)).not.toBeInTheDocument();

        await selectExternalSource();
        expect(TrackingService.getAvailableProviders).toHaveBeenCalledTimes(1);
    });

    it("searches InPost and renders the common tracking history", async () => {
        render(<MemoryRouter><ShipmentList/></MemoryRouter>);
        await selectExternalSource();

        fireEvent.change(screen.getByLabelText(pl.shipments.table.trackingNumber), {
            target: {value: "TRACK123456"},
        });
        fireEvent.click(screen.getByRole("button", {name: pl.shipments.externalSearch.search}));

        await waitFor(() => expect(TrackingService.search).toHaveBeenCalledWith(
            "INPOST", ["TRACK123456"]));
        expect((await screen.findAllByText("In transit")).length).toBeGreaterThan(0);
        expect(screen.getByText("Accepted")).toBeInTheDocument();
        expect(screen.getByText(/Warsaw depot/)).toBeInTheDocument();
    });

    it("shows loading and an empty state when the provider returns no parcel", async () => {
        let resolveSearch: ((value: {data: never[]; status: number}) => void) | undefined;
        (TrackingService.search as jest.Mock).mockReturnValue(new Promise((resolve) => {
            resolveSearch = resolve;
        }));
        render(<MemoryRouter><ShipmentList/></MemoryRouter>);
        await selectExternalSource();
        fireEvent.change(screen.getByLabelText(pl.shipments.table.trackingNumber), {
            target: {value: "TRACK123456"},
        });
        const searchButton = screen.getByRole("button", {name: pl.shipments.externalSearch.search});

        fireEvent.click(searchButton);
        expect(searchButton).toBeDisabled();
        await act(async () => resolveSearch?.({data: [], status: 200}));

        expect(await screen.findByText(pl.shipments.table.localFilterNotFound)).toBeInTheDocument();
    });

    it("shows a stable backend error from external search", async () => {
        (TrackingService.search as jest.Mock).mockRejectedValue({message: "Provider temporarily unavailable"});
        render(<MemoryRouter><ShipmentList/></MemoryRouter>);
        await selectExternalSource();
        fireEvent.change(screen.getByLabelText(pl.shipments.table.trackingNumber), {
            target: {value: "TRACK123456"},
        });

        fireEvent.click(screen.getByRole("button", {name: pl.shipments.externalSearch.search}));

        expect(await screen.findByText("Provider temporarily unavailable")).toBeInTheDocument();
    });
});
