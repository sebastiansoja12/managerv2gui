import BackendClient from "../api/BackendClient";
import {Delivery} from "../components/Deliveries/model/Delivery";
import http from "../http-common";

const client = new BackendClient(http);

const getRecent = (offset: number, limit: number) =>
    client.get<Delivery[]>("/deliveries", {params: {offset, limit}});

const get = (deliveryId: string) => client.get<Delivery>(`/deliveries/${encodeURIComponent(deliveryId)}`);

const getByShipmentId = (shipmentId: string) =>
    client.get<Delivery>(`/deliveries/by-shipment/${encodeURIComponent(shipmentId)}`);

const changeMethod = (deliveryId: string, method: string) =>
    client.put<{method: string}, Delivery>(`/deliveries/${encodeURIComponent(deliveryId)}/method`, {method});

const cancel = (deliveryId: string) =>
    client.post<Record<string, never>, void>(`/deliveries/${encodeURIComponent(deliveryId)}/cancel`, {});

const DeliveryService = {getRecent, get, getByShipmentId, changeMethod, cancel};

export default DeliveryService;
