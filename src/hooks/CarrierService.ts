import BackendClient from "../api/BackendClient";
import http from "../http-common";
import {
    CarrierDto,
    CarrierField,
    CarrierRequestApi,
    CarrierVehicleRequestApi,
    VehicleField,
} from "../components/Carriers/model/Carrier";

const client = new BackendClient(http);

const path = (carrierId: number | string) => `/carriers/${encodeURIComponent(String(carrierId))}`;
const vehiclePath = (carrierId: number | string, vehicleId: number | string) =>
    `${path(carrierId)}/vehicles/${encodeURIComponent(String(vehicleId))}`;

const CarrierService = {
    findAll: (activeOnly = true) => client.get<CarrierDto[]>("/carriers", {params: {activeOnly}}),
    get: (carrierId: number | string) => client.get<CarrierDto>(path(carrierId)),
    create: (request: CarrierRequestApi) => client.post<CarrierRequestApi, CarrierDto>("/carriers", request),
    changeField: (carrierId: number | string, field: CarrierField, value: string | null) =>
        client.put<{value: string | null}, CarrierDto>(`${path(carrierId)}/${field}`, {value}),
    changeActive: (carrierId: number | string, active: boolean) =>
        client.put<{active: boolean}, CarrierDto>(`${path(carrierId)}/active`, {active}),
    addVehicle: (carrierId: number | string, request: CarrierVehicleRequestApi) =>
        client.post<CarrierVehicleRequestApi, CarrierDto>(`${path(carrierId)}/vehicles`, request),
    changeVehicleField: (carrierId: number | string, vehicleId: number | string, field: VehicleField, value: string | null) =>
        client.put<{value: string | null}, CarrierDto>(`${vehiclePath(carrierId, vehicleId)}/${field}`, {value}),
    changeVehicleActive: (carrierId: number | string, vehicleId: number | string, active: boolean) =>
        client.put<{active: boolean}, CarrierDto>(`${vehiclePath(carrierId, vehicleId)}/active`, {active}),
};

export default CarrierService;
