export type ShipmentNote = {
    noteId: string;
    shipmentId: string | number;
    body: string;
    internal: boolean;
    authorUserId: string | number;
    createdAt: string;
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
