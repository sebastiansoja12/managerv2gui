import React from "react";
import {act, fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import ShipmentService from "../../hooks/ShipmentService";
import DeliveryService from "../../hooks/DeliveryService";
import DepartmentService from "../../hooks/DepartmentService";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import PickupPointService from "../../hooks/PickupPointService";
import ShipmentContentService from "../../hooks/ShipmentContentService";
import {OperatorCapabilitiesContext} from "../AppShell/OperatorCapabilitiesContext";
import pl from "../../i18n/translate";
import ShipmentDetails from "./ShipmentDetails";

jest.mock("../../hooks/ShipmentService", () => ({__esModule: true, default: {
    getControlCenter: jest.fn(), getControlCenterByTrackingNumber: jest.fn(),
}}));
jest.mock("../../hooks/DeliveryService", () => ({__esModule: true, default: {
    getByShipmentId: jest.fn(),
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
jest.mock("../../hooks/ShipmentContentService", () => ({__esModule: true, default: {
    listNotes: jest.fn(), listDocuments: jest.fn(),
}}));
jest.mock("../../hooks/ReturnService", () => ({__esModule: true, default: new Proxy({}, {
    get: () => {throw new Error("Shipment details must not request returns separately");},
})}));

const person = {firstName: "Jan", lastName: "Test", email: "", telephoneNumber: "", city: "", postalCode: "", street: ""};
const shipment = {
    shipmentId: {value: "6805406359141427429"}, trackingNumber: {value: "MGR-10"},
    sender: person, recipient: person, shipmentPriority: "MEDIUM",
    destination: {value: "KT1"}, shipmentStatus: "DELIVERY", shipmentType: "PARENT",
    price: {amount: 15, currency: "PLN"}, locked: false,
};
const returnPackage = {
    returnPackageId: {value: "9223372036854775001"}, shipmentId: shipment.shipmentId,
    returnStatus: "PROCESSING",
};
const delivery = {
    id: "delivery-123",
    targetType: "SHIPMENT",
    targetId: shipment.shipmentId.value,
    shipmentId: shipment.shipmentId.value,
    type: "OUTBOUND",
    deliveryStatus: "DELIVERY",
    lifecycleStatus: "CREATED",
    method: "COURIER",
    createdAt: "2026-10-07T17:00:00",
    plannedAt: null,
    deliveredAt: null,
    steps: [{
        stepNumber: 1,
        attemptedAt: "2026-10-07T17:00:00",
        outcome: "IN_PROGRESS",
        deliveryStatus: "DELIVERY",
        userId: "42",
        departmentId: "12",
        supplierId: "7",
        vehicleId: null,
        method: "COURIER",
        comment: "Przekazano kurierowi",
        failureReason: null,
    }],
};

const renderDetails = (byTracking: boolean) => render(
    <OperatorCapabilitiesContext.Provider value={{returnsStatus: "available"}}>
        <MemoryRouter initialEntries={[byTracking ? "/shipments/tracking/MGR-10/edit" : `/shipments/${shipment.shipmentId.value}/edit`]}>
            <Routes>
                <Route path="/shipments/:shipmentId/edit" element={<ShipmentDetails />} />
                <Route path="/shipments/tracking/:trackingNumber/edit" element={<ShipmentDetails />} />
                <Route path="/returns/:returnId" element={<div>Return details destination</div>} />
            </Routes>
        </MemoryRouter>
    </OperatorCapabilitiesContext.Provider>,
);

describe("ShipmentDetails return data from Manager", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (DeliveryService.getByShipmentId as jest.Mock).mockRejectedValue({status: 404});
        (DepartmentService.getAll as jest.Mock).mockResolvedValue({data: []});
        (OperatorConfigurationService.getCurrentShipmentConfiguration as jest.Mock).mockResolvedValue({data: {}});
        (PickupPointService.getById as jest.Mock).mockResolvedValue({data: {code: "KS_1"}});
        (ShipmentContentService.listNotes as jest.Mock).mockResolvedValue({data: []});
        (ShipmentContentService.listDocuments as jest.Mock).mockResolvedValue({data: []});
    });

    it.each([false, true])("uses the return in Manager's shipment response (tracking route: %s)", async (byTracking) => {
        const lookup = (byTracking ? ShipmentService.getControlCenterByTrackingNumber : ShipmentService.getControlCenter) as jest.Mock;
        lookup.mockResolvedValue({data: {shipment, routeLog: null, returnPackage}, status: 200});
        renderDetails(byTracking);
        const summary = await screen.findByRole("region", {name: pl.shipments.returnSummary.title});
        expect(within(summary).getByText(pl.returns.status.PROCESSING)).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", {name: pl.shipments.actions.operations}));
        expect(screen.getByRole("menuitem", {name: pl.shipments.actions.changeStatus})).toBeInTheDocument();
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

    it("keeps the return above shipment details on every detail tab", async () => {
        const animationFrame = jest.spyOn(window, "requestAnimationFrame").mockReturnValue(0);
        (ShipmentService.getControlCenter as jest.Mock).mockResolvedValue({
            data: {shipment, routeLog: null, returnPackage},
            status: 200,
        });

        renderDetails(false);

        const summary = await screen.findByRole("region", {name: pl.shipments.returnSummary.title});
        const shipmentData = screen.getByRole("heading", {name: pl.shipments.form.sections.shipmentData});
        expect(summary.compareDocumentPosition(shipmentData) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(within(summary).getByRole("heading", {name: pl.shipments.returnSummary.title})).toBeVisible();

        for (const tab of [pl.shipments.detailTabs.sender, pl.shipments.detailTabs.recipient, pl.shipments.detailTabs.overview]) {
            fireEvent.click(screen.getByRole("button", {name: tab}));
            expect(screen.getAllByRole("region", {name: pl.shipments.returnSummary.title})).toHaveLength(1);
            expect(within(summary).getByRole("button", {name: pl.shipments.returnSummary.open})).toBeVisible();
            expect(within(summary).getByText(pl.returns.status.PROCESSING)).toBeVisible();
        }
        animationFrame.mockRestore();
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

    it("shows delivery information in the shipment overview", async () => {
        (ShipmentService.getControlCenter as jest.Mock).mockResolvedValue({
            data: {shipment, routeLog: null, returnPackage: null},
            status: 200,
        });
        (DeliveryService.getByShipmentId as jest.Mock).mockResolvedValue({data: delivery, status: 200});

        renderDetails(false);

        const deliveryPanel = await screen.findByRole("region", {name: pl.deliveries.informationTitle});
        expect(await within(deliveryPanel).findByText("delivery-123")).toBeInTheDocument();
        expect(within(deliveryPanel).getAllByText(pl.deliveries.status.DELIVERY).length).toBeGreaterThan(0);
        expect(within(deliveryPanel).getByText("42")).toBeInTheDocument();
        expect(within(deliveryPanel).getByRole("button", {name: pl.deliveries.detailsTitle})).toBeInTheDocument();
        fireEvent.click(within(deliveryPanel).getByRole("button", {name: pl.deliveries.showAttempts}));
        expect(await screen.findByText(pl.deliveries.attemptsDialogTitle)).toBeInTheDocument();
        expect(screen.getByText("Przekazano kurierowi")).toBeInTheDocument();
        expect(screen.getByText(pl.deliveries.stepNumberLabel + " 1")).toBeInTheDocument();
        expect(DeliveryService.getByShipmentId).toHaveBeenCalledWith(shipment.shipmentId.value);
    });

    it("renders the complete backend-ready workspace and keeps shipment operations in the dropdown", async () => {
        (ShipmentService.getControlCenter as jest.Mock).mockResolvedValue({
            data: {shipment, routeLog: null, returnPackage: null},
            status: 200,
        });

        renderDetails(false);

        expect(await screen.findByRole("heading", {name: pl.shipments.form.sections.shipmentData})).toBeInTheDocument();
        expect(screen.getByRole("tab", {name: new RegExp(pl.shipments.dashboard.workspace.history)})).toBeInTheDocument();
        expect(screen.getByRole("tab", {name: new RegExp(pl.shipments.dashboard.workspace.notes)})).toBeInTheDocument();
        expect(screen.getByRole("tab", {name: new RegExp(pl.shipments.dashboard.workspace.documents)})).toBeInTheDocument();
        expect(screen.getByRole("heading", {name: pl.shipments.dashboard.operatorNotes})).toBeInTheDocument();
        expect(screen.getByRole("heading", {name: pl.shipments.dashboard.attachments})).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", {name: pl.shipments.actions.operations}));
        expect(screen.getByRole("menuitem", {name: pl.shipments.actions.changeStatus})).toBeInTheDocument();
        expect(screen.getByRole("menuitem", {name: pl.shipments.actions.assignCourier})).toBeDisabled();
        expect(screen.getByRole("menuitem", {name: pl.shipments.actions.changeDepartment})).toBeDisabled();
        expect(screen.getByRole("menuitem", {name: pl.shipments.actions.reroute})).toBeDisabled();
        expect(screen.getByRole("menuitem", {name: pl.shipments.actions.markProblematic})).toBeDisabled();

        await waitFor(() => expect(screen.getByRole("menuitem", {name: pl.shipments.actions.addDocument})).toBeEnabled());
        const fileClick = jest.spyOn(HTMLInputElement.prototype, "click");
        fireEvent.click(screen.getByRole("menuitem", {name: pl.shipments.actions.addDocument}));
        expect(fileClick).toHaveBeenCalled();
        fileClick.mockRestore();
    });
});
