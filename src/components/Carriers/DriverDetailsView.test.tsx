import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import DriverService from "../../hooks/DriverService";
import pl from "../../i18n/translate";
import DriverDetailsView from "./DriverDetailsView";

jest.mock("../../hooks/DriverService", () => ({__esModule: true, default: {get: jest.fn(), changeField: jest.fn(), changeActive: jest.fn()}}));
jest.mock("../../hooks/PalletService", () => ({__esModule: true, palletErrorCode: () => null, palletErrorDetail: () => null, default: {}}));

const driverService = DriverService as jest.Mocked<typeof DriverService>;

const driver = (overrides: Record<string, unknown> = {}) => ({
    driverId: 4, carrierId: 1, carrierName: "Trans-Pol", carrierActive: true, firstName: "Jan", lastName: "Kowalski",
    phone: null, licenseNumber: null, active: true,
    ...overrides,
});

const renderView = (onOpenTab = jest.fn()) => render(
    <MemoryRouter initialEntries={["/drivers/4"]}>
        <Routes>
            <Route path="/drivers/:driverId" element={<DriverDetailsView onOpenTab={onOpenTab} />} />
        </Routes>
    </MemoryRouter>,
);

describe("DriverDetailsView", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        driverService.get.mockResolvedValue({status: 200, data: driver()} as never);
    });

    it("edits a single driver field", async () => {
        driverService.changeField.mockResolvedValue({status: 200, data: driver({licenseNumber: "ABC123"})} as never);
        renderView();
        await screen.findByRole("heading", {name: "Jan Kowalski"});
        expect(driverService.get).toHaveBeenCalledWith("4");

        fireEvent.click(screen.getByRole("button", {name: pl.carriers.fieldEdit.edit.replace("{field}", pl.drivers.columns.licenseNumber)}));
        const dialog = await screen.findByRole("dialog");
        fireEvent.change(within(dialog).getByLabelText(pl.drivers.columns.licenseNumber), {target: {value: "ABC123"}});
        fireEvent.click(within(dialog).getByRole("button", {name: pl.carriers.fieldEdit.save}));

        await waitFor(() => expect(driverService.changeField).toHaveBeenCalledWith(4, "license-number", "ABC123"));
        expect(await screen.findByText("ABC123")).toBeInTheDocument();
    });

    it("deactivates the driver", async () => {
        driverService.changeActive.mockResolvedValue({status: 200, data: driver({active: false})} as never);
        renderView();
        await screen.findByRole("heading", {name: "Jan Kowalski"});

        fireEvent.click(screen.getByRole("button", {name: pl.carriers.list.deactivate}));

        await waitFor(() => expect(driverService.changeActive).toHaveBeenCalledWith(4, false));
        expect(await screen.findByText(pl.drivers.list.deactivated)).toBeInTheDocument();
    });

    it("opens the driver's carrier in a new tab", async () => {
        const onOpenTab = jest.fn();
        renderView(onOpenTab);
        await screen.findByRole("heading", {name: "Jan Kowalski"});

        fireEvent.click(screen.getByRole("button", {name: pl.drivers.view.openCarrier}));

        expect(onOpenTab).toHaveBeenCalledWith({label: `${pl.carriers.view.tabTitle} Trans-Pol`, path: "/carriers/1"});
    });
});
