import {ApiErrorResponse} from "../../api/ApiResult";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "../AppShell/types";
import {IncidentDto, IncidentSeverity, IncidentStatus} from "./model/Incident";

export const severityColor = (severity: IncidentSeverity) => (
    severity === "CRITICAL" ? "error" : severity === "MEDIUM" ? "warning" : "default"
);

export const statusColor = (status: IncidentStatus) => (
    status === "RESOLVED" ? "success" : status === "IN_PROGRESS" ? "primary" : "warning"
);

export const incidentErrorMessage = (error: unknown, fallback: string) => (
    (error as ApiErrorResponse | undefined)?.status === 409 ? pl.incidents.list.conflict : fallback
);

export const formatIncidentDateTime = (value: string) => new Date(value).toLocaleString(pl.common.locale, {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
});

export const formatIncidentAge = (incident: IncidentDto, now: number) => {
    const end = incident.resolvedAt ? new Date(incident.resolvedAt).getTime() : now;
    const hours = Math.max(0, Math.floor((end - new Date(incident.reportedAt).getTime()) / 3_600_000));
    return hours < 48
        ? pl.incidents.list.ageHours.replace("{hours}", String(hours))
        : pl.incidents.list.ageDays.replace("{days}", String(Math.floor(hours / 24)));
};

export const incidentDetailsTab = (incidentId: string): AppTabDefinition => ({
    label: `${pl.incidents.details.tabTitle} #${incidentId}`,
    path: `/incidents/${encodeURIComponent(incidentId)}`,
});

export const incidentShipmentTab = (incident: IncidentDto): AppTabDefinition => ({
    label: pl.home.trackingLookup.detailsByIdTabLabel.replace("{shipmentId}", incident.shipmentId.value),
    path: `/shipments/${encodeURIComponent(incident.shipmentId.value)}/edit`,
});
