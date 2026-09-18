export const MAP_ELEMENT_TYPES = [
    "ROOM", "WALL", "AISLE", "ZONE", "RACK", "INBOUND", "INBOUND_RAMP", "WORKSTATION", "SORTER", "CHUTE", "RAMP",
    "STORAGE_LOCATION",
] as const;

export type MapElementType = typeof MAP_ELEMENT_TYPES[number];

export const DIRECTIONAL_ELEMENT_TYPES: MapElementType[] = ["CHUTE", "RAMP"];

export const isDirectionalType = (type: MapElementType) => DIRECTIONAL_ELEMENT_TYPES.includes(type);

export type LocationStatus = "FREE" | "PARTIALLY_OCCUPIED" | "OCCUPIED" | "RESERVED";

export type PalletMovementType = "PLACED" | "MOVED" | "REMOVED" | "RESERVED" | "RESERVATION_CANCELLED";

export type DepartmentIdValue = string;

export type MapElementDto = {
    elementId: string;
    type: MapElementType;
    label?: string | null;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    color?: string | null;
    locationCode?: string | null;
    capacity?: number | null;
    destinationDepartmentCode?: string | null;
};

export type DepartmentDirectionDto = {
    departmentId: number | string;
    departmentCode: string;
};

export type PalletPlacementDto = {
    palletTrackingNumber: string;
    placedByUserId?: number | string | null;
    placedAt: string;
};

export type LocationReservationDto = {
    palletTrackingNumber?: string | null;
    note?: string | null;
    reservedByUserId?: number | string | null;
    reservedAt: string;
};

export type StorageLocationDto = {
    locationId: string;
    mapId: string;
    code: string;
    capacity: number;
    status: LocationStatus;
    pallets: PalletPlacementDto[];
    reservation?: LocationReservationDto | null;
    version: number;
};

export type DepartmentMapDto = {
    mapId: string;
    departmentId: DepartmentIdValue;
    name: string;
    width: number;
    height: number;
    gridSize: number;
    version: number;
    createdAt: string;
    updatedAt: string;
    elements: MapElementDto[];
    locations: StorageLocationDto[];
    directions: DepartmentDirectionDto[];
};

export type DepartmentMapSummaryDto = {
    mapId: string;
    departmentId: DepartmentIdValue;
    name: string;
    width: number;
    height: number;
    version: number;
    updatedAt: string;
    locationCount: number;
    occupiedLocationCount: number;
    palletCount: number;
};

export type PalletLocationDto = {
    palletTrackingNumber: string;
    mapId: string;
    mapName: string;
    departmentId: DepartmentIdValue;
    locationId: string;
    locationCode: string;
    placedByUserId?: number | string | null;
    placedAt: string;
};

export type PalletMovementDto = {
    movementId: string;
    palletTrackingNumber: string;
    movementType: PalletMovementType;
    mapId: string;
    fromLocationId?: string | null;
    fromLocationCode?: string | null;
    toLocationId?: string | null;
    toLocationCode?: string | null;
    userId?: number | string | null;
    occurredAt: string;
};

export type CreateDepartmentMapRequest = {
    departmentId: DepartmentIdValue;
    name: string;
    width: number;
    height: number;
    gridSize: number;
};

export type DepartmentMapLayout = {
    name: string;
    width: number;
    height: number;
    gridSize: number;
    elements: MapElementDto[];
};

export type SaveDepartmentMapLayoutRequest = DepartmentMapLayout & {
    version: number;
};

export type ReserveLocationRequest = {
    palletTrackingNumber?: string | null;
    note?: string | null;
};
