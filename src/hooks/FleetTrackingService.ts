import BackendClient from "../api/BackendClient";
import {PositionFixDto, TrackingSessionDto} from "../components/FleetTracking/model/FleetTracking";
import http from "../http-common";

const client = new BackendClient(http);

const FleetTrackingService = {
    activeSessions: () => client.get<TrackingSessionDto[]>("/fleet-tracking/sessions/active"),
    route: (trackingSessionId: number | string) =>
        client.get<PositionFixDto[]>(`/fleet-tracking/sessions/${encodeURIComponent(String(trackingSessionId))}/positions`),
};

export default FleetTrackingService;
