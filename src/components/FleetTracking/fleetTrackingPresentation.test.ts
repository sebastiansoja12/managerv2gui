import {TrackingSessionDto} from "./model/FleetTracking";
import {signalAgeMinutes, signalState, speedKilometersPerHour, vehicleLabel} from "./fleetTrackingPresentation";

const NOW = new Date("2026-11-05T08:10:00Z");

const session = (recordedAt: string | null, vehicleId: string | null = "6047483447382963523"): TrackingSessionDto => ({
    trackingSessionId: {value: "1"},
    driverUserId: {value: "2"},
    driverUsername: "driver",
    deviceId: "MB:1",
    vehicleId: vehicleId ? {value: vehicleId} : null,
    departmentCode: "KT1",
    status: "ACTIVE",
    startedAt: "2026-11-05T07:00:00Z",
    finishedAt: null,
    lastPosition: recordedAt ? {
        sequence: 1, latitude: 52.2, longitude: 21.0, accuracyMeters: 8, speedMetersPerSecond: 12.5,
        headingDegrees: null, recordedAt,
    } : null,
});

describe("fleetTrackingPresentation", () => {
    it("classifies the signal by the age of the last position", () => {
        expect(signalState(session("2026-11-05T08:08:00Z"), NOW)).toBe("fresh");
        expect(signalState(session("2026-11-05T08:00:00Z"), NOW)).toBe("stale");
        expect(signalState(session(null), NOW)).toBe("none");
        expect(signalAgeMinutes(session("2026-11-05T08:00:00Z"), NOW)).toBe(10);
    });

    it("converts speed to km/h", () => {
        expect(speedKilometersPerHour(session("2026-11-05T08:08:00Z"))).toBe(45);
    });

    it("prefers the registration number over the vehicle id", () => {
        const registrations = new Map([["6047483447382963523", "SK 12345"]]);
        expect(vehicleLabel(session(null), registrations)).toBe("SK 12345");
        expect(vehicleLabel(session(null, "7"), registrations)).toBe("7");
        expect(vehicleLabel(session(null, null), registrations)).toBeNull();
    });
});
