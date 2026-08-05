import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import DeliveryService from "../../hooks/DeliveryService";
import DepartmentService from "../../hooks/DepartmentService";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import ShipmentContentService from "../../hooks/ShipmentContentService";
import ShipmentService from "../../hooks/ShipmentService";
import pl from "../../i18n/translate";
import ShipmentDetails from "./ShipmentDetails";

jest.mock("../../hooks/ShipmentService", () => ({__esModule: true, default: {
    getControlCenter: jest.fn(),
}}));
jest.mock("../../hooks/DeliveryService", () => ({__esModule: true, default: {
    getByShipmentId: jest.fn(),
}}));
jest.mock("../../hooks/DepartmentService", () => ({__esModule: true, default: {
    getAll: jest.fn(),
}}));
jest.mock("../../hooks/OperatorConfigurationService", () => ({__esModule: true, default: {
    getCurrentShipmentConfiguration: jest.fn(),
}}));
jest.mock("../../hooks/ShipmentContentService", () => ({__esModule: true, default: {
    listNotes: jest.fn(), addNote: jest.fn(), listDocuments: jest.fn(),
    addDocument: jest.fn(), downloadDocument: jest.fn(),
}}));

const shipmentId = "6805406359141427429";
const person = {firstName: "Jan", lastName: "Test", email: "", telephoneNumber: "", city: "", postalCode: "", street: ""};
const shipment = {
    shipmentId: {value: shipmentId}, trackingNumber: {value: "MGR-10"},
    sender: person, recipient: person, shipmentPriority: "MEDIUM",
    destination: {value: "KT1"}, shipmentStatus: "CREATED", shipmentType: "PARENT",
    price: {amount: 15, currency: "PLN"}, locked: false,
};

const renderDetails = () => render(
    <MemoryRouter initialEntries={[`/shipments/${shipmentId}/edit`]}>
        <Routes>
            <Route path="/shipments/:shipmentId/edit" element={<ShipmentDetails />} />
        </Routes>
    </MemoryRouter>,
);

describe("Shipment details content", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (ShipmentService.getControlCenter as jest.Mock).mockResolvedValue({data: {shipment, routeLog: null, returnPackage: null}});
        (DeliveryService.getByShipmentId as jest.Mock).mockRejectedValue({status: 404});
        (DepartmentService.getAll as jest.Mock).mockResolvedValue({data: []});
        (OperatorConfigurationService.getCurrentShipmentConfiguration as jest.Mock).mockResolvedValue({data: {}});
        (ShipmentContentService.listNotes as jest.Mock).mockResolvedValue({data: []});
        (ShipmentContentService.listDocuments as jest.Mock).mockResolvedValue({data: []});
    });

    it("saves an internal note and shows it in the notes tab", async () => {
        const note = {
            noteId: "note-1", shipmentId, body: "Call recipient", internal: true,
            authorUserId: 7, createdAt: "2026-10-16T10:00:00Z",
        };
        (ShipmentContentService.addNote as jest.Mock).mockResolvedValue({data: note});
        renderDetails();

        const noteInput = await screen.findByLabelText(pl.shipments.dashboard.operatorNotes);
        await waitFor(() => expect(ShipmentContentService.listNotes).toHaveBeenCalledWith(shipmentId));
        expect(screen.getByRole("button", {name: pl.shipments.actions.addNote})).toBeDisabled();
        fireEvent.change(noteInput, {target: {value: note.body}});
        fireEvent.click(screen.getByLabelText(pl.shipments.dashboard.internalNote));
        fireEvent.click(screen.getByRole("button", {name: pl.shipments.actions.addNote}));

        await waitFor(() => expect(ShipmentContentService.addNote).toHaveBeenCalledWith(shipmentId, {
            body: note.body, internal: true,
        }));
        expect(await screen.findByText(note.body)).toBeInTheDocument();
        await waitFor(() => expect(screen.getByRole("tab", {name: new RegExp(pl.shipments.dashboard.workspace.notes)}))
            .toHaveAttribute("aria-selected", "true"));
    });

    it("uploads a document and lists it in the documents tab", async () => {
        const shipmentDocument = {
            documentId: "document-1", shipmentId, filename: "invoice.pdf",
            contentType: "application/pdf", sizeBytes: 3, uploadedByUserId: 7,
            createdAt: "2026-10-16T10:00:00Z",
        };
        (ShipmentContentService.addDocument as jest.Mock).mockResolvedValue({data: shipmentDocument});
        renderDetails();

        await waitFor(() => expect(ShipmentContentService.listDocuments).toHaveBeenCalledWith(shipmentId));
        const file = new File(["pdf"], shipmentDocument.filename, {type: "application/pdf"});
        fireEvent.change(screen.getByLabelText(pl.shipments.dashboard.addAttachment), {target: {files: [file]}});

        await waitFor(() => expect(ShipmentContentService.addDocument).toHaveBeenCalledWith(shipmentId, file));
        await waitFor(() => expect(screen.getByRole("tab", {name: new RegExp(pl.shipments.dashboard.workspace.documents)}))
            .toHaveAttribute("aria-selected", "true"));
        expect(screen.getAllByText(shipmentDocument.filename).length).toBeGreaterThan(0);
        fireEvent.click(screen.getAllByRole("button", {
            name: `${pl.shipments.dashboard.downloadAttachment}: ${shipmentDocument.filename}`,
        })[0]);
        await waitFor(() => expect(ShipmentContentService.downloadDocument)
            .toHaveBeenCalledWith(shipmentId, shipmentDocument));
    });
});
