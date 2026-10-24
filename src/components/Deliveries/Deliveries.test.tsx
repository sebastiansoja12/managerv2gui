import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import DeliveryService from "../../hooks/DeliveryService";
import CarrierService from "../../hooks/CarrierService";
import CourierService from "../../hooks/CourierService";
import DepartmentService from "../../hooks/DepartmentService";
import PickupPointService from "../../hooks/PickupPointService";
import ShipmentService from "../../hooks/ShipmentService";
import pl from "../../i18n/translate";
import Deliveries from "./Deliveries";
import DeliveryEdit from "./DeliveryEdit";
import {Delivery, DeliveryHistoryEntry, DeliveryListItem, DeliveryListPage} from "./model/Delivery";
import {exportDeliveryExcel, exportDeliveryPdf} from "./deliveryExport";

jest.mock("../../hooks/DeliveryService", () => ({
    __esModule: true,
    default: {
        query: jest.fn(),
        get: jest.fn(),
        getRelated: jest.fn(),
        getHistory: jest.fn(),
        assignSupplier: jest.fn(),
        unassignSupplier: jest.fn(),
        changeRoute: jest.fn(),
        changeConditions: jest.fn(),
        registerAttempt: jest.fn(),
        complete: jest.fn(),
        commentStep: jest.fn(),
        correctStepStatus: jest.fn(),
        attachStepSignature: jest.fn(),
        reassignStepCarrier: jest.fn(),
        cancel: jest.fn(),
    },
}));

jest.mock("../../hooks/ShipmentService", () => ({
    __esModule: true,
    default: {get: jest.fn()},
}));

jest.mock("../../hooks/PickupPointService", () => ({
    __esModule: true,
    default: {getById: jest.fn(), search: jest.fn()},
}));

jest.mock("./details/tiles/DeliveryMapTile", () => ({
    __esModule: true,
    default: () => null,
}));

jest.mock("../../hooks/CourierService", () => ({
    __esModule: true,
    default: {getAll: jest.fn()},
}));

jest.mock("../../hooks/CarrierService", () => ({
    __esModule: true,
    default: {findAll: jest.fn()},
}));

jest.mock("../../hooks/DepartmentService", () => ({
    __esModule: true,
    default: {getAll: jest.fn()},
}));

