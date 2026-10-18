import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import CarrierService from "../../hooks/CarrierService";
import pl from "../../i18n/translate";
import CarrierDetailsView from "./CarrierDetailsView";

jest.mock("../../hooks/CarrierService", () => ({
    __esModule: true,
    default: {get: jest.fn(), changeField: jest.fn(), changeActive: jest.fn(), addVehicle: jest.fn(), changeVehicleField: jest.fn(), changeVehicleActive: jest.fn()},
}));
jest.mock("../../hooks/PalletService", () => ({__esModule: true, palletErrorCode: () => null, palletErrorDetail: () => null, default: {}}));

const carrierService = CarrierService as jest.Mocked<typeof CarrierService>;

const carrier = (overrides: Record<string, unknown> = {}) => ({
    carrierId: 1, name: "Zeta Trans", taxId: "NIP-1", phone: null, email: null, defaultTransportType: "EXTERNAL_CARRIER", active: true,
    drivers: [{driverId: 4, firstName: "Jan", lastName: "Kowalski", phone: null, licenseNumber: null, active: true}],
    vehicles: [{vehicleId: 7, registrationNumber: "SK 1", vehicleType: "TRUCK", trailerRegistrationNumber: null, maxLoadKg: null, active: true}],
    ...overrides,
});

const renderView = (onOpenTab = jest.fn()) => render(
    <MemoryRouter initialEntries={["/carriers/1"]}>
        <Routes>
            <Route path="/carriers/:carrierId" element={<CarrierDetailsView onOpenTab={onOpenTab} />} />
        </Routes>
    </MemoryRouter>,
);

describe("CarrierDetailsView", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        carrierService.get.mockResolvedValue({status: 200, data: carrier()} as never);
    });

    it("loads the carrier from the route", async () => {
        renderView();

        expect(await screen.findByRole("heading", {name: "Zeta Trans"})).toBeInTheDocument();
        expect(carrierService.get).toHaveBeenCalledWith("1");
        expect(screen.getByText("SK 1")).toBeInTheDocument();
    });

    it("edits a single carrier field in its own dialog", async () => {
        carrierService.changeField.mockResolvedValue({status: 200, data: carrier({phone: "500600700"})} as never);
        renderView();
        await screen.findByRole("heading", {name: "Zeta Trans"});

        fireEvent.click(screen.getByRole("button", {name: pl.carriers.fieldEdit.edit.replace("{field}", pl.carriers.columns.phone)}));
        const dialog = await screen.findByRole("dialog");
        expect(within(dialog).getAllByRole("textbox")).toHaveLength(1);
        fireEvent.change(within(dialog).getByLabelText(pl.carriers.columns.phone), {target: {value: " 500600700 "}});
        fireEvent.click(within(dialog).getByRole("button", {name: pl.carriers.fieldEdit.save}));

        await waitFor(() => expect(carrierService.changeField).toHaveBeenCalledWith(1, "phone", "500600700"));
        expect(await screen.findByText(pl.carriers.fieldEdit.saved)).toBeInTheDocument();
    });

    it("requires a value for mandatory fields", async () => {
        renderView();
        await screen.findByRole("heading", {name: "Zeta Trans"});

        fireEvent.click(screen.getByRole("button", {name: pl.carriers.fieldEdit.edit.replace("{field}", pl.carriers.columns.name)}));
        const dialog = await screen.findByRole("dialog");
        fireEvent.change(within(dialog).getByLabelText(new RegExp(`^${pl.carriers.columns.name}`)), {target: {value: " "}});
        fireEvent.click(within(dialog).getByRole("button", {name: pl.carriers.fieldEdit.save}));

        expect(await within(dialog).findByText(pl.carriers.fieldEdit.required)).toBeInTheDocument();
        expect(carrierService.changeField).not.toHaveBeenCalled();
    });

    it("opens a carrier driver in a new tab", async () => {
        const onOpenTab = jest.fn();
        renderView(onOpenTab);

        fireEvent.click(await screen.findByText("Kowalski"));

        expect(onOpenTab).toHaveBeenCalledWith(expect.objectContaining({path: "/drivers/4"}));
    });
});
