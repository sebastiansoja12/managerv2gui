import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import ShipmentEditService from "../../hooks/ShipmentEditService";
import pl from "../../i18n/translate";
import ShipmentEditApplication, {resolveShipmentEditError, validateShipmentEditParty} from "./ShipmentEditApplication";
import {ShipmentEditParty} from "./dto/ShipmentEdit";

jest.mock("../../hooks/ShipmentEditService", () => ({
    __esModule: true,
    default: {getShipment: jest.fn(), requestToken: jest.fn(), verifyToken: jest.fn(), updateShipment: jest.fn()},
}));

const mockedService = ShipmentEditService as jest.Mocked<typeof ShipmentEditService>;

const party = (email: string): ShipmentEditParty => ({
    firstName: "Jan",
    lastName: "Kowalski",
    email,
    telephoneNumber: "500100200",
    city: "Katowice",
    postalCode: "40-001",
    street: "Mariacka 1",
    countryCode: "PL",
});

const renderPage = () => render(
    <MemoryRouter initialEntries={["/shipment-edit/TRK-001"]}>
        <Routes>
            <Route path="/shipment-edit/:trackingNumber" element={<ShipmentEditApplication/>}/>
        </Routes>
    </MemoryRouter>
);

describe("ShipmentEditApplication", () => {
    beforeEach(() => jest.clearAllMocks());

    it("informs the client when the shipment can no longer be edited", async () => {
        mockedService.getShipment.mockResolvedValue({
            data: {trackingNumber: "TRK-001", status: "SENT", reroutable: false, maskedEmail: "j***@example.com"},
            status: 200,
        });

        renderPage();

        expect(await screen.findByText(pl.shipmentEdit.summary.notEditable)).toBeInTheDocument();
        expect(screen.queryByRole("button", {name: pl.shipmentEdit.summary.requestToken})).not.toBeInTheDocument();
    });

    it("lets the client confirm the token and save corrected data", async () => {
        mockedService.getShipment.mockResolvedValue({
            data: {trackingNumber: "TRK-001", status: "CREATED", reroutable: true, maskedEmail: "j***@example.com"},
            status: 200,
        });
        mockedService.requestToken.mockResolvedValue({
            data: {maskedEmail: "j***@example.com", expiresAt: "2026-10-17T10:30:00Z"},
            status: 200,
        });
        mockedService.verifyToken.mockResolvedValue({
            data: {trackingNumber: "TRK-001", status: "CREATED", reroutable: true, sender: party("jan@example.com"),
                recipient: party("anna@example.com"), tokenExpiresAt: "2026-10-17T10:30:00Z"},
            status: 200,
        });
        mockedService.updateShipment.mockResolvedValue({
            data: {trackingNumber: "TRK-001", requestedAt: "2026-10-17T10:05:00Z"},
            status: 202,
        });
        renderPage();

        fireEvent.click(await screen.findByRole("button", {name: pl.shipmentEdit.summary.requestToken}));
        fireEvent.change(await screen.findByLabelText(pl.shipmentEdit.token.label), {target: {value: "123456"}});
        fireEvent.click(screen.getByRole("button", {name: pl.shipmentEdit.token.submit}));
        const recipientCity = await screen.findByLabelText(new RegExp(pl.shipmentEdit.fields.city), {selector: "#shipment-edit-recipient-city"});
        fireEvent.change(recipientCity, {target: {value: "Gliwice"}});
        fireEvent.click(screen.getByRole("button", {name: pl.shipmentEdit.form.submit}));

        expect(await screen.findByText(pl.shipmentEdit.done.title)).toBeInTheDocument();
        expect(mockedService.verifyToken).toHaveBeenCalledWith("TRK-001", "123456");
        expect(mockedService.updateShipment).toHaveBeenCalledWith("TRK-001", expect.objectContaining({
            token: "123456",
            recipient: expect.objectContaining({city: "Gliwice"}),
        }));
    });

    it("maps backend statuses to client friendly messages", () => {
        expect(resolveShipmentEditError({status: 403, message: "x"})).toBe(pl.shipmentEdit.errors.invalidToken);
        expect(resolveShipmentEditError({status: 410, message: "x"})).toBe(pl.shipmentEdit.errors.tokenExpired);
        expect(resolveShipmentEditError({status: 429, message: "x"})).toBe(pl.shipmentEdit.errors.attemptsExceeded);
        expect(resolveShipmentEditError({status: 409, message: "x"})).toBe(pl.shipmentEdit.errors.notEditable);
    });

    it("validates required party fields and e-mail without asking for country", () => {
        expect(validateShipmentEditParty({...party("wrong"), city: " ", countryCode: undefined}))
            .toEqual(["email", "city"]);
    });
});
