import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import CarrierService from "../../hooks/CarrierService";
import DeliveryService from "../../hooks/DeliveryService";
import DepartmentService from "../../hooks/DepartmentService";
import PalletService from "../../hooks/PalletService";
import ShipmentService from "../../hooks/ShipmentService";
import pl from "../../i18n/translate";
import PalletDetailsView from "./PalletDetailsView";

jest.mock("../../hooks/PalletService", () => ({
    __esModule: true,
    palletErrorCode: () => null,
    palletErrorDetail: () => null,
    savePalletDocument: jest.fn(),
    default: {getByTrackingNumber: jest.fn(), addShipments: jest.fn(), removeShipment: jest.fn(), setMaxWeight: jest.fn(), getHistory: jest.fn(), assignCarrier: jest.fn(), changeStatus: jest.fn(), getDocument: jest.fn(), update: jest.fn(), changeDepartments: jest.fn(), scan: jest.fn(), cancel: jest.fn()},
}));
jest.mock("../../hooks/ShipmentService", () => ({__esModule: true, default: {getControlCenter: jest.fn(), getByTrackingNumber: jest.fn(), search: jest.fn()}}));
jest.mock("../../hooks/DeliveryService", () => ({__esModule: true, default: {getByPalletId: jest.fn()}}));
jest.mock("../../hooks/CarrierService", () => ({__esModule: true, default: {findAll: jest.fn(), create: jest.fn(), addDriver: jest.fn(), addVehicle: jest.fn()}}));
jest.mock("../../hooks/DepartmentService", () => ({__esModule: true, default: {getAll: jest.fn()}}));

const palletService = PalletService as jest.Mocked<typeof PalletService>;
const shipmentService = ShipmentService as jest.Mocked<typeof ShipmentService>;
const carrierService = CarrierService as jest.Mocked<typeof CarrierService>;
const deliveryService = DeliveryService as jest.Mocked<typeof DeliveryService>;
const departmentService = DepartmentService as jest.Mocked<typeof DepartmentService>;

const pallet = {
    palletId: "pallet-1",
    trackingNumber: "PAL000000000001",
    palletStatus: "READY",
    storageStatus: "UNLOCKED",
    shipmentIds: ["9007199254740993"],
    empty: false,
    loadable: true,
    grossWeight: 120,
    grossWeightUnit: "KG",
    maxGrossWeight: 1000,
    maxGrossWeightUnit: "KG",
    originDepartmentId: 10,
    destinationDepartmentId: null,
    created: "2026-10-17T10:00:00Z",
    modified: "2026-10-17T10:05:00Z",
};

const renderView = () => render(
    <MemoryRouter initialEntries={["/pallets/tracking/PAL000000000001"]}>
        <Routes>
            <Route path="/pallets/tracking/:trackingNumber" element={<PalletDetailsView />} />
        </Routes>
    </MemoryRouter>
);

