export type CollectDeviceInformation = {
    version: string;
    deviceId: string;
    responsibleUser: string;
    departmentCode: string;
    pairKey: string;
    deviceUserType: "MANAGER" | "SUPPLIER";
    deviceType: string;
};

export type CollectRequest = {
    deviceInformation: CollectDeviceInformation;
    trackingNumbers: string[];
};

export type CollectResponseDetail = {
    trackingNumber: string;
    shipmentId: string | null;
    success: boolean;
    errorMessage: string | null;
};

export type CollectResponse = {
    processId: string;
    success: boolean;
    details: CollectResponseDetail[];
};

export type PendingShipment = {
    trackingNumber: string;
    scannedAt: string;
};
