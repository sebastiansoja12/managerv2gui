import BackendClient from "../api/BackendClient";
import http from "../http-public";
import {
    ShipmentEditAccepted,
    ShipmentEditDetails,
    ShipmentEditRequest,
    ShipmentEditSummary,
    ShipmentEditTokenIssued,
} from "../components/ShipmentEdit/dto/ShipmentEdit";
import {PostalCodeDto} from "../components/Shipment/dto/PostalCode";

const client = new BackendClient(http);

const shipmentPath = (trackingNumber: string) => `/reroutes/shipments/${encodeURIComponent(trackingNumber)}`;

const getShipment = (trackingNumber: string) => (
    client.get<ShipmentEditSummary>(shipmentPath(trackingNumber))
);

const requestToken = (trackingNumber: string) => (
    client.post<undefined, ShipmentEditTokenIssued>(`${shipmentPath(trackingNumber)}/tokens`, undefined)
);

const verifyToken = (trackingNumber: string, token: string) => (
    client.post<{token: string}, ShipmentEditDetails>(`${shipmentPath(trackingNumber)}/tokens/verifications`, {token})
);

const updateShipment = (trackingNumber: string, request: ShipmentEditRequest) => (
    client.put<ShipmentEditRequest, ShipmentEditAccepted>(shipmentPath(trackingNumber), request)
);

const searchPostalCodes = (query: string) => (
    client.get<PostalCodeDto[]>("/postal-codes", {params: {query}})
);

const ShipmentEditService = {
    getShipment,
    requestToken,
    verifyToken,
    updateShipment,
    searchPostalCodes,
};

export default ShipmentEditService;
