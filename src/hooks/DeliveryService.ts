import BackendClient from "../api/BackendClient";
import {Delivery} from "../components/Deliveries/model/Delivery";
import http from "../http-common";

const client = new BackendClient(http);

const getRecent = (offset: number, limit: number) =>
    client.get<Delivery[]>("/deliveries", {params: {offset, limit}});

const getByDepartment = (departmentId: number | string, offset: number, limit: number) =>
    client.get<Delivery[]>("/deliveries", {params: {offset, limit, departmentId}});

const get = (deliveryId: string) => client.get<Delivery>(`/deliveries/${encodeURIComponent(deliveryId)}`);

const getByShipmentId = (shipmentId: string) =>
    client.get<Delivery>(`/deliveries/by-shipment/${encodeURIComponent(shipmentId)}`);

const getByPalletId = (palletId: string) =>
    client.get<Delivery>(`/deliveries/by-pallet/${encodeURIComponent(palletId)}`);

const changeMethod = (deliveryId: string, method: string) =>
    client.put<{method: string}, Delivery>(`/deliveries/${encodeURIComponent(deliveryId)}/method`, {method});

const cancel = (deliveryId: string) =>
    client.post<Record<string, never>, void>(`/deliveries/${encodeURIComponent(deliveryId)}/cancel`, {});

const DeliveryService = {getRecent, getByDepartment, get, getByShipmentId, getByPalletId, changeMethod, cancel};

export default DeliveryService;
