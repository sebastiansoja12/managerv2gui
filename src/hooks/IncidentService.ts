import BackendClient from "../api/BackendClient";
import {
    IncidentDto,
    IncidentFilters,
    IncidentIdDto,
    IncidentPageDto,
    IncidentStatisticsDto,
    ReportIncidentRequest,
    ResolveIncidentRequest,
} from "../components/Incidents/model/Incident";
import http from "../http-common";

const client = new BackendClient(http);

const path = (incidentId: number | string) => `/incidents/${encodeURIComponent(String(incidentId))}`;

const IncidentService = {
    find: (filters: IncidentFilters, page = 0, size = 20) => client.get<IncidentPageDto>("/incidents", {
        params: {
            status: filters.status || undefined,
            severity: filters.severity || undefined,
            category: filters.category || undefined,
            assignedToMe: filters.assignedToMe,
            page,
            size,
        },
    }),
    statistics: () => client.get<IncidentStatisticsDto>("/incidents/statistics"),
    get: (incidentId: number | string) => client.get<IncidentDto>(path(incidentId)),
    report: (request: ReportIncidentRequest) => client.post<ReportIncidentRequest, IncidentIdDto>("/incidents", request),
    assignToMe: (incidentId: number | string) => client.post<undefined, void>(`${path(incidentId)}/assign`, undefined),
    resolve: (incidentId: number | string, request: ResolveIncidentRequest) =>
        client.post<ResolveIncidentRequest, void>(`${path(incidentId)}/resolve`, request),
    comment: (incidentId: number | string, text: string) =>
        client.post<{text: string}, void>(`${path(incidentId)}/comments`, {text}),
    reopen: (incidentId: number | string, reason: string) =>
        client.post<{reason: string}, void>(`${path(incidentId)}/reopen`, {reason}),
};

export default IncidentService;
