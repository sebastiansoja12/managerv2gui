import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
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

jest.mock("./shipmentExcelExport", () => ({exportShipmentExcel: jest.fn()}));

const shipment = {
    shipmentId: {value: "101"},
    shipmentRelatedId: {value: "202"},
    sender: {firstName: "Anna", lastName: "Nowak"},
    recipient: {firstName: "Jan", lastName: "Kowalski"},
    destination: {value: "KT1"},
    shipmentStatus: "CREATED",
    price: {amount: 60, currency: "PLN"},
    trackingNumber: {value: "TRACK-101"},
} as ShipmentDto;

describe("shipment list selection", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (ShipmentService.search as jest.Mock).mockResolvedValue({data: [shipment], status: 200});
        (exportShipmentExcel as jest.Mock).mockResolvedValue(undefined);
        (DocumentService.getQrLabel as jest.Mock).mockResolvedValue({blob: new Blob(["label"], {type: "application/pdf"})});
        URL.createObjectURL = jest.fn(() => "blob:shipment-label");
        URL.revokeObjectURL = jest.fn();
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
