import {TrackingSessionDto} from "./model/FleetTracking";

export type SignalState = "fresh" | "stale" | "none";

export const STALE_SIGNAL_MINUTES = 5;

export const signalState = (session: TrackingSessionDto, now: Date): SignalState => {
    if (!session.lastPosition) {
        return "none";
    }
    const ageMinutes = (now.getTime() - Date.parse(session.lastPosition.recordedAt)) / 60_000;
    return ageMinutes > STALE_SIGNAL_MINUTES ? "stale" : "fresh";
};

export const signalAgeMinutes = (session: TrackingSessionDto, now: Date): number | null => session.lastPosition
    ? Math.max(0, Math.floor((now.getTime() - Date.parse(session.lastPosition.recordedAt)) / 60_000))
    : null;

export const speedKilometersPerHour = (session: TrackingSessionDto): number | null => {
    const speed = session.lastPosition?.speedMetersPerSecond;
    return speed === null || speed === undefined ? null : Math.round(speed * 3.6);
};

export const vehicleLabel = (session: TrackingSessionDto, registrationNumbers: Map<string, string>): string | null =>
    session.vehicleId ? registrationNumbers.get(String(session.vehicleId.value)) || String(session.vehicleId.value) : null;

export const sessionKey = (session: TrackingSessionDto) => String(session.trackingSessionId.value);
