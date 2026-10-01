import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import DepartmentService from "../../hooks/DepartmentService";
import PalletService from "../../hooks/PalletService";
import ShipmentService from "../../hooks/ShipmentService";
import pl from "../../i18n/translate";
import {ShipmentDto} from "./dto/ShipmentDto";
import {exportShipmentsExcel} from "./shipmentExcelExport";
import ShipmentList from "./ShipmentList";

jest.mock("../../hooks/ShipmentService", () => ({
    __esModule: true,
    default: {search: jest.fn()},
}));

jest.mock("../../hooks/DepartmentService", () => ({
    __esModule: true,
    default: {getAll: jest.fn()},
}));

jest.mock("../../hooks/PalletService", () => ({
    __esModule: true,
    default: {createFromShipments: jest.fn()},
}));

jest.mock("./shipmentExcelExport", () => ({
    exportShipmentExcel: jest.fn(),
    exportShipmentsExcel: jest.fn(),
}));

const shipment = (id: string, status: ShipmentDto["shipmentStatus"] = "CREATED") => ({
    shipmentId: {value: id},
    sender: {firstName: "Anna", lastName: "Nowak"},
    recipient: {firstName: "Jan", lastName: "Kowalski"},
    shipmentStatus: status,
    trackingNumber: {value: `TRACK-${id}`},
    createdAt: "2026-11-02T10:00:00",
}) as ShipmentDto;

const bulk = pl.shipments.table.bulk;
const savedViews = pl.shipments.table.savedViews;

describe("shipment list bulk actions and saved views", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.localStorage.clear();
        (ShipmentService.search as jest.Mock).mockResolvedValue({data: {content: [
            shipment("101"),
            shipment("202"),
            shipment("303"),
        ], page: 0, size: 25, totalElements: 3, totalPages: 1}, status: 200});
        (DepartmentService.getAll as jest.Mock).mockResolvedValue({data: []});
        (exportShipmentsExcel as jest.Mock).mockResolvedValue(undefined);
    });

    it("exports only the checked shipments", async () => {
        render(<MemoryRouter><ShipmentList/></MemoryRouter>);

        fireEvent.click(await screen.findByRole("checkbox", {name: bulk.selectRow.replace("{value}", "#101")}));
        fireEvent.click(screen.getByRole("checkbox", {name: bulk.selectRow.replace("{value}", "#303")}));

        const bar = screen.getByRole("region", {name: bulk.selected.replace("{count}", "2")});
        fireEvent.click(within(bar).getByRole("button", {name: bulk.exportExcel}));

        await waitFor(() => expect(exportShipmentsExcel).toHaveBeenCalledTimes(1));
        expect((exportShipmentsExcel as jest.Mock).mock.calls[0][0].map((item: ShipmentDto) => item.shipmentId.value))
            .toEqual(["101", "303"]);
    });

    it("checks the whole page and creates a pallet from it", async () => {
        const onOpenTab = jest.fn();
        (PalletService.createFromShipments as jest.Mock).mockResolvedValue({data: {trackingNumber: "PAL-1"}});
        render(<MemoryRouter><ShipmentList onOpenTab={onOpenTab}/></MemoryRouter>);

        await screen.findByRole("row", {name: /#202/});
        fireEvent.click(screen.getByRole("checkbox", {name: bulk.selectPage}));
        fireEvent.click(screen.getByRole("button", {name: bulk.createPallet}));

        await waitFor(() => expect(PalletService.createFromShipments).toHaveBeenCalledWith(["101", "202", "303"]));
        await waitFor(() => expect(onOpenTab).toHaveBeenCalledWith(expect.objectContaining({path: "/pallets/tracking/PAL-1"})));
        expect(screen.queryByRole("region", {name: bulk.selected.replace("{count}", "3")})).not.toBeInTheDocument();
    });

    it("saves the current status as a view and applies it later", async () => {
        render(<MemoryRouter><ShipmentList/></MemoryRouter>);
        await screen.findByRole("row", {name: /#101/});

        fireEvent.click(screen.getByRole("button", {name: pl.shipments.status.PREPARED}));
        fireEvent.click(screen.getByRole("button", {name: savedViews.save}));
        const dialog = await screen.findByRole("dialog");
        fireEvent.click(within(dialog).getByRole("button", {name: savedViews.save}));
        expect(await within(dialog).findByText(savedViews.nameRequired)).toBeInTheDocument();

        fireEvent.change(within(dialog).getByLabelText(savedViews.nameLabel), {target: {value: "Przygotowane"}});
        fireEvent.click(within(dialog).getByRole("button", {name: savedViews.save}));

        fireEvent.click(screen.getByRole("button", {name: pl.common.all}));
        (ShipmentService.search as jest.Mock).mockClear();
        fireEvent.click(await screen.findByRole("button", {name: "Przygotowane"}));

        await waitFor(() => expect(ShipmentService.search).toHaveBeenCalledWith(
            expect.objectContaining({shipmentStatuses: ["PREPARED"]}),
        ));
    });
});
