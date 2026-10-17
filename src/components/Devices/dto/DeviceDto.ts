export type WrappedStringDto = {
    value: string;
};

export type WrappedNumberDto = {
    value: number;
};

export type OperatorIdDto = {
    value: number;
};

export type DeviceDto = {
    deviceId: WrappedStringDto | null;
    version: WrappedStringDto | null;
    deviceType: string | null;
    username: WrappedStringDto | null;
    depotCode: WrappedStringDto | null;
    lastUpdate: string | null;
    active: boolean | null;
};

export type CurrentUserDevicePairRequest = {
    externalSystemId: string;
    departmentCode: WrappedStringDto | null;
};

export type DevicePairResponseDto = {
    userId: (WrappedNumberDto & { operatorId?: number | null }) | null;
    deviceId: WrappedStringDto | null;
    devicePairId: WrappedNumberDto | null;
    pairStatus: string | null;
    pairKey: string | null;
    userValid: boolean | null;
    deviceValid: boolean | null;
    deviceUpToDate: boolean | null;
    operatorId?: OperatorIdDto | null;
};

export type DeviceTypeDto = "SCANNER" | "MOBILE" | "TERMINAL";

export type DeviceUserTypeDto = "SUPPLIER" | "OPERATOR";

export type ScanTypeDto = "BARCODE" | "QRCODE";

export type ScannerTypeDto = "HANDHELD" | "WRIST_WORN" | "RING" | "GLOVE" | "FIXED" | "VEHICLE";

export const deviceTypes: DeviceTypeDto[] = ["SCANNER", "MOBILE", "TERMINAL"];

export const deviceUserTypes: DeviceUserTypeDto[] = ["SUPPLIER", "OPERATOR"];

export const scanTypes: ScanTypeDto[] = ["BARCODE", "QRCODE"];

export const scannerTypes: ScannerTypeDto[] = ["HANDHELD", "WRIST_WORN", "RING", "GLOVE", "FIXED", "VEHICLE"];

export type DeviceCreateRequest = {
    userId: WrappedNumberDto;
    departmentCode: WrappedStringDto;
    version: WrappedStringDto | null;
    deviceUserType: DeviceUserTypeDto;
    deviceType: DeviceTypeDto;
    scanType: ScanTypeDto | null;
    scannerType: ScannerTypeDto | null;
    identity: {
        externalSystemId: string;
        serialNumber: string | null;
    };
    hardware: {
        manufacturer: string | null;
        model: string | null;
    };
    software: {
        appVersion: string | null;
    };
    network: Record<string, never>;
    security: Record<string, never>;
    location: Record<string, never>;
};
