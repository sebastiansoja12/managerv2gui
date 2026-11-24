import {PackagingTypeDto} from "../../Shipment/dto/ShipmentDto";

export const INCIDENT_CATEGORIES = ["DAMAGED", "MISSING", "INVALID_ADDRESS", "LABEL_ISSUE", "WEIGHT_MISMATCH", "MISSING_DOCUMENTS", "OTHER"] as const;
export const INCIDENT_SEVERITIES = ["LOW", "MEDIUM", "CRITICAL"] as const;
export const INCIDENT_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;
export const INCIDENT_RESOLUTIONS = [
    "EXPLAINED", "DATA_CORRECTED", "DUPLICATE", "INVALID_REPORT", "CANCELED",
    "REPACKED", "COSMETIC_DAMAGE_ACCEPTED", "DESTROYED_DISPOSED", "REFUSED_BY_RECIPIENT", "DAMAGE_CLAIM_FILED",
    "FOUND", "MISSORTED_REDIRECTED", "DELIVERED_WITHOUT_SCAN", "STOLEN", "WRITTEN_OFF",
    "ADDRESS_CORRECTED", "ADDRESS_OBTAINED", "REDIRECTED_TO_PICKUP_POINT", "RETURN_CREATED",
    "LABEL_REPRINTED", "MANUALLY_LABELED", "WEIGHT_CORRECTED", "WEIGHT_CORRECTED_SURCHARGE",
    "DOCUMENTS_RECEIVED", "DOCUMENTS_REGENERATED", "REROUTED",
] as const;

export type IncidentCategory = typeof INCIDENT_CATEGORIES[number];
export type IncidentSeverity = typeof INCIDENT_SEVERITIES[number];
export type IncidentStatus = typeof INCIDENT_STATUSES[number];
export type IncidentResolution = typeof INCIDENT_RESOLUTIONS[number];
export type IncidentEntryType = "REPORTED" | "ASSIGNED" | "COMMENTED" | "RESOLVED" | "REOPENED";

export type IncidentIdDto = {value: string};
export type ShipmentIdDto = {value: string};

export type IncidentActorDto = {
    userId: {value: number | string};
    username: string | null;
};

export type IncidentEntryDto = {
    type: IncidentEntryType;
    actor: IncidentActorDto;
    text: string | null;
    occurredAt: string;
};

export type IncidentDto = {
    incidentId: IncidentIdDto;
    shipmentId: ShipmentIdDto;
    trackingNumber: string | null;
    departmentCode: string | null;
    category: IncidentCategory;
    severity: IncidentSeverity;
    status: IncidentStatus;
    description: string | null;
    reporter: IncidentActorDto;
    assignee: IncidentActorDto | null;
    resolution: IncidentResolution | null;
    reportedAt: string;
    resolvedAt: string | null;
    updatedAt: string;
    entries: IncidentEntryDto[];
};

export type IncidentPageDto = {
    incidents: IncidentDto[];
    page: number;
    size: number;
    totalElements: number;
};

export type IncidentStatisticsDto = {
    open: number;
    critical: number;
    overdue: number;
    resolvedToday: number;
};

export type IncidentFilters = {
    status: IncidentStatus | "";
    severity: IncidentSeverity | "";
    category: IncidentCategory | "";
    assignedToMe: boolean;
};

export type ReportIncidentRequest = {
    shipmentId: ShipmentIdDto;
    category: IncidentCategory;
    severity: IncidentSeverity;
    description: string | null;
};

export type RepackagingRequest = {
    packagingType: PackagingTypeDto | null;
    weightInKilograms: number | null;
    lengthInCentimeters: number | null;
    widthInCentimeters: number | null;
    heightInCentimeters: number | null;
};

export type ResolveIncidentRequest = {
    resolution: IncidentResolution;
    note: string | null;
    repackaging?: RepackagingRequest | null;
};
