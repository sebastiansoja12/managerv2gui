export type ShipmentIncidentNoteType = "REPORTED" | "COMMENTED" | "RESOLVED" | "REOPENED";

export type ShipmentNote = {
    noteId: string;
    shipmentId: string | number;
    body: string | null;
    internal: boolean;
    authorUserId: string | number;
    authorUsername?: string | null;
    createdAt: string;
    incidentId?: string | number | null;
    incidentNoteType?: ShipmentIncidentNoteType | null;
    incidentReason?: string | null;
};

export type ShipmentDocument = {
    documentId: string;
    shipmentId: string | number;
    filename: string;
    contentType: string;
    sizeBytes: number;
    uploadedByUserId: string | number;
    createdAt: string;
};

export type CreateShipmentNote = {
    body: string;
    internal: boolean;
};
