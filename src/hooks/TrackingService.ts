import BackendClient from "../api/BackendClient";
import http from "../http-common";
import {
    ExternalTrackingResult,
    TrackingIntegration,
    TrackingIntegrationRequest,
    TrackingProvider,
    TrackingProviderId,
} from "../components/GlobalConfiguration/model/TrackingIntegration";

const client = new BackendClient(http);

const getAvailableProviders = () => client.get<TrackingProvider[]>("/tracking/providers");

const search = (provider: TrackingProviderId, trackingNumbers: string[]) => (
    client.post<{provider: TrackingProviderId; trackingNumbers: string[]}, ExternalTrackingResult[]>(
        "/tracking/search",
        {provider, trackingNumbers},
    )
);

const getIntegrations = () => client.get<TrackingIntegration[]>("/tracking/integrations");

const saveIntegration = (provider: TrackingProviderId, request: TrackingIntegrationRequest) => (
    client.put<TrackingIntegrationRequest, void>(`/tracking/integrations/${provider}`, request)
);

const testIntegration = (provider: TrackingProviderId, request: TrackingIntegrationRequest) => (
    client.post<TrackingIntegrationRequest, void>(`/tracking/integrations/${provider}/test`, request)
);

const TrackingService = {
    getAvailableProviders,
    getIntegrations,
    saveIntegration,
    search,
    testIntegration,
};

export default TrackingService;
