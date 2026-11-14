export type TrackingSessionStatus = "ACTIVE" | "FINISHED";

export type PositionFixDto = {
    sequence: number;
    latitude: number;
    longitude: number;
    accuracyMeters: number | null;
    speedMetersPerSecond: number | null;
    headingDegrees: number | null;
    recordedAt: string;
};

export type TrackingSessionDto = {
    trackingSessionId: {value: number | string};
    driverUserId: {value: number | string};
    driverUsername: string | null;
    deviceId: string;
    vehicleId: {value: number | string} | null;
    departmentCode: string | null;
    status: TrackingSessionStatus;
    startedAt: string;
    finishedAt: string | null;
    lastPosition: PositionFixDto | null;
};