jest.mock("../../api/errorMessage", () => ({
    getBackendErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

jest.mock("./deliveryExport", () => ({exportDeliveryExcel: jest.fn(), exportDeliveryPdf: jest.fn()}));

const mockedService = DeliveryService as jest.Mocked<typeof DeliveryService>;
const departments = [
    {departmentId: 3, departmentCode: {value: "KT1"}},
    {departmentId: 5, departmentCode: {value: "WAW1"}},
    {departmentId: 7, departmentCode: {value: "KR1"}},
];

const couriers = [
    {supplierId: 30, supplierCode: {value: "SUP30"}, firstName: "Jan", lastName: "Nowak", telephoneNumber: "",
        vehicleId: {value: 77}},
];

const carriers = [
    {carrierId: 3, name: "Trans-Pol", active: true, drivers: [], vehicles: [
        {vehicleId: 77, registrationNumber: "SK 12345", brand: "Volvo", model: "FH16", vehicleType: "TRUCK", active: true},
    ]},
];

const delivery: Delivery = {
    id: "6ce57331-8ef7-4a81-bf0f-14baa23231ad",
    targetType: "SHIPMENT",
    targetId: "9223372036854775001",
    shipmentId: "9223372036854775001",
    type: "OUTBOUND",
    deliveryStatus: "DEPOT",
    lifecycleStatus: "CREATED",
    originDepartmentId: "3",
    destinationDepartmentId: "5",
    pickupMethod: "PICKUP_POINT",
    method: "COURIER",
    pickupPointId: null,
    deliveryPickupPointId: null,
    supplierId: null,
    vehicleId: null,
    signatureRequired: false,
    instructions: null,
    createdAt: "2026-09-30T09:00:00",
    plannedAt: null,
    deliveredAt: null,
    attemptLimit: 3,
    steps: [{
        stepNumber: 1,
        attemptedAt: "2026-09-30T09:00:00",
        outcome: "IN_PROGRESS",
        deliveryStatus: "DEPOT",
        userId: "42",
        departmentId: "7",
        supplierId: "12",
        vehicleId: "21",
        signatureId: null,
        comment: "Shipment created",
        failureReason: null,
    }],
};

const historyEntry: DeliveryHistoryEntry = {
    eventType: "CREATED",
    occurredAt: "2026-09-30T09:00:00Z",
    userId: "42",
    deliveryStatus: "DEPOT",
    lifecycleStatus: "CREATED",
    originDepartmentId: "3",
    destinationDepartmentId: "5",
    pickupMethod: "PICKUP_POINT",
    method: "COURIER",
    pickupPointId: null,
    deliveryPickupPointId: null,
    supplierId: null,
    vehicleId: null,
    signatureRequired: false,
    instructions: null,
    plannedAt: null,
    stepCount: 1,
};

const listItem = (source: Delivery): DeliveryListItem => ({
    id: source.id,
    shipmentId: source.shipmentId,
    targetType: source.targetType,
    targetId: source.targetId,
    type: source.type,
    deliveryStatus: source.deliveryStatus,
    lifecycleStatus: source.lifecycleStatus,
    originDepartmentId: source.originDepartmentId,
    destinationDepartmentId: source.destinationDepartmentId,
    method: source.method,
    stepCount: source.steps.length,
    createdAt: source.createdAt,
    deliveredAt: source.deliveredAt,
});

const listPage = (items: DeliveryListItem[], hasNext = false) => ({
    data: {items, page: 0, size: 25, hasNext} as DeliveryListPage,
    status: 200,
});

describe("Deliveries", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (DepartmentService.getAll as jest.Mock).mockResolvedValue({data: departments});
        (CourierService.getAll as jest.Mock).mockResolvedValue({data: couriers});
        (CarrierService.findAll as jest.Mock).mockResolvedValue({data: carriers});
        (ShipmentService.get as jest.Mock).mockRejectedValue({status: 404});
        (PickupPointService.getById as jest.Mock).mockRejectedValue({status: 404});
        (PickupPointService.search as jest.Mock).mockResolvedValue({data: {items: []}});
        mockedService.getRelated.mockResolvedValue({data: [], status: 200});
        mockedService.getHistory.mockResolvedValue({data: [], status: 200});
    });

    const renderDeliveries = () => render(
        <MemoryRouter initialEntries={["/deliveries"]}>
            <Routes>
                <Route path="/deliveries" element={<Deliveries/>}/>
                <Route path="/deliveries/:deliveryId/edit" element={<DeliveryEdit/>}/>
            </Routes>
        </MemoryRouter>
    );

    it("shows the delivery and its steps", async () => {
        mockedService.query.mockResolvedValue(listPage([listItem(delivery)]));
        mockedService.get.mockResolvedValue({data: delivery, status: 200});

        renderDeliveries();

        expect(await screen.findByText(delivery.shipmentId as string)).toBeInTheDocument();
        expect(mockedService.query).toHaveBeenCalledWith(0, 25,
            {hideCanceled: true, hideCompleted: false, sort: "CREATED", direction: "desc"});
        fireEvent.click(screen.getByRole("button", {name: `${pl.deliveries.edit} ${delivery.id}`}));
        expect(await screen.findByText("Shipment created")).toBeInTheDocument();
        expect(screen.getByText(pl.deliveries.userLabel)).toBeInTheDocument();
        expect(screen.getByText("42")).toBeInTheDocument();
        expect(screen.getByText(pl.deliveries.departmentLabel)).toBeInTheDocument();
        expect(await screen.findByText("KR1")).toBeInTheDocument();
        expect(within(screen.getByRole("region", {name: pl.deliveries.historyTitle}))
            .getByText(pl.deliveries.courierLabel)).toBeInTheDocument();
        expect(screen.getByText("12")).toBeInTheDocument();
        expect(screen.getByText(pl.deliveries.attemptDateLabel)).toBeInTheDocument();
        expect(screen.getByText(pl.shipments.summary.originDepartment).nextSibling).toHaveTextContent("KT1");
        expect(screen.getByText(pl.shipments.summary.destination).nextSibling).toHaveTextContent("WAW1");
        expect(screen.getByText(pl.shipments.form.fields.pickupMethod).nextSibling)
            .toHaveTextContent(pl.shipments.pickupMethod.PICKUP_POINT);
        expect(screen.getByRole("link", {name: /9223372036854775001/})).toHaveAttribute("href", "/shipments/9223372036854775001/edit");
        expect(mockedService.get).toHaveBeenCalledWith(delivery.id);
    });

    it("confirms canceling and updates the row", async () => {
        mockedService.query.mockResolvedValueOnce(listPage([listItem(delivery)]))
            .mockResolvedValueOnce(listPage([{...listItem(delivery), lifecycleStatus: "CANCELED"}]));
        mockedService.cancel.mockResolvedValue({data: undefined, status: 200});
        renderDeliveries();

        await screen.findByText(delivery.shipmentId as string);
        fireEvent.click(screen.getByRole("button", {name: `${pl.deliveries.cancel} ${delivery.id}`}));
        expect(screen.getByText(pl.deliveries.cancelConfirmation.replace("{id}", delivery.id))).toBeInTheDocument();
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", {name: pl.deliveries.cancel}));
        await waitFor(() => expect(mockedService.cancel).toHaveBeenCalledWith(delivery.id));
        await waitFor(() => expect(mockedService.query).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(screen.getByRole("button", {name: `${pl.deliveries.cancel} ${delivery.id}`}))
            .toBeDisabled());
    });

    const openDetails = async () => {
        await screen.findByText(delivery.shipmentId as string);
        fireEvent.click(screen.getByRole("button", {name: `${pl.deliveries.edit} ${delivery.id}`}));
        await screen.findByRole("region", {name: pl.deliveries.details.operationsTitle});
    };

    const chooseOption = (label: string, option: string) => {
        fireEvent.mouseDown(screen.getByRole("combobox", {name: label}));
        fireEvent.click(screen.getByRole("option", {name: option}));
    };

    it("changes delivery method and conditions from the operations toolbar", async () => {
        mockedService.query.mockResolvedValue(listPage([listItem(delivery)]));
        mockedService.get.mockResolvedValue({data: delivery, status: 200});
        mockedService.changeConditions.mockResolvedValue({data: {...delivery, method: "LOCKER"}, status: 200});
        renderDeliveries();

        await openDetails();
        fireEvent.click(screen.getByRole("button", {name: `${pl.deliveries.edit} · ${pl.deliveries.details.conditionsScheduleTitle}`}));
        chooseOption(pl.deliveries.methodLabel, pl.deliveries.method.LOCKER);
        fireEvent.click(screen.getByRole("checkbox"));
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", {name: pl.deliveries.save}));

        await waitFor(() => expect(mockedService.changeConditions).toHaveBeenCalledWith(delivery.id, {
            method: "LOCKER", signatureRequired: true, instructions: null, plannedAt: null,
        }));
        expect(await screen.findByText(pl.deliveries.saveSuccess)).toBeInTheDocument();
    });

    it("assigns a courier with the courier vehicle", async () => {
        mockedService.query.mockResolvedValue(listPage([listItem(delivery)]));
        mockedService.get.mockResolvedValue({data: delivery, status: 200});
        mockedService.assignSupplier.mockResolvedValue({
            data: {...delivery, supplierId: "30", vehicleId: "77"}, status: 200,
        });
        renderDeliveries();

        await openDetails();
        fireEvent.click(screen.getByRole("button", {name: `${pl.deliveries.edit} · ${pl.deliveries.details.carrierTitle}`}));
        await waitFor(() => expect(CourierService.getAll).toHaveBeenCalled());
        chooseOption(pl.deliveries.details.courierSelect, "Jan Nowak (SUP30)");
        expect(screen.getByLabelText(pl.deliveries.details.courierVehicle)).toHaveValue("SK 12345 · Volvo FH16 — Trans-Pol");
        expect(screen.getByLabelText(pl.deliveries.details.courierVehicle)).toBeDisabled();
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", {name: pl.deliveries.save}));

        await waitFor(() => expect(mockedService.assignSupplier)
            .toHaveBeenCalledWith(delivery.id, {supplierId: "30", vehicleId: "77"}));
        expect(await within(screen.getByRole("article", {name: pl.deliveries.details.carrierTitle}))
            .findByText("Jan Nowak (SUP30)")).toBeInTheDocument();
    });

    it("registers a delivery attempt from the lifecycle menu", async () => {
        mockedService.query.mockResolvedValue(listPage([listItem(delivery)]));
        mockedService.get.mockResolvedValue({data: delivery, status: 200});
        mockedService.registerAttempt.mockResolvedValue({data: delivery, status: 200});
        renderDeliveries();

        await openDetails();
        fireEvent.click(screen.getByRole("button", {name: `${pl.deliveries.edit} · ${pl.deliveries.details.lifecycleTitle}`}));
        fireEvent.click(screen.getByRole("menuitem", {name: pl.deliveries.details.registerAttempt}));
        chooseOption(pl.deliveries.details.attemptStatus, pl.deliveries.status.UNAVAILABLE);
        fireEvent.change(screen.getByLabelText(pl.deliveries.commentLabel), {target: {value: "Nobody home"}});
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", {name: pl.deliveries.save}));

        await waitFor(() => expect(mockedService.registerAttempt)
            .toHaveBeenCalledWith(delivery.id, "UNAVAILABLE", "Nobody home"));
    });

    it("allows only comments on steps of a completed delivery", async () => {
        const completed = {...delivery, lifecycleStatus: "COMPLETED"};
        mockedService.query.mockResolvedValue(listPage([listItem(completed)]));
        mockedService.get.mockResolvedValue({data: completed, status: 200});
        mockedService.commentStep.mockResolvedValue({data: completed, status: 200});
        renderDeliveries();

        await openDetails();
        expect(screen.getByText(pl.deliveries.details.lockedHint)).toBeInTheDocument();
        expect(screen.getByRole("button", {name: `${pl.deliveries.edit} · ${pl.deliveries.details.routeTitle}`})).toBeDisabled();
        fireEvent.click(screen.getByRole("button", {name: pl.deliveries.details.stepActions.replace("{step}", "1")}));
        expect(screen.getByRole("menuitem", {name: pl.deliveries.details.stepCorrectStatus})).toBeDisabled();
        expect(screen.getByRole("menuitem", {name: pl.deliveries.details.stepCarrier})).toBeDisabled();
        fireEvent.click(screen.getByRole("menuitem", {name: pl.deliveries.details.stepComment}));
        fireEvent.change(screen.getByLabelText(pl.deliveries.commentLabel), {target: {value: "Checked by phone"}});
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", {name: pl.deliveries.save}));

        await waitFor(() => expect(mockedService.commentStep)
            .toHaveBeenCalledWith(delivery.id, 1, "Checked by phone"));
    });

    it("shows shipment, related deliveries, attempts and change history", async () => {
        const failedStep = {...delivery.steps[0], stepNumber: 2, outcome: "FAILED", deliveryStatus: "REJECTED",
            comment: "Nobody home", supplierId: null, vehicleId: null, userId: null};
        const withAttempt = {...delivery, plannedAt: "2020-01-01T10:00:00", steps: [...delivery.steps, failedStep]};
        const source = {...delivery, id: "source-delivery", shipmentId: "100", targetId: "100",
            lifecycleStatus: "COMPLETED"};
        mockedService.query.mockResolvedValue(listPage([listItem(withAttempt)]));
        mockedService.get.mockResolvedValue({data: withAttempt, status: 200});
        mockedService.getRelated.mockResolvedValue({data: [{relation: "SOURCE", delivery: source}], status: 200});
        mockedService.getHistory.mockResolvedValue({data: [
            {...historyEntry, eventType: "CREATED", occurredAt: "2026-09-30T09:00:00Z"},
            {...historyEntry, eventType: "MODIFIED", occurredAt: "2026-09-30T10:00:00Z", destinationDepartmentId: "7"},
        ], status: 200});
        (ShipmentService.get as jest.Mock).mockResolvedValue({data: {
            trackingNumber: {value: "TRK-555"}, shipmentStatus: "SENT",
            recipient: {firstName: "Anna", lastName: "Kowalska", street: "Długa 1", postalCode: "00-001", city: "Warszawa"},
            weight: {value: 2.5, unit: "KILOGRAM"},
            signature: {signerName: "Anna K.", signedAt: "2026-09-30T12:00:00", signatureMethod: "DIGITAL", signature: "x"},
        }});
        renderDeliveries();

        await openDetails();
        expect(await screen.findByText("TRK-555")).toBeInTheDocument();
        expect(screen.getByText("Anna Kowalska")).toBeInTheDocument();
        expect(screen.getByText("Anna K.")).toBeInTheDocument();
        expect(screen.getByText("1 / 3")).toBeInTheDocument();
        expect(screen.getByText(pl.deliveries.details.sla.OVERDUE)).toBeInTheDocument();
        const related = await screen.findByRole("link", {name: /100/});
        expect(related).toHaveAttribute("href", "/deliveries/source-delivery/edit");
        expect(screen.getByText(pl.deliveries.details.relation.SOURCE)).toBeInTheDocument();
        expect(screen.getByRole("navigation", {name: pl.deliveries.details.progressTitle}))
            .toHaveTextContent(pl.deliveries.details.stage.IN_DELIVERY);

        fireEvent.click(screen.getByRole("tab", {name: pl.deliveries.details.changeHistoryTitle}));
        const changes = screen.getByRole("region", {name: pl.deliveries.details.changeHistoryTitle});
        expect(within(changes).getByText(pl.deliveries.details.historyEvent.MODIFIED)).toBeInTheDocument();
        expect(within(changes).getByText("WAW1")).toBeInTheDocument();
        expect(within(changes).getByText("KR1")).toBeInTheDocument();
    });

    it("changes the route with a pickup point found by search", async () => {
        const point = {pickupPointId: {value: "7d4bd2b0-5b55-4c0f-9a43-8a8f8a7e1d10"}, code: "PP01", name: "Kiosk",
            type: "SHOP", status: "ACTIVE", capabilities: [], availability: "AVAILABLE", version: 1,
            address: {countryCode: "PL", postalCode: "00-001", city: "Warszawa", street: "Długa", buildingNumber: "1"}};
        mockedService.query.mockResolvedValue(listPage([listItem(delivery)]));
        mockedService.get.mockResolvedValue({data: delivery, status: 200});
        mockedService.changeRoute.mockResolvedValue({data: delivery, status: 200});
        (PickupPointService.search as jest.Mock).mockResolvedValue({data: {items: [point]}});
        renderDeliveries();

        await openDetails();
        fireEvent.click(screen.getByRole("button", {name: `${pl.deliveries.edit} · ${pl.deliveries.details.routeTitle}`}));
        fireEvent.change(screen.getByLabelText(
            `${pl.shipments.summary.deliveryPickupPoint} · ${pl.deliveries.details.searchPickupPoint}`),
            {target: {value: "Kiosk"}});
        fireEvent.click(await screen.findByRole("option", {name: /PP01 · Kiosk/}));
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", {name: pl.deliveries.save}));

        await waitFor(() => expect(mockedService.changeRoute).toHaveBeenCalledWith(delivery.id, {
            originDepartmentId: 3,
            destinationDepartmentId: 5,
            pickupMethod: "PICKUP_POINT",
            pickupPointId: null,
            deliveryPickupPointId: "7d4bd2b0-5b55-4c0f-9a43-8a8f8a7e1d10",
        }));
    });

    it("exports the selected delivery with its full history", async () => {
        mockedService.query.mockResolvedValue(listPage([listItem(delivery)]));
        mockedService.get.mockResolvedValue({data: delivery, status: 200});
        renderDeliveries();

        await screen.findByText(delivery.shipmentId as string);
        await waitFor(() => expect(DepartmentService.getAll).toHaveBeenCalled());
        await screen.findByText("KT1");
        fireEvent.click(screen.getByRole("button", {name: `${pl.deliveries.exportExcel} ${delivery.id}`}));
        await waitFor(() => expect(exportDeliveryExcel).toHaveBeenCalledWith(delivery, departments));
        fireEvent.click(screen.getByRole("button", {name: `${pl.deliveries.exportPdf} ${delivery.id}`}));
        await waitFor(() => expect(exportDeliveryPdf).toHaveBeenCalledWith(delivery, departments));
        expect(mockedService.get).toHaveBeenCalledTimes(2);
    });

    it("filters, shows canceled deliveries on demand and sorts columns", async () => {
        mockedService.query.mockResolvedValue(listPage([listItem(delivery)]));
        renderDeliveries();

        await screen.findByText(delivery.shipmentId as string);
        fireEvent.click(screen.getByRole("checkbox", {name: pl.deliveries.filters.hideCanceled}));
        await waitFor(() => expect(mockedService.query).toHaveBeenLastCalledWith(0, 25,
            expect.objectContaining({hideCanceled: false})));

        chooseOption(pl.deliveries.filters.deliveryStatus, pl.deliveries.status.DELIVERED);
        await waitFor(() => expect(mockedService.query).toHaveBeenLastCalledWith(0, 25,
            expect.objectContaining({deliveryStatuses: ["DELIVERED"]})));

        fireEvent.change(screen.getByLabelText(pl.deliveries.filters.text), {target: {value: "9223"}});
        await waitFor(() => expect(mockedService.query).toHaveBeenLastCalledWith(0, 25,
            expect.objectContaining({text: "9223"})));

        fireEvent.click(await screen.findByRole("button", {name: pl.deliveries.columns.steps}));
        await waitFor(() => expect(mockedService.query).toHaveBeenLastCalledWith(0, 25,
            expect.objectContaining({sort: "STEP_COUNT", direction: "asc"})));
        fireEvent.click(await screen.findByRole("button", {name: pl.deliveries.columns.steps}));
        await waitFor(() => expect(mockedService.query).toHaveBeenLastCalledWith(0, 25,
            expect.objectContaining({sort: "STEP_COUNT", direction: "desc"})));

        fireEvent.click(screen.getByRole("button", {name: pl.deliveries.filters.reset}));
        await waitFor(() => expect(mockedService.query).toHaveBeenLastCalledWith(0, 25,
            {hideCanceled: true, hideCompleted: false, sort: "STEP_COUNT", direction: "desc"}));
    });

    it("shows an empty state", async () => {
        mockedService.query.mockResolvedValue(listPage([]));

        renderDeliveries();

        expect(await screen.findByText(pl.deliveries.empty)).toBeInTheDocument();
    });

    it("shows an error and retries loading", async () => {
        mockedService.query.mockRejectedValueOnce({}).mockResolvedValueOnce(listPage([listItem(delivery)]));

        renderDeliveries();

        expect(await screen.findByText(pl.deliveries.loadError)).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", {name: pl.deliveries.retry}));
        await waitFor(() => expect(mockedService.query).toHaveBeenCalledTimes(2));
        expect(await screen.findByText(delivery.shipmentId as string)).toBeInTheDocument();
    });
});
