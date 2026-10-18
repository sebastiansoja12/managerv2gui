import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import DepartmentService from "../../hooks/DepartmentService";
import PalletService from "../../hooks/PalletService";
import pl from "../../i18n/translate";
import PalletList from "./PalletList";

jest.mock("../../hooks/PalletService", () => ({
    __esModule: true,
    palletErrorCode: () => null,
    palletErrorDetail: () => null,
    savePalletDocument: jest.fn(),
    default: {search: jest.fn(), cancel: jest.fn(), getDocument: jest.fn(), update: jest.fn(), changeDepartments: jest.fn(), setMaxWeight: jest.fn(), assignCarrier: jest.fn()},
}));
jest.mock("../../hooks/DepartmentService", () => ({__esModule: true, default: {getAll: jest.fn()}}));
jest.mock("../../hooks/CarrierService", () => ({__esModule: true, default: {findAll: jest.fn(() => Promise.resolve({data: []}))}}));

const palletService = PalletService as jest.Mocked<typeof PalletService>;
const departmentService = DepartmentService as jest.Mocked<typeof DepartmentService>;

const pallet = (trackingNumber: string, overrides: Record<string, unknown> = {}) => ({
    palletId: trackingNumber.toLowerCase(),
    trackingNumber,
    palletStatus: "READY",
    storageStatus: "UNLOCKED",
    shipmentIds: ["1"],
    empty: false,
    loadable: true,
    grossWeight: 10,
    grossWeightUnit: "KG",
    originDepartmentId: 10,
    modified: "2026-10-18T08:00:00Z",
    ...overrides,
});

const rows = () => screen.getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("cell")[0].textContent);

describe("PalletList", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        departmentService.getAll.mockResolvedValue({data: [
            {departmentId: 10, departmentCode: {value: "KT1"}, address: {city: "Katowice"}},
        ]} as never);
        palletService.search.mockResolvedValue({status: 200, data: {page: 0, size: 200, totalElements: 3, content: [
            pallet("PAL3", {grossWeight: 30, modified: "2026-10-18T07:00:00Z"}),
            pallet("PAL1", {grossWeight: 500, palletStatus: "LOADED", carrier: {carrierId: 1, carrierName: "Trans-Pol", vehicleRegistrationNumber: "SK 1"}}),
            pallet("PAL2", {grossWeight: 2, modified: "2026-10-18T09:00:00Z"}),
        ]}} as never);
    });

    it("filters by text, status and carrier", async () => {
        render(<PalletList variant="all" />);
        await screen.findByText("PAL1");

        fireEvent.change(screen.getByLabelText(pl.pallets.list.filters.search), {target: {value: "trans"}});
        expect(rows()).toEqual(["PAL1"]);

        fireEvent.change(screen.getByLabelText(pl.pallets.list.filters.search), {target: {value: ""}});
        fireEvent.change(screen.getByLabelText(pl.pallets.list.filters.carrier), {target: {value: "WITHOUT"}});
        expect(rows()).toEqual(["PAL2", "PAL3"]);

        fireEvent.change(screen.getByLabelText(pl.pallets.list.filters.status), {target: {value: "LOADED"}});
        expect(screen.getByText(pl.pallets.list.noMatches)).toBeInTheDocument();
    });

    it("sorts by clicking column headers", async () => {
        render(<PalletList variant="all" />);
        await screen.findByText("PAL1");
        expect(rows()).toEqual(["PAL2", "PAL1", "PAL3"]);

        fireEvent.click(screen.getByRole("button", {name: new RegExp(pl.pallets.list.columns.grossWeight)}));
        expect(rows()).toEqual(["PAL1", "PAL3", "PAL2"]);
        fireEvent.click(screen.getByRole("button", {name: new RegExp(pl.pallets.list.columns.grossWeight)}));
        expect(rows()).toEqual(["PAL2", "PAL3", "PAL1"]);
    });

    it("enables actions next to the table for the selected pallet", async () => {
        const onOpenTab = jest.fn();
        render(<PalletList onOpenTab={onOpenTab} variant="all" />);
        await screen.findByText("PAL1");
        const actions = screen.getByRole("complementary", {name: pl.pallets.list.selectedActions});
        expect(within(actions).getByRole("button", {name: pl.pallets.list.actions.excel})).toBeDisabled();

        fireEvent.click(screen.getByText("PAL3"));

        expect(within(actions).getByText("PAL3")).toBeInTheDocument();
        expect(within(actions).getByRole("button", {name: pl.pallets.list.actions.edit})).toBeEnabled();
        palletService.getDocument.mockResolvedValue({blob: new Blob(["%PDF-"]), filename: "etykieta.pdf"} as never);
        Object.assign(URL, {createObjectURL: jest.fn(() => "blob:label"), revokeObjectURL: jest.fn()});
        fireEvent.click(within(actions).getByRole("button", {name: pl.pallets.list.actions.label}));
        await waitFor(() => expect(palletService.getDocument).toHaveBeenCalledWith("PAL3", "label"));

        fireEvent.click(within(actions).getByRole("button", {name: pl.pallets.list.actions.open}));
        expect(onOpenTab).toHaveBeenCalledWith(expect.objectContaining({path: "/pallets/tracking/PAL3"}));
    });
});
