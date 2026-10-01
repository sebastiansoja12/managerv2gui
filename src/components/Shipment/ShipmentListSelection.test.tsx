import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import DepartmentService from "../../hooks/DepartmentService";
import DocumentService from "../../hooks/DocumentService";
import ShipmentService from "../../hooks/ShipmentService";
import pl from "../../i18n/translate";
import {ShipmentDto} from "./dto/ShipmentDto";
import {exportShipmentExcel} from "./shipmentExcelExport";
import ShipmentList from "./ShipmentList";

jest.mock("../../hooks/ShipmentService", () => ({
    __esModule: true,
    default: {search: jest.fn()},
}));

jest.mock("../../hooks/DocumentService", () => ({
    __esModule: true,
    default: {getQrLabel: jest.fn()},
}));

jest.mock("../../hooks/DepartmentService", () => ({
    __esModule: true,
    default: {getAll: jest.fn()},
}));

jest.mock("./shipmentExcelExport", () => ({exportShipmentExcel: jest.fn()}));

const shipment = {
    shipmentId: {value: "101"},
    shipmentRelatedId: {value: "202"},
    sender: {firstName: "Anna", lastName: "Nowak"},
    recipient: {firstName: "Jan", lastName: "Kowalski"},
    shipmentStatus: "CREATED",
    price: {amount: 60, currency: "PLN"},
    trackingNumber: {value: "TRACK-101"},
    createdAt: "2026-08-12T10:37:00",
    updatedAt: "2026-08-15T10:00:00",
    delivery: {
        originDepartmentId: {value: 3},
        destinationDepartmentId: {value: 5},
        plannedDeliveryAt: null,
        deliveredAt: "2026-08-15T10:00:00",
    },
} as ShipmentDto;

describe("shipment list selection", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (ShipmentService.search as jest.Mock).mockResolvedValue({data: {content: [
            shipment,
            {...shipment, shipmentId: {value: "303"}, createdAt: null},
        ], page: 0, size: 25, totalElements: 60, totalPages: 3}, status: 200});
        (DepartmentService.getAll as jest.Mock).mockResolvedValue({data: [
            {departmentId: 3, departmentCode: {value: "KAT1"}},
            {departmentId: 5, departmentCode: {value: "POZ1"}},
        ]});
        (exportShipmentExcel as jest.Mock).mockResolvedValue(undefined);
        (DocumentService.getQrLabel as jest.Mock).mockResolvedValue({blob: new Blob(["label"], {type: "application/pdf"})});
        URL.createObjectURL = jest.fn(() => "blob:shipment-label");
        URL.revokeObjectURL = jest.fn();
    });

    it("shows the creation date with hours and minutes and a dash when it is missing", async () => {
        render(<MemoryRouter><ShipmentList/></MemoryRouter>);

        expect(screen.getByRole("columnheader", {name: pl.shipments.summary.createdAt})).toBeInTheDocument();
        const row = await screen.findByRole("row", {name: /#101/});
        expect(within(row).getAllByRole("cell")[4]).toHaveTextContent("12.08.2026, 10:37");
        const undatedRow = screen.getByRole("row", {name: /#303/});
        expect(within(undatedRow).getAllByRole("cell")[4]).toHaveTextContent(pl.common.dash);
    });

    it("shows origin and destination department codes and the delivery date from the shipment read model", async () => {
        render(<MemoryRouter><ShipmentList variant="details" onOpenTab={jest.fn()}/></MemoryRouter>);

        const row = await screen.findByRole("row", {name: /#101/});
        expect(await within(row).findByText("POZ1")).toBeInTheDocument();
        expect(within(row).getByText("KAT1")).toBeInTheDocument();
        expect(within(row).getAllByRole("cell")[5]).not.toHaveTextContent(pl.common.dash);
    });

    it("loads the selected page from the server", async () => {
        render(<MemoryRouter><ShipmentList/></MemoryRouter>);
        await screen.findByRole("row", {name: /#101/});

        fireEvent.click(screen.getByRole("button", {name: "2"}));

        await waitFor(() => expect(ShipmentService.search).toHaveBeenLastCalledWith(
            expect.objectContaining({page: 1, size: 25})));
        expect(screen.getByRole("button", {name: "2"})).toHaveAttribute("aria-current", "page");
    });

    it("passes the status tab to the server search", async () => {
        render(<MemoryRouter><ShipmentList/></MemoryRouter>);
        await screen.findByRole("row", {name: /#101/});

        fireEvent.click(screen.getByRole("button", {name: pl.shipments.status.DELIVERY}));

        await waitFor(() => expect(ShipmentService.search).toHaveBeenLastCalledWith(
            expect.objectContaining({shipmentStatuses: ["DELIVERY"], page: 0})));
    });

    it("enables actions for the selected shipment and opens its related shipment", async () => {
        const onOpenTab = jest.fn();
        render(<MemoryRouter><ShipmentList variant="details" onOpenTab={onOpenTab}/></MemoryRouter>);

        const exportButton = screen.getByRole("button", {name: pl.shipments.actions.exportToExcel});
        const labelButton = screen.getByRole("button", {name: pl.shipments.actions.showLabel});
        const displayButton = screen.getByRole("button", {name: pl.shipments.actions.display});
        expect(exportButton).toBeDisabled();
        expect(labelButton).toBeDisabled();
        expect(displayButton).toBeDisabled();
        expect(screen.queryByText(pl.shipments.metrics.summaryTitle)).not.toBeInTheDocument();

        const row = await screen.findByRole("row", {name: /#101/});
        fireEvent.click(row);
        expect(row).toHaveAttribute("aria-selected", "true");
        expect(exportButton).toBeEnabled();
        expect(labelButton).toBeEnabled();
        expect(displayButton).toBeEnabled();

        fireEvent.click(exportButton);
        await waitFor(() => expect(exportShipmentExcel).toHaveBeenCalledWith(shipment));
        await waitFor(() => expect(labelButton).toBeEnabled());
        fireEvent.click(labelButton);
        await waitFor(() => expect(DocumentService.getQrLabel).toHaveBeenCalledWith("101"));
        const dialog = await screen.findByRole("dialog");
        fireEvent.click(within(dialog).getByRole("button", {name: pl.common.close}));
        fireEvent.click(displayButton);
        expect(onOpenTab).toHaveBeenCalledWith(expect.objectContaining({path: "/shipments/tracking/TRACK-101/edit"}));

        const relatedLink = within(row).getByRole("link", {name: "#202"});
        fireEvent.click(relatedLink);
        expect(onOpenTab).toHaveBeenCalledWith(expect.objectContaining({path: "/shipments/202/edit"}));
    });
});
