import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import CarrierService from "../../hooks/CarrierService";
import DriverService from "../../hooks/DriverService";
import pl from "../../i18n/translate";
import DriverList from "./DriverList";

jest.mock("../../hooks/CarrierService", () => ({__esModule: true, default: {findAll: jest.fn()}}));
jest.mock("../../hooks/DriverService", () => ({__esModule: true, default: {findAll: jest.fn(), create: jest.fn()}}));
jest.mock("../../hooks/PalletService", () => ({__esModule: true, palletErrorCode: () => null, palletErrorDetail: () => null, default: {}}));

const carrierService = CarrierService as jest.Mocked<typeof CarrierService>;
const driverService = DriverService as jest.Mocked<typeof DriverService>;

const driver = (id: number, firstName: string, lastName: string, overrides: Record<string, unknown> = {}) => ({
    driverId: id, carrierId: 1, carrierName: "Trans-Pol", carrierActive: true, firstName, lastName, phone: null, licenseNumber: null, active: true,
    ...overrides,
});

describe("DriverList", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        carrierService.findAll.mockResolvedValue({status: 200, data: [
            {carrierId: 1, name: "Trans-Pol", active: true, drivers: [], vehicles: []},
        ]} as never);
        driverService.findAll.mockResolvedValue({status: 200, data: [driver(4, "Jan", "Kowalski"), driver(5, "Adam", "Nowak", {active: false})]} as never);
    });

    it("filters drivers by status", async () => {
        render(<DriverList />);
        await screen.findByText("Kowalski");

        fireEvent.change(screen.getByLabelText(pl.drivers.columns.status), {target: {value: "INACTIVE"}});

        expect(screen.queryByText("Kowalski")).not.toBeInTheDocument();
        expect(screen.getByText("Nowak")).toBeInTheDocument();
    });

    it("opens the selected driver in a new tab", async () => {
        const onOpenTab = jest.fn();
        render(<DriverList onOpenTab={onOpenTab} />);

        fireEvent.keyDown(await screen.findByText("Kowalski"), {key: "Enter"});

        expect(onOpenTab).toHaveBeenCalledWith({label: `${pl.drivers.view.tabTitle} Jan Kowalski`, path: "/drivers/4"});
    });

    it("adds a driver and opens its tab", async () => {
        const onOpenTab = jest.fn();
        driverService.create.mockResolvedValue({status: 201, data: driver(6, "Ewa", "Zielińska")} as never);
        render(<DriverList onOpenTab={onOpenTab} />);
        await screen.findByText("Kowalski");

        fireEvent.click(screen.getByRole("button", {name: pl.drivers.list.add}));
        const dialog = await screen.findByRole("dialog");
        fireEvent.change(within(dialog).getByLabelText(new RegExp(`^${pl.drivers.create.carrier}`)), {target: {value: "1"}});
        fireEvent.change(within(dialog).getByLabelText(new RegExp(`^${pl.drivers.create.firstName}`)), {target: {value: "Ewa"}});
        fireEvent.change(within(dialog).getByLabelText(new RegExp(`^${pl.drivers.create.lastName}`)), {target: {value: "Zielińska"}});
        fireEvent.click(within(dialog).getByRole("button", {name: pl.drivers.create.submit}));

        await waitFor(() => expect(onOpenTab).toHaveBeenCalledWith(expect.objectContaining({path: "/drivers/6"})));
        expect(driverService.create).toHaveBeenCalledWith(expect.objectContaining({carrierId: "1", firstName: "Ewa", lastName: "Zielińska"}));
    });
});
