import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import ShipmentService from "../../hooks/ShipmentService";
import ShipmentEdit from "./ShipmentEdit";
import pl from "../../i18n/translate";

jest.mock("../../hooks/ShipmentService", () => ({__esModule: true, default: {
    get: jest.fn(),
    getByTrackingNumber: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    updateSender: jest.fn(),
    updateRecipient: jest.fn(),
}}));

const person = {
    firstName: "Jan", lastName: "Test", email: "jan@example.com", telephoneNumber: "123456789",
    city: "Warsaw", postalCode: "00-001", street: "Main 1",
};

const shipment = {
    shipmentId: {value: "42"},
    trackingNumber: {value: "MGR-42"},
    dimensions: {length: 40, width: 30, height: 20, unit: "CM"},
    weight: {value: 5.5, unit: "KG"},
    contentDescription: "Electronics",
    customerReference: "ORDER-42",
    declaredValue: {amount: 2500, currency: "PLN"},
    shipmentPriority: "MEDIUM",
    shipmentStatus: "CREATED",
    shipmentType: "PARENT",
    price: {amount: 15, currency: "PLN"},
    sender: {...person, countryCode: "PL"},
    recipient: {...person, countryCode: "DE"},
    pickupMethod: "DEPARTMENT",
    deliveryMethod: "COURIER",
    locked: false,
};

const renderEdit = () => render(
    <MemoryRouter initialEntries={["/shipments/tracking/MGR-42/edit"]}>
        <Routes>
            <Route path="/shipments/tracking/:trackingNumber/edit" element={<ShipmentEdit />} />
        </Routes>
    </MemoryRouter>,
);

describe("ShipmentEdit parcel details", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (ShipmentService.getByTrackingNumber as jest.Mock).mockResolvedValue({data: shipment, status: 200});
        (ShipmentService.update as jest.Mock).mockResolvedValue({status: 200});
    });

    it("saves dimensions, weight, content and declared value through the update request", async () => {
        renderEdit();

        const lengthField = await screen.findByLabelText(pl.shipments.form.fields.length);
        fireEvent.change(lengthField, {target: {value: "45"}});
        fireEvent.change(screen.getByLabelText(pl.shipments.form.fields.weight), {target: {value: "6"}});
        fireEvent.change(screen.getByLabelText(pl.shipments.form.fields.contentDescription), {target: {value: "Books"}});
        fireEvent.change(screen.getByLabelText(pl.shipments.form.fields.declaredValue), {target: {value: "3000"}});
        fireEvent.click(screen.getByRole("button", {name: pl.common.saveChanges}));

        await waitFor(() => expect(ShipmentService.update).toHaveBeenCalledWith(expect.objectContaining({
            shipmentId: shipment.shipmentId,
            dimensions: {length: 45, width: 30, height: 20, unit: "CM"},
            weight: {value: 6, unit: "KG"},
            contentDescription: "Books",
            customerReference: "ORDER-42",
            declaredValue: {amount: 3000, currency: "PLN"},
            price: shipment.price,
            shipmentStatus: "CREATED",
        })));
    });

    it("rejects zero dimensions before sending the update", async () => {
        renderEdit();

        fireEvent.change(await screen.findByLabelText(pl.shipments.form.fields.length), {target: {value: "0"}});
        fireEvent.click(screen.getByRole("button", {name: pl.common.saveChanges}));

        expect(await screen.findByText(pl.shipments.messages.measurementsRequired)).toBeInTheDocument();
        expect(ShipmentService.update).not.toHaveBeenCalled();
    });
});
