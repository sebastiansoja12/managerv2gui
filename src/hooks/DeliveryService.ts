import {QueryParams} from "../api/ApiResult";
import BackendClient from "../api/BackendClient";
import {
    Delivery,
    DeliveryCarrierRequest,
    DeliveryConditionsRequest,
    DeliveryHistoryEntry,
    DeliveryListPage,
    DeliveryQueryFilter,
    DeliveryRelation,
    DeliveryRouteRequest,
} from "../components/Deliveries/model/Delivery";
import http from "../http-common";

const client = new BackendClient(http);

const queryParams = (page: number, size: number, filter: DeliveryQueryFilter): QueryParams => {
    const params: QueryParams = {page, size};
    Object.entries(filter).forEach(([name, value]) => {
        if (Array.isArray(value)) {
            if (value.length) {
                params[name] = value.join(",");
            }
        } else if (value !== undefined && value !== "" && value !== false) {
            params[name] = value;
        }
    });
    return params;
};

const query = (page: number, size: number, filter: DeliveryQueryFilter = {}) =>
    client.get<DeliveryListPage>("/deliveries/query", {params: queryParams(page, size, filter)});

const getByDepartment = (departmentId: number | string, offset: number, limit: number) =>
    client.get<Delivery[]>("/deliveries", {params: {offset, limit, departmentId}});

const get = (deliveryId: string) => client.get<Delivery>(`/deliveries/${encodeURIComponent(deliveryId)}`);

const getByShipmentId = (shipmentId: string) =>
    client.get<Delivery>(`/deliveries/by-shipment/${encodeURIComponent(shipmentId)}`);

const getByPalletId = (palletId: string) =>
    client.get<Delivery>(`/deliveries/by-pallet/${encodeURIComponent(palletId)}`);

const deliveryPath = (deliveryId: string) => `/deliveries/${encodeURIComponent(deliveryId)}`;

const stepPath = (deliveryId: string, stepNumber: number) => `${deliveryPath(deliveryId)}/steps/${stepNumber}`;

const getRelated = (deliveryId: string) => client.get<DeliveryRelation[]>(`${deliveryPath(deliveryId)}/related`);

const getHistory = (deliveryId: string) =>
    client.get<DeliveryHistoryEntry[]>(`${deliveryPath(deliveryId)}/history`);

const assignSupplier = (deliveryId: string, request: DeliveryCarrierRequest) =>
    client.put<DeliveryCarrierRequest, Delivery>(`${deliveryPath(deliveryId)}/supplier`, request);

const unassignSupplier = (deliveryId: string) =>
    client.delete<undefined, Delivery>(`${deliveryPath(deliveryId)}/supplier`, undefined);

const changeRoute = (deliveryId: string, request: DeliveryRouteRequest) =>
    client.put<DeliveryRouteRequest, Delivery>(`${deliveryPath(deliveryId)}/route`, request);

const changeConditions = (deliveryId: string, request: DeliveryConditionsRequest) =>
    client.put<DeliveryConditionsRequest, Delivery>(`${deliveryPath(deliveryId)}/conditions`, request);

const registerAttempt = (deliveryId: string, deliveryStatus: string, comment: string | null) =>
    client.post<{deliveryStatus: string; comment: string | null}, Delivery>(`${deliveryPath(deliveryId)}/attempts`,
        {deliveryStatus, comment});

const complete = (deliveryId: string) =>
    client.post<Record<string, never>, Delivery>(`${deliveryPath(deliveryId)}/complete`, {});

const commentStep = (deliveryId: string, stepNumber: number, comment: string | null) =>
    client.put<{comment: string | null}, Delivery>(`${stepPath(deliveryId, stepNumber)}/comment`, {comment});

const correctStepStatus = (deliveryId: string, stepNumber: number, deliveryStatus: string) =>
    client.put<{deliveryStatus: string}, Delivery>(`${stepPath(deliveryId, stepNumber)}/status`, {deliveryStatus});

const attachStepSignature = (deliveryId: string, stepNumber: number, signatureId: string) =>
    client.put<{signatureId: string}, Delivery>(`${stepPath(deliveryId, stepNumber)}/signature`, {signatureId});

const reassignStepCarrier = (deliveryId: string, stepNumber: number, request: DeliveryCarrierRequest) =>
    client.put<DeliveryCarrierRequest, Delivery>(`${stepPath(deliveryId, stepNumber)}/carrier`, request);

const cancel = (deliveryId: string) =>
    client.post<Record<string, never>, void>(`/deliveries/${encodeURIComponent(deliveryId)}/cancel`, {});

const DeliveryService = {
    query,
    getByDepartment,
    get,
    getByShipmentId,
    getByPalletId,
    getRelated,
    getHistory,
    assignSupplier,
    unassignSupplier,
    changeRoute,
    changeConditions,
    registerAttempt,
    complete,
    commentStep,
    correctStepStatus,
    attachStepSignature,
    reassignStepCarrier,
    cancel,
};

export default DeliveryService;