describe("PalletDetailsView", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        palletService.getByTrackingNumber.mockResolvedValue({status: 200, data: pallet} as never);
        departmentService.getAll.mockResolvedValue({data: [
            {departmentId: 10, departmentCode: {value: "KT1"}, address: {city: "Katowice"}},
        ]} as never);
        deliveryService.getByPalletId.mockRejectedValue({status: 404});
        carrierService.findAll.mockResolvedValue({status: 200, data: [
            {carrierId: 1, name: "Trans-Pol", taxId: "1234567890", defaultTransportType: "EXTERNAL_CARRIER", active: true,
                drivers: [{driverId: 5, firstName: "Jan", lastName: "Kowalski", phone: "500600700", active: true}],
                vehicles: [{vehicleId: 7, registrationNumber: "SK 12345", vehicleType: "TRUCK", trailerRegistrationNumber: "SK 999", active: true}]},
        ]} as never);
        palletService.getHistory.mockResolvedValue({status: 200, data: [
            {eventType: "CREATED", palletStatus: "CREATED", occurredAt: "2026-10-17T10:00:00Z", userId: 3, username: "warehouse.user", departmentId: 10, details: null},
            {eventType: "SHIPMENTS_ADDED", palletStatus: "READY", occurredAt: "2026-10-17T10:05:00Z", userId: 3, username: "warehouse.user", departmentId: 10, details: "9007199254740993"},
        ]} as never);
        shipmentService.getControlCenter.mockResolvedValue({status: 200, data: {
            shipment: {
                shipmentId: {value: "9007199254740993"},
                trackingNumber: {value: "FTM-1"},
                shipmentStatus: "CREATED",
                recipient: {firstName: "Jan", lastName: "Nowak", city: "Kraków"},
                destination: {value: "KR1"},
                weight: {value: 5, unit: "KG"},
            },
            routeLog: {routeLogRecordDetails: {routeLogRecordDetailSet: [{
                id: 1, version: "1", username: "warehouse.user", depotCode: {value: "KT1"},
                parcelStatus: "", shipmentStatus: "CREATED", description: "shipment.created",
                timestamp: "2026-10-17T09:00:00Z", processType: "CREATED", request: "",
            }]}},
        }} as never);
    });

    it("shows pallet details, items, departments and route history", async () => {
        renderView();

        expect(await screen.findByText("FTM-1")).toBeInTheDocument();
        expect(screen.getByText(pl.pallets.details.delivery.empty)).toBeInTheDocument();
        expect(screen.getAllByText("KT1 · Katowice").length).toBeGreaterThan(0);
        expect(await screen.findByText(pl.pallets.history.events.SHIPMENTS_ADDED)).toBeInTheDocument();
        expect(screen.getByText(pl.pallets.history.events.CREATED)).toBeInTheDocument();
        expect(screen.getAllByText("warehouse.user")).toHaveLength(2);
        expect(palletService.getHistory).toHaveBeenCalledWith("pallet-1");
        expect(shipmentService.getControlCenter).toHaveBeenCalledWith("9007199254740993");
    });

    it("adds a shipment by tracking number", async () => {
        shipmentService.getByTrackingNumber.mockResolvedValue({status: 200, data: {shipmentId: {value: "77"}}} as never);
        palletService.addShipments.mockResolvedValue({status: 200, data: {...pallet, shipmentIds: ["9007199254740993", "77"]}} as never);
        renderView();
        await screen.findAllByText("FTM-1");

        fireEvent.change(screen.getByLabelText(pl.pallets.details.items.inputLabel), {target: {value: "FTM-2"}});
        fireEvent.click(screen.getByRole("button", {name: pl.pallets.details.items.add}));

        await waitFor(() => expect(palletService.addShipments).toHaveBeenCalledWith("pallet-1", ["77"]));
    });

    it("shows max weight as read-only once it is set", async () => {
        renderView();
        await screen.findAllByText("FTM-1");

        expect(screen.getByText(pl.pallets.details.weight.maxLocked)).toBeInTheDocument();
        expect(screen.getByText(pl.pallets.details.weight.autoHint)).toBeInTheDocument();
    });

    it("edits pallet attributes and sets max weight once", async () => {
        palletService.getByTrackingNumber.mockResolvedValue({status: 200, data: {...pallet, maxGrossWeight: null, maxGrossWeightUnit: null}} as never);
        palletService.update.mockResolvedValue({status: 200, data: {...pallet, maxGrossWeight: null, palletType: "CHILD", sealNumber: "S-1"}} as never);
        palletService.setMaxWeight.mockResolvedValue({status: 200, data: {...pallet, palletType: "CHILD", sealNumber: "S-1"}} as never);
        const confirm = jest.spyOn(window, "confirm").mockReturnValue(true);
        renderView();
        await screen.findAllByText("FTM-1");

        fireEvent.click(screen.getAllByRole("button", {name: pl.pallets.details.actions.edit})[0]);
        const dialog = await screen.findByRole("dialog");
        fireEvent.change(within(dialog).getByLabelText(pl.pallets.edit.palletType), {target: {value: "CHILD"}});
        fireEvent.change(within(dialog).getByLabelText(pl.pallets.edit.sealNumber), {target: {value: "S-1"}});
        fireEvent.change(within(dialog).getByLabelText(pl.pallets.edit.length), {target: {value: "120"}});
        fireEvent.click(within(dialog).getByRole("button", {name: pl.pallets.edit.save}));
        expect(await within(dialog).findByText(pl.pallets.edit.invalidDimensions)).toBeInTheDocument();

        fireEvent.change(within(dialog).getByLabelText(pl.pallets.edit.width), {target: {value: "80"}});
        fireEvent.change(within(dialog).getByLabelText(pl.pallets.edit.height), {target: {value: "150"}});
        fireEvent.change(within(dialog).getByLabelText(pl.pallets.details.weight.max), {target: {value: "800,5"}});
        fireEvent.click(within(dialog).getByRole("button", {name: pl.pallets.edit.save}));

        await waitFor(() => expect(palletService.update).toHaveBeenCalledWith("pallet-1", expect.objectContaining({
            palletType: "CHILD", sealNumber: "S-1", length: 120, width: 80, height: 150,
        })));
        await waitFor(() => expect(palletService.setMaxWeight).toHaveBeenCalledWith("pallet-1", 800.5));
        expect(await screen.findByText(pl.pallets.edit.saved)).toBeInTheDocument();
        confirm.mockRestore();
    });

    it("warns when the pallet exceeds max weight", async () => {
        palletService.getByTrackingNumber.mockResolvedValue({status: 200, data: {
            ...pallet, grossWeight: 1200, maxGrossWeight: 1000, palletStatus: "NOT_READY", loadable: false, loadBlockReason: "OVERWEIGHT",
        }} as never);
        renderView();
        await screen.findAllByText("FTM-1");

        expect(screen.getByText((content) => content.startsWith(pl.pallets.details.weight.overweightWarning.split("(")[0])))
            .toBeInTheDocument();
    });

    it("adds shipments selected from the list", async () => {
        shipmentService.search.mockResolvedValue({status: 200, data: [
            {shipmentId: {value: "9007199254740993"}, trackingNumber: {value: "FTM-1"}, shipmentStatus: "CREATED", recipient: {}, destination: {value: "KR1"}},
            {shipmentId: {value: "88"}, trackingNumber: {value: "FTM-88"}, shipmentStatus: "PREPARED", recipient: {}, destination: {value: "KR1"}},
        ]} as never);
        palletService.addShipments.mockResolvedValue({status: 200, data: {...pallet, shipmentIds: ["9007199254740993", "88"]}} as never);
        renderView();
        await screen.findAllByText("FTM-1");

        fireEvent.click(screen.getByRole("button", {name: pl.pallets.details.items.addFromList}));
        const dialog = await screen.findByRole("dialog");
        await within(dialog).findByText("FTM-88");
        expect(within(dialog).getByText(pl.pallets.createFromShipments.alreadyOnPallet)).toBeInTheDocument();
        fireEvent.click(within(dialog).getByLabelText(pl.pallets.createFromShipments.selectShipment.replace("{trackingNumber}", "FTM-88")));
        fireEvent.click(within(dialog).getByRole("button", {name: pl.pallets.details.addFromList.submit.replace("{count}", "1")}));

        await waitFor(() => expect(palletService.addShipments).toHaveBeenCalledWith("pallet-1", ["88"]));
        expect(await screen.findByText(pl.pallets.details.addFromList.added.replace("{count}", "1"))).toBeInTheDocument();
    });

    it("assigns a carrier with driver and vehicle from DriverHub", async () => {
        palletService.assignCarrier.mockResolvedValue({status: 200, data: {...pallet, carrier: {
            carrierId: 1, carrierName: "Trans-Pol", transportType: "EXTERNAL_CARRIER", driverName: "Jan Kowalski", vehicleRegistrationNumber: "SK 12345",
        }}} as never);
        renderView();
        await screen.findAllByText("FTM-1");

        fireEvent.click(screen.getAllByRole("button", {name: pl.pallets.details.actions.assignCarrier})[0]);
        const dialog = await screen.findByRole("dialog");
        await within(dialog).findByText("Trans-Pol · 1234567890");
        fireEvent.click(within(dialog).getByRole("button", {name: pl.pallets.carrier.assign}));
        expect(await within(dialog).findByText(pl.pallets.carrier.carrierRequired)).toBeInTheDocument();

        fireEvent.change(within(dialog).getByLabelText(pl.pallets.carrier.carrier), {target: {value: "1"}});
        fireEvent.change(within(dialog).getByLabelText(pl.pallets.carrier.driver), {target: {value: "5"}});
        fireEvent.change(within(dialog).getByLabelText(pl.pallets.carrier.vehicle), {target: {value: "7"}});
        fireEvent.click(within(dialog).getByRole("button", {name: pl.pallets.carrier.assign}));

        await waitFor(() => expect(palletService.assignCarrier).toHaveBeenCalledWith("pallet-1", expect.objectContaining({
            carrierId: "1", driverId: "5", vehicleId: "7", trailerRegistrationNumber: "SK 999",
        })));
        expect(await screen.findByText(pl.pallets.carrier.saved)).toBeInTheDocument();
    });

    it("blocks dispatch of a loaded pallet without carrier", async () => {
        palletService.getByTrackingNumber.mockResolvedValue({status: 200, data: {...pallet, palletStatus: "LOADED", loadable: false}} as never);
        renderView();
        await screen.findByText("FTM-1");

        expect(screen.getByRole("button", {name: pl.pallets.details.statusActions.dispatch})).toBeDisabled();
        expect(screen.getAllByText(pl.pallets.details.statusActions.carrierRequired).length).toBeGreaterThan(0);
    });

    it("dispatches a loaded pallet with carrier", async () => {
        const loaded = {...pallet, palletStatus: "LOADED", loadable: false, carrier: {
            carrierId: "c-1", carrierName: "Trans-Pol", transportType: "OWN_FLEET", vehicleRegistrationNumber: "SK 1",
        }};
        palletService.getByTrackingNumber.mockResolvedValue({status: 200, data: loaded} as never);
        palletService.changeStatus.mockResolvedValue({status: 200, data: {...loaded, palletStatus: "IN_TRANSIT"}} as never);
        const confirm = jest.spyOn(window, "confirm").mockReturnValue(true);
        renderView();
        await screen.findByText("FTM-1");

        fireEvent.click(screen.getByRole("button", {name: pl.pallets.details.statusActions.dispatch}));

        await waitFor(() => expect(palletService.changeStatus).toHaveBeenCalledWith("pallet-1", "IN_TRANSIT"));
        expect(await screen.findByRole("button", {name: pl.pallets.details.statusActions.markDelivered})).toBeInTheDocument();
        expect(screen.getByText(pl.pallets.carrier.locked)).toBeInTheDocument();
        confirm.mockRestore();
    });

    it("generates the transport document from the toolbar", async () => {
        const file = {blob: new Blob(["%PDF-"], {type: "application/pdf"}), filename: "list-przewozowy.pdf"};
        palletService.getDocument.mockResolvedValue(file as never);
        const createObjectURL = jest.fn(() => "blob:transport");
        Object.assign(URL, {createObjectURL, revokeObjectURL: jest.fn()});
        renderView();
        await screen.findAllByText("FTM-1");

        fireEvent.click(screen.getByRole("button", {name: pl.pallets.details.actions.transportDocument}));

        await waitFor(() => expect(palletService.getDocument).toHaveBeenCalledWith("PAL000000000001", "transport"));
        const dialog = await screen.findByRole("dialog");
        fireEvent.click(within(dialog).getByRole("button", {name: pl.pallets.documents.download}));
        const {savePalletDocument} = jest.requireMock("../../hooks/PalletService");
        expect(savePalletDocument).toHaveBeenCalledWith(file);
    });
});
