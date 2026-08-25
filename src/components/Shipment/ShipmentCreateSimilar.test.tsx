import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import DepartmentService from "../../hooks/DepartmentService";
import DeliveryService from "../../hooks/DeliveryService";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import PickupPointService from "../../hooks/PickupPointService";
import ShipmentService from "../../hooks/ShipmentService";
import ShipmentContentService from "../../hooks/ShipmentContentService";
import pl from "../../i18n/translate";
import ShipmentCreate from "./ShipmentCreate";
import ShipmentDetails from "./ShipmentDetails";

jest.mock("../../hooks/ShipmentService", () => ({__esModule: true, default: {
    getControlCenter: jest.fn(), create: jest.fn(),
}}));
jest.mock("../../hooks/DepartmentService", () => ({__esModule: true, default: {
    getAll: jest.fn(),
}}));
jest.mock("../../hooks/DeliveryService", () => ({__esModule: true, default: {
    getByShipmentId: jest.fn(),
}}));
jest.mock("../../hooks/OperatorConfigurationService", () => ({__esModule: true, default: {
    getCurrentShipmentConfiguration: jest.fn(),
}}));
jest.mock("../../hooks/PickupPointService", () => ({__esModule: true, default: {
    getById: jest.fn(),
}}));
jest.mock("../../hooks/ShipmentContentService", () => ({__esModule: true, default: {
    listNotes: jest.fn(),
    listDocuments: jest.fn(),
}}));

it("copies all reusable shipment fields into the new create request", async () => {
    const deliveryPickupPointId = "11f6a9b0-e529-4ff4-bf40-865d246f6138";
    const pickupPointId = "11111111-1111-1111-1111-111111111111";
    const sender = {
        firstName: "Jan", lastName: "Kowalski", email: "jan@example.com", telephoneNumber: "123456789",
        city: "Warszawa", postalCode: "00-001", street: "Długa 1", countryCode: "PL",
    };
    const recipient = {
        firstName: "Anna", lastName: "Nowak", email: "anna@example.com", telephoneNumber: "987654321",
        city: "Berlin", postalCode: "10115", street: "Hauptstraße 2", countryCode: "DE",
    };
    const shipment = {
        shipmentId: {value: "6805406359141427429"}, trackingNumber: {value: "MGR-10"},
        sender, recipient, shipmentStatus: "CREATED", shipmentType: "PARENT",
        dimensions: {length: 40, width: 30, height: 20, unit: "CM"},
        weight: {value: 5, unit: "KG"},
        contentDescription: "Książki", customerReference: "REF-42",
        declaredValue: {amount: 120, currency: "EUR"}, price: {amount: 35, currency: "PLN"},
        shipmentPriority: "HIGH", packagingType: "BOX", serviceLevel: "EXPRESS",
        locked: false,
    };
    const delivery = {
        id: "6ce57331-8ef7-4a81-bf0f-14baa23231ad", targetType: "SHIPMENT", targetId: shipment.shipmentId.value,
        shipmentId: shipment.shipmentId.value, type: "OUTBOUND", deliveryStatus: "DEPOT", lifecycleStatus: "CREATED",
        originDepartmentId: "3", destinationDepartmentId: "5",
        pickupMethod: "LOCKER", method: "PICKUP_POINT",
        pickupPointId, deliveryPickupPointId,
        createdAt: "2026-09-30T09:00:00", plannedAt: null, deliveredAt: null, steps: [],
    };
    (ShipmentService.getControlCenter as jest.Mock).mockResolvedValue({
        data: {shipment, routeLog: null, returnPackage: null}, status: 200,
    });
    (ShipmentService.create as jest.Mock).mockReturnValue(new Promise(() => undefined));
    (DepartmentService.getAll as jest.Mock).mockResolvedValue({data: []});
    (DeliveryService.getByShipmentId as jest.Mock).mockResolvedValue({data: delivery, status: 200});
    (OperatorConfigurationService.getCurrentShipmentConfiguration as jest.Mock).mockResolvedValue({data: {}});
    (PickupPointService.getById as jest.Mock).mockResolvedValue({data: {code: "BER-001"}});
    (ShipmentContentService.listNotes as jest.Mock).mockResolvedValue({data: []});
    (ShipmentContentService.listDocuments as jest.Mock).mockResolvedValue({data: []});

    render(
        <MemoryRouter initialEntries={[`/shipments/${shipment.shipmentId.value}/edit`]}>
            <Routes>
                <Route path="/shipments/:shipmentId/edit" element={<ShipmentDetails />} />
                <Route path="/shipments/create" element={<ShipmentCreate />} />
            </Routes>
        </MemoryRouter>,
    );

    await screen.findByText("BER-001");
    fireEvent.click(screen.getByRole("button", {name: pl.shipments.actions.operations}));
    fireEvent.click(screen.getByRole("menuitem", {name: pl.shipments.actions.createSimilar}));

    expect(await screen.findByRole("heading", {name: pl.shipments.page.createTitle})).toBeInTheDocument();
    expect(screen.getByLabelText(pl.shipments.form.fields.declaredValueCurrency)).toHaveValue("EUR");
    expect(screen.getByText("BER-001")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", {name: pl.shipments.actions.create}));

    await waitFor(() => expect(ShipmentService.create).toHaveBeenCalledWith(expect.objectContaining({
        sender, recipient,
        dimensions: shipment.dimensions,
        weight: shipment.weight,
        contentDescription: shipment.contentDescription,
        customerReference: shipment.customerReference,
        declaredValue: shipment.declaredValue,
        price: shipment.price,
        shipmentPriority: shipment.shipmentPriority,
        packagingType: shipment.packagingType,
        serviceLevel: shipment.serviceLevel,
        pickupMethod: delivery.pickupMethod,
        deliveryMethod: delivery.method,
        pickupPointId: {value: pickupPointId},
        deliveryPickupPointId: {value: deliveryPickupPointId},
    })));
});
