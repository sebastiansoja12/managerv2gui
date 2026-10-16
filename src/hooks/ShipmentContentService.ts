import BackendClient from "../api/BackendClient";
import {CreateShipmentNote, ShipmentDocument, ShipmentNote} from "../components/Shipment/dto/ShipmentContentDto";
import http from "../http-common";

const client = new BackendClient(http);

const listNotes = (shipmentId: string) => client.get<ShipmentNote[]>(`/shipments/${shipmentId}/notes`);

const addNote = (shipmentId: string, note: CreateShipmentNote) =>
    client.post<CreateShipmentNote, ShipmentNote>(`/shipments/${shipmentId}/notes`, note);

const listDocuments = (shipmentId: string) => client.get<ShipmentDocument[]>(`/shipments/${shipmentId}/documents`);

const addDocument = (shipmentId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return client.post<FormData, ShipmentDocument>(`/shipments/${shipmentId}/documents`, formData, {
        headers: {"Content-Type": "multipart/form-data"},
    });
};

const downloadDocument = async (shipmentId: string, document: ShipmentDocument) => {
    const response = await http.get<Blob>(
        `/shipments/${shipmentId}/documents/${document.documentId}/download`,
        {responseType: "blob"},
    );
    const objectUrl = URL.createObjectURL(response.data);
    const link = window.document.createElement("a");
    link.href = objectUrl;
    link.download = document.filename;
    link.style.display = "none";
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
};

const ShipmentContentService = {listNotes, addNote, listDocuments, addDocument, downloadDocument};

export default ShipmentContentService;
