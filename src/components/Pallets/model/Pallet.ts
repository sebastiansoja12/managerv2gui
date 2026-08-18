export type PalletStatusDto =
    | "CREATED"
    | "PREPARING"
    | "NOT_READY"
    | "READY"
    | "LOADED"
    | "IN_TRANSIT"
    | "DELIVERED"
    | "CANCELLED";

export type PalletLoadBlockReasonDto = "EMPTY" | "LOCKED" | "OVERWEIGHT" | "INVALID_STATUS";

export type PalletScanErrorCodeDto =
    | "PALLET_EMPTY"
    | "PALLET_LOCKED"
    | "PALLET_OVERWEIGHT"
    | "PALLET_INVALID_STATUS"
    | "SHIPMENT_STATUS_UPDATE_FAILED"
    | "PALLET_NOT_FOUND"
    | "PALLET_SERVICE_UNAVAILABLE"
    | "PALLET_INVALID_REQUEST";

export interface PalletDto {
    palletId: string;
    trackingNumber: string;
    palletStatus: PalletStatusDto;
    storageStatus?: string | null;
    shipmentIds: Array<string | number>;
    empty: boolean;
    loadable: boolean;
    loadBlockReason?: PalletLoadBlockReasonDto | null;
    grossWeight?: number | string | null;
    grossWeightUnit?: string | null;
    maxGrossWeight?: number | string | null;
    maxGrossWeightUnit?: string | null;
    originDepartmentId?: number | string | null;
    destinationDepartmentId?: number | string | null;
    sealNumber?: string | null;
    created?: string | null;
    modified?: string | null;
    palletType?: PalletTypeDto | null;
    handlingPriority?: PalletHandlingPriorityDto | null;
    refrigerated?: boolean | null;
    dimension?: PalletDimensionDto | null;
    carrier?: PalletCarrierDto | null;
}

export type PalletTypeDto = "PARENT" | "CHILD";
export type PalletHandlingPriorityDto = "LOW" | "HIGH" | "PREMIUM";
export const PALLET_TYPES: PalletTypeDto[] = ["PARENT", "CHILD"];
export const PALLET_PRIORITIES: PalletHandlingPriorityDto[] = ["LOW", "HIGH", "PREMIUM"];

export interface PalletDimensionDto {
    length: number;
    width: number;
    height: number;
}

export interface PalletUpdateRequestApi {
    palletType?: PalletTypeDto | null;
    handlingPriority?: PalletHandlingPriorityDto | null;
    refrigerated?: boolean | null;
    length?: number | null;
    width?: number | null;
    height?: number | null;
    sealNumber?: string | null;
}

export type TransportTypeDto = "OWN_FLEET" | "EXTERNAL_CARRIER" | "COURIER_SERVICE";

export const TRANSPORT_TYPES: TransportTypeDto[] = ["OWN_FLEET", "EXTERNAL_CARRIER", "COURIER_SERVICE"];

export interface PalletCarrierDto {
    carrierId: number | string;
    carrierName: string;
    transportType?: TransportTypeDto | null;
    driverId?: number | string | null;
    driverName?: string | null;
    driverPhone?: string | null;
    vehicleId?: number | string | null;
    vehicleRegistrationNumber?: string | null;
    trailerRegistrationNumber?: string | null;
    assignedAt?: string | null;
    assignedBy?: string | null;
}

export interface PalletCarrierRequestApi {
    carrierId: number | string;
    transportType?: TransportTypeDto | null;
    driverId?: number | string | null;
    driverName?: string | null;
    driverPhone?: string | null;
    vehicleId?: number | string | null;
    vehicleRegistrationNumber?: string | null;
    trailerRegistrationNumber?: string | null;
}

export type PalletManualStatusDto = "IN_TRANSIT" | "DELIVERED";

export type PalletDocumentKind = "label" | "transport";

export interface PalletDocumentFile {
    blob: Blob;
    filename: string;
}

export interface PalletPageDto {
    content: PalletDto[];
    page: number;
    size: number;
    totalElements: number;
}

export interface CreatePalletRequestApi {
    shipmentIds: string[];
}

export type PalletWeightUnitDto = "G" | "KG" | "T";

export interface PalletMaxWeightRequestApi {
    maxGrossWeight: number;
}

export type PalletHistoryEventTypeDto =
    | "CREATED"
    | "SHIPMENTS_ADDED"
    | "SHIPMENT_REMOVED"
    | "GROSS_WEIGHT_CHANGED"
    | "MAX_WEIGHT_SET"
    | "DEPARTMENTS_CHANGED"
    | "STATUS_CHANGED"
    | "LOADED"
    | "CANCELLED"
    | "UNKNOWN";

export interface PalletHistoryEntryDto {
    eventType: PalletHistoryEventTypeDto | string;
    palletStatus?: string | null;
    occurredAt?: string | null;
    userId?: number | string | null;
    username?: string | null;
    departmentId?: number | string | null;
    details?: string | null;
}

export interface PalletDepartmentsRequestApi {
    originDepartmentId: number | null;
    destinationDepartmentId: number | null;
}

export interface PalletScanRequestApi {
    trackingNumber: string;
}

export interface PalletScanShipmentResultDto {
    shipmentId: {value: string | number} | null;
    success: boolean;
    shipmentStatus?: string | null;
    errorMessage?: string | null;
}

export interface PalletScanResponseDto {
    palletId?: string | null;
    trackingNumber: string;
    palletStatus?: PalletStatusDto | null;
    success: boolean;
    alreadyLoaded: boolean;
    errorCode?: PalletScanErrorCodeDto | string | null;
    errorMessage?: string | null;
    shipments: PalletScanShipmentResultDto[];
}

export type PalletListVariant = "all" | "cancelled" | "empty";

export interface PalletSearchParams {
    variant: PalletListVariant;
    page: number;
    size: number;
}
