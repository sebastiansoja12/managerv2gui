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
};

export type CurrentUserDevicePairRequest = {
    externalSystemId: string;
    departmentCode: WrappedStringDto | null;
};

export type DevicePairResponseDto = {
    userId: WrappedNumberDto | null;
    deviceId: WrappedStringDto | null;
    devicePairId: WrappedNumberDto | null;
    pairStatus: string | null;
    pairKey: string | null;
    userValid: boolean | null;
    deviceValid: boolean | null;
    deviceUpToDate: boolean | null;
};
