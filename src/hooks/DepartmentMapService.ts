import BackendClient from "../api/BackendClient";
import http from "../http-common";
import {
    CreateDepartmentMapRequest,
    DepartmentIdValue,
    DepartmentMapDto,
    DepartmentMapSummaryDto,
    PalletLocationDto,
    PalletMovementDto,
    ReserveLocationRequest,
    SaveDepartmentMapLayoutRequest,
    StorageLocationDto,
} from "../components/DepartmentMap/model/DepartmentMap";

const client = new BackendClient(http);

const mapPath = (mapId: string) => `/department-maps/${encodeURIComponent(mapId)}`;
const locationPath = (locationId: string) => `/department-maps/locations/${encodeURIComponent(locationId)}`;
const palletPath = (palletTrackingNumber: string) =>
    `/department-maps/pallets/${encodeURIComponent(palletTrackingNumber.trim())}`;

const DepartmentMapService = {
    findMaps: (departmentId: DepartmentIdValue) =>
        client.get<DepartmentMapSummaryDto[]>("/department-maps", {params: {departmentId: String(departmentId)}}),
    getMap: (mapId: string) => client.get<DepartmentMapDto>(mapPath(mapId)),
    createMap: (request: CreateDepartmentMapRequest) =>
        client.post<CreateDepartmentMapRequest, DepartmentMapDto>("/department-maps", request),
    saveLayout: (mapId: string, request: SaveDepartmentMapLayoutRequest) =>
        client.put<SaveDepartmentMapLayoutRequest, DepartmentMapDto>(mapPath(mapId), request),
    deleteMap: (mapId: string) => client.delete<undefined, void>(mapPath(mapId), undefined),
    placePallet: (locationId: string, palletTrackingNumber: string) =>
        client.post<{palletTrackingNumber: string}, PalletLocationDto>(`${locationPath(locationId)}/pallets`,
            {palletTrackingNumber: palletTrackingNumber.trim()}),
    movePallet: (palletTrackingNumber: string, targetLocationId: string) =>
        client.post<{targetLocationId: string}, PalletLocationDto>(`${palletPath(palletTrackingNumber)}/move`,
            {targetLocationId}),
    removePallet: (palletTrackingNumber: string) =>
        client.delete<undefined, void>(palletPath(palletTrackingNumber), undefined),
    reserveLocation: (locationId: string, request: ReserveLocationRequest) =>
        client.put<ReserveLocationRequest, StorageLocationDto>(`${locationPath(locationId)}/reservation`, request),
    cancelReservation: (locationId: string) =>
        client.delete<undefined, StorageLocationDto>(`${locationPath(locationId)}/reservation`, undefined),
    findPalletLocation: (palletTrackingNumber: string) => client.get<PalletLocationDto>(palletPath(palletTrackingNumber)),
    searchPallets: (query: string) =>
        client.get<PalletLocationDto[]>("/department-maps/pallets", {params: {query: query.trim()}}),
    palletHistory: (palletTrackingNumber: string) =>
        client.get<PalletMovementDto[]>(`${palletPath(palletTrackingNumber)}/history`),
};

export default DepartmentMapService;
