import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import CarrierService from "../../hooks/CarrierService";
import pl from "../../i18n/translate";
import CarrierList from "./CarrierList";

jest.mock("../../hooks/CarrierService", () => ({
    __esModule: true,
    default: {findAll: jest.fn(), get: jest.fn(), create: jest.fn(), addVehicle: jest.fn()},
}));
jest.mock("../../hooks/DriverService", () => ({__esModule: true, default: {create: jest.fn()}}));
jest.mock("../../hooks/PalletService", () => ({__esModule: true, palletErrorCode: () => null, palletErrorDetail: () => null, default: {}}));

const carrierService = CarrierService as jest.Mocked<typeof CarrierService>;

const carrier = (id: number, name: string, overrides: Record<string, unknown> = {}) => ({
    carrierId: id, name, taxId: `NIP-${id}`, phone: null, email: null, defaultTransportType: "EXTERNAL_CARRIER", active: true,
    drivers: [], vehicles: [],
    ...overrides,
});

describe("CarrierList", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        carrierService.findAll.mockResolvedValue({status: 200, data: [carrier(1, "Zeta Trans"), carrier(2, "Alfa Cargo", {active: false})]} as never);
    });

    it("lists, filters and sorts carriers", async () => {
        render(<CarrierList />);
        await screen.findByText("Zeta Trans");
        const names = () => screen.getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("cell")[0].textContent);

        expect(names()).toEqual(["Alfa Cargo", "Zeta Trans"]);
        fireEvent.click(screen.getByRole("button", {name: new RegExp(pl.carriers.columns.name)}));
        expect(names()).toEqual(["Zeta Trans", "Alfa Cargo"]);
        fireEvent.change(screen.getByLabelText(pl.carriers.list.status), {target: {value: "ACTIVE"}});
        expect(names()).toEqual(["Zeta Trans"]);
    });

    it("opens the selected carrier in a new tab", async () => {
        const onOpenTab = jest.fn();
        render(<CarrierList onOpenTab={onOpenTab} />);

        fireEvent.click(await screen.findByText("Zeta Trans"));

        expect(onOpenTab).toHaveBeenCalledWith({label: `${pl.carriers.view.tabTitle} Zeta Trans`, path: "/carriers/1"});
        expect(screen.queryByRole("button", {name: pl.carriers.fieldEdit.edit.replace("{field}", pl.carriers.columns.phone)})).not.toBeInTheDocument();
    });

    it("adds a carrier and opens its tab", async () => {
        const onOpenTab = jest.fn();
        carrierService.create.mockResolvedValue({status: 201, data: carrier(3, "Nowy Przewoźnik")} as never);
        render(<CarrierList onOpenTab={onOpenTab} />);
        await screen.findByText("Zeta Trans");

        fireEvent.click(screen.getByRole("button", {name: pl.carriers.list.add}));
        const dialog = await screen.findByRole("dialog");
        fireEvent.change(within(dialog).getByLabelText(new RegExp(`^${pl.carriers.create.name}`)), {target: {value: "Nowy Przewoźnik"}});
        fireEvent.click(within(dialog).getByRole("button", {name: pl.carriers.create.submit}));

        await waitFor(() => expect(onOpenTab).toHaveBeenCalledWith(expect.objectContaining({path: "/carriers/3"})));
        expect(carrierService.create).toHaveBeenCalledWith(expect.objectContaining({name: "Nowy Przewoźnik"}));
    });
});
