import BackendClient from "../api/BackendClient";
import http from "../http-common";
import {DriverDto, DriverField, DriverRequestApi} from "../components/Carriers/model/Carrier";

const client = new BackendClient(http);

const path = (driverId: number | string) => `/drivers/${encodeURIComponent(String(driverId))}`;

const DriverService = {
    findAll: (activeOnly = false) => client.get<DriverDto[]>("/drivers", {params: {activeOnly}}),
    get: (driverId: number | string) => client.get<DriverDto>(path(driverId)),
    create: (request: DriverRequestApi) => client.post<DriverRequestApi, DriverDto>("/drivers", request),
    changeField: (driverId: number | string, field: DriverField, value: string | null) =>
        client.put<{value: string | null}, DriverDto>(`${path(driverId)}/${field}`, {value}),
    changeActive: (driverId: number | string, active: boolean) =>
        client.put<{active: boolean}, DriverDto>(`${path(driverId)}/active`, {active}),
};

export default DriverService;
