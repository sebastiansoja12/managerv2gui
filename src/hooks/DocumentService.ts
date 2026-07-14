import {AxiosResponse} from "axios";
import http from "../http-common";

type ShipmentDocument = "qr" | "excel";

export type ShipmentDocumentFile = {
    blob: Blob;
    filename: string;
};

const documentConfig: Record<ShipmentDocument, {endpoint: string; fallbackExtension: string}> = {
    qr: {endpoint: "/qrcodes", fallbackExtension: "pdf"},
    excel: {endpoint: "/csv", fallbackExtension: "csv"},
};

const filenameFromDisposition = (contentDisposition?: string) => {
    if (!contentDisposition) {
        return undefined;
    }

    const encodedFilename = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    if (encodedFilename) {
        try {
            return decodeURIComponent(encodedFilename.replace(/^"|"$/g, ""));
        } catch {
            return encodedFilename.replace(/^"|"$/g, "");
        }
    }

    return contentDisposition.match(/filename\s*=\s*"?([^";]+)"?/i)?.[1]?.trim();
};

const responseToFile = (response: AxiosResponse<Blob>, fallbackFilename: string): ShipmentDocumentFile => ({
    blob: response.data,
    filename: filenameFromDisposition(response.headers["content-disposition"]) || fallbackFilename,
});

const saveFile = ({blob, filename}: ShipmentDocumentFile) => {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
};

const getShipmentDocument = async (shipmentId: string, documentType: ShipmentDocument) => {
    const {endpoint, fallbackExtension} = documentConfig[documentType];
    const response = await http.get<Blob>(`${endpoint}/${shipmentId}`, {responseType: "blob"});
    if (documentType === "qr" && response.data.type !== "application/pdf") {
        response.data = new Blob([response.data], {type: "application/pdf"});
    }
    return responseToFile(response, `shipment-${shipmentId}.${fallbackExtension}`);
};

const downloadShipmentDocument = async (shipmentId: string, documentType: ShipmentDocument) => {
    saveFile(await getShipmentDocument(shipmentId, documentType));
};

const DocumentService = {
    getQrLabel: (shipmentId: string) => getShipmentDocument(shipmentId, "qr"),
    downloadQrLabel: (shipmentId: string) => downloadShipmentDocument(shipmentId, "qr"),
    exportToExcel: (shipmentId: string) => downloadShipmentDocument(shipmentId, "excel"),
};

export default DocumentService;
