export type WrappedStringDto = {
    value: string;
};

export type WrappedNumberDto = {
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
    assignmentMode?: DeviceAssignmentModeDto | null;
};

export type DeviceAssignmentModeDto = "PERSONAL" | "SHARED";

export const deviceAssignmentModes: DeviceAssignmentModeDto[] = ["PERSONAL", "SHARED"];

export type DeviceActivationCodeResponseDto = {
    activationCode: string;
    expiresAt: string;
};

export type DeviceOwnershipUpdateRequest = {
    assignmentMode: DeviceAssignmentModeDto;
};

export const DEVICE_ACTIVATION_QR_TYPE = "MANAGER_DEVICE_ACTIVATION";

export type DeviceActivationRequest = {
    activationCode: string;
    installationId?: string | null;
    deviceType?: DeviceTypeDto | null;
    appVersion?: string | null;
};

export type DeviceActivationResponseDto = {
    device: DeviceDto;
    pairKey: string;
    pairKeyExpiresAt: string;
};

export type DeviceOperatorSessionResponseDto = {
    device: DeviceDto;
    sessionExpiresAt: string;
};

export type DeviceHeartbeatRequest = {
    version: string;
    manufacturer: string | null;
    model: string | null;
    osName: string | null;
    osVersion: string | null;
};

export type DeviceHeartbeatResponseDto = {
    updateRequired: boolean | null;
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
