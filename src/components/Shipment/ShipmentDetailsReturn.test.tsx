import React from "react";
import {act, fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import ShipmentService from "../../hooks/ShipmentService";
import DepartmentService from "../../hooks/DepartmentService";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import PickupPointService from "../../hooks/PickupPointService";
import pl from "../../i18n/translate";
import ShipmentDetails from "./ShipmentDetails";

jest.mock("../../hooks/ShipmentService", () => ({__esModule: true, default: {
    getControlCenter: jest.fn(), getControlCenterByTrackingNumber: jest.fn(),
}}));
jest.mock("../../hooks/DepartmentService", () => ({__esModule: true, default: {
    getAll: jest.fn().mockResolvedValue({data: []}),
}}));
jest.mock("../../hooks/OperatorConfigurationService", () => ({__esModule: true, default: {
    getCurrentShipmentConfiguration: jest.fn().mockResolvedValue({data: {}}),
}}));
jest.mock("../../hooks/PickupPointService", () => ({__esModule: true, default: {
    getById: jest.fn(),
}}));
jest.mock("../../hooks/ReturnService", () => ({__esModule: true, default: new Proxy({}, {
    get: () => {throw new Error("Shipment details must not request returns separately");},
})}));

const person = {firstName: "Jan", lastName: "Test", email: "", telephoneNumber: "", city: "", postalCode: "", street: ""};
const shipment = {
    shipmentId: {value: "6805406359141427429"}, trackingNumber: {value: "MGR-10"},
    sender: person, recipient: person, shipmentSize: "SMALL", shipmentPriority: "MEDIUM",
    destination: {value: "KT1"}, shipmentStatus: "DELIVERY", shipmentType: "PARENT",
    price: {amount: 15, currency: "PLN"}, locked: false,
};
const returnPackage = {
    returnPackageId: {value: "9223372036854775001"}, shipmentId: shipment.shipmentId,
    returnStatus: "PROCESSING",
};

const renderDetails = (byTracking: boolean) => render(
    <MemoryRouter initialEntries={[byTracking ? "/shipments/tracking/MGR-10/edit" : `/shipments/${shipment.shipmentId.value}/edit`]}>
        <Routes>
            <Route path="/shipments/:shipmentId/edit" element={<ShipmentDetails />} />
            <Route path="/shipments/tracking/:trackingNumber/edit" element={<ShipmentDetails />} />
            <Route path="/returns/:returnId" element={<div>Return details destination</div>} />
        </Routes>
    </MemoryRouter>,
);

describe("ShipmentDetails return data from Manager", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (DepartmentService.getAll as jest.Mock).mockResolvedValue({data: []});
        (OperatorConfigurationService.getCurrentShipmentConfiguration as jest.Mock).mockResolvedValue({data: {}});
        (PickupPointService.getById as jest.Mock).mockResolvedValue({data: {code: "KS_1"}});
    });

    it.each([false, true])("uses the return in Manager's shipment response (tracking route: %s)", async (byTracking) => {
        const lookup = (byTracking ? ShipmentService.getControlCenterByTrackingNumber : ShipmentService.getControlCenter) as jest.Mock;
        lookup.mockResolvedValue({data: {shipment, routeLog: null, returnPackage}, status: 200});
        renderDetails(byTracking);
        const summary = await screen.findByRole("region", {name: pl.shipments.returnSummary.title});
        expect(within(summary).getByText(pl.returns.status.PROCESSING)).toBeInTheDocument();
        const statusControl = screen.getByRole("region", {name: pl.shipments.form.fields.shipmentStatus});
        expect(statusControl.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(lookup).toHaveBeenCalledWith(byTracking ? "MGR-10" : shipment.shipmentId.value);
        fireEvent.click(within(summary).getByRole("button", {name: pl.shipments.returnSummary.open}));
        expect(screen.getByText("Return details destination")).toBeInTheDocument();
    });

    it("removes the panel when a refreshed Manager response has no return", async () => {
        const lookup = ShipmentService.getControlCenter as jest.Mock;
        lookup.mockResolvedValueOnce({data: {shipment, routeLog: null, returnPackage}, status: 200})
            .mockResolvedValueOnce({data: {shipment, routeLog: null, returnPackage: null}, status: 200});
        renderDetails(false);
        await screen.findByRole("region", {name: pl.shipments.returnSummary.title});
        await act(async () => {
            fireEvent.click(screen.getByRole("button", {name: pl.common.refresh}));
        });
        await waitFor(() => expect(lookup).toHaveBeenCalledTimes(2));
        expect(screen.queryByRole("region", {name: pl.shipments.returnSummary.title})).not.toBeInTheDocument();
    });

    it("displays the delivery pickup point code instead of its id", async () => {
        const deliveryPickupPointId = "c5afe577-8f66-464a-abaf-1d4369f0000";
        (ShipmentService.getControlCenter as jest.Mock).mockResolvedValue({
            data: {
                shipment: {...shipment, deliveryPickupPointId: {value: deliveryPickupPointId}},
                routeLog: null,
                returnPackage: null,
            },
            status: 200,
        });

        renderDetails(false);

        expect(await screen.findByText("KS_1")).toBeInTheDocument();
        expect(PickupPointService.getById).toHaveBeenCalledWith(deliveryPickupPointId);
        expect(screen.queryByText(deliveryPickupPointId)).not.toBeInTheDocument();
    });
});
