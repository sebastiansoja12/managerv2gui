import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import DeliveryService from "../../hooks/DeliveryService";
import DepartmentService from "../../hooks/DepartmentService";
import pl from "../../i18n/translate";
import Deliveries from "./Deliveries";
import DeliveryEdit from "./DeliveryEdit";
import {Delivery} from "./model/Delivery";
import {exportDeliveryExcel, exportDeliveryPdf} from "./deliveryExport";

jest.mock("../../hooks/DeliveryService", () => ({
    __esModule: true,
    default: {getRecent: jest.fn(), get: jest.fn(), changeMethod: jest.fn(), cancel: jest.fn()},
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
    createdAt: "2026-09-30T09:00:00",
    plannedAt: null,
    deliveredAt: null,
    steps: [{
        stepNumber: 1,
        attemptedAt: "2026-09-30T09:00:00",
        outcome: "IN_PROGRESS",
        deliveryStatus: "DEPOT",
        userId: "42",
        departmentId: "7",
        supplierId: "12",
        vehicleId: "21",
        comment: "Shipment created",
        failureReason: null,
    }],
};

describe("Deliveries", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (DepartmentService.getAll as jest.Mock).mockResolvedValue({data: departments});
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
        mockedService.getRecent.mockResolvedValue({data: [delivery], status: 200});
        mockedService.get.mockResolvedValue({data: delivery, status: 200});

        renderDeliveries();

        expect(await screen.findByText(delivery.shipmentId as string)).toBeInTheDocument();
        expect(mockedService.getRecent).toHaveBeenCalledWith(0, 26);
        const edit = screen.getByRole("button", {name: pl.deliveries.edit});
        expect(edit).toBeDisabled();
        const listCard = screen.getByRole("region", {name: pl.deliveries.listTitle});
        const actions = screen.getByRole("complementary", {name: pl.deliveries.actionsTitle});
        expect(listCard.contains(actions)).toBe(false);
        expect(actions.parentElement).toBe(listCard.parentElement);
        expect(within(screen.getByRole("table")).queryByRole("button", {name: pl.deliveries.edit})).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("radio", {name: `${pl.deliveries.selectDelivery} ${delivery.id}`}));
        fireEvent.click(edit);
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
        mockedService.getRecent.mockResolvedValueOnce({data: [delivery], status: 200})
            .mockResolvedValueOnce({data: [{...delivery, lifecycleStatus: "CANCELED"}], status: 200});
        mockedService.cancel.mockResolvedValue({data: undefined, status: 200});
        renderDeliveries();

        await screen.findByText(delivery.shipmentId as string);
        fireEvent.click(screen.getByRole("radio", {name: `${pl.deliveries.selectDelivery} ${delivery.id}`}));
        fireEvent.click(screen.getByRole("button", {name: pl.deliveries.cancel}));
        expect(screen.getByText(pl.deliveries.cancelConfirmation.replace("{id}", delivery.id))).toBeInTheDocument();
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", {name: pl.deliveries.cancel}));
        await waitFor(() => expect(mockedService.cancel).toHaveBeenCalledWith(delivery.id));
        await waitFor(() => expect(mockedService.getRecent).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(screen.getByRole("button", {name: pl.deliveries.cancel})).toBeDisabled());
    });

    it("changes the delivery method from the edit screen", async () => {
        mockedService.getRecent.mockResolvedValue({data: [delivery], status: 200});
        mockedService.get.mockResolvedValue({data: delivery, status: 200});
        mockedService.changeMethod.mockResolvedValue({data: {...delivery, method: "LOCKER"}, status: 200});
        renderDeliveries();

        await screen.findByText(delivery.shipmentId as string);
        fireEvent.click(screen.getByRole("radio", {name: `${pl.deliveries.selectDelivery} ${delivery.id}`}));
        fireEvent.click(screen.getByRole("button", {name: pl.deliveries.edit}));
        const methodSelect = await screen.findByRole("combobox", {name: pl.deliveries.methodLabel});
        fireEvent.mouseDown(methodSelect);
        fireEvent.click(screen.getByRole("option", {name: pl.deliveries.method.LOCKER}));
        fireEvent.click(screen.getByRole("button", {name: pl.deliveries.save}));

        await waitFor(() => expect(mockedService.changeMethod).toHaveBeenCalledWith(delivery.id, "LOCKER"));
        expect(await screen.findByText(pl.deliveries.saveSuccess)).toBeInTheDocument();
    });

    it("exports the selected delivery with its full history", async () => {
        mockedService.getRecent.mockResolvedValue({data: [delivery], status: 200});
        mockedService.get.mockResolvedValue({data: delivery, status: 200});
        renderDeliveries();

        await screen.findByText(delivery.shipmentId as string);
        fireEvent.click(screen.getByRole("radio", {name: `${pl.deliveries.selectDelivery} ${delivery.id}`}));
        fireEvent.click(screen.getByRole("button", {name: pl.deliveries.exportExcel}));
        await waitFor(() => expect(exportDeliveryExcel).toHaveBeenCalledWith(delivery, departments));
        fireEvent.click(screen.getByRole("button", {name: pl.deliveries.exportPdf}));
        await waitFor(() => expect(exportDeliveryPdf).toHaveBeenCalledWith(delivery, departments));
        expect(mockedService.get).toHaveBeenCalledTimes(2);
    });

    it("shows an empty state", async () => {
        mockedService.getRecent.mockResolvedValue({data: [], status: 200});

        renderDeliveries();

        expect(await screen.findByText(pl.deliveries.empty)).toBeInTheDocument();
    });

    it("shows an error and retries loading", async () => {
        mockedService.getRecent.mockRejectedValueOnce({}).mockResolvedValueOnce({data: [delivery], status: 200});

        renderDeliveries();

        expect(await screen.findByText(pl.deliveries.loadError)).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", {name: pl.deliveries.retry}));
        await waitFor(() => expect(mockedService.getRecent).toHaveBeenCalledTimes(2));
        expect(await screen.findByText(delivery.shipmentId as string)).toBeInTheDocument();
    });
});
