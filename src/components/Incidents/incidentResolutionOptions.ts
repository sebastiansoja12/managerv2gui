import {ShipmentStatusDto} from "../Shipment/dto/ShipmentDto";
import {IncidentCategory, IncidentResolution} from "./model/Incident";

export const INCIDENT_RESOLUTION_GROUPS = [
    "GENERAL",
    "DAMAGED",
    "MISSING",
    "INVALID_ADDRESS",
    "LABEL_ISSUE",
    "WEIGHT_MISMATCH",
    "MISSING_DOCUMENTS",
] as const;

export type IncidentResolutionGroup = typeof INCIDENT_RESOLUTION_GROUPS[number];

export type IncidentResolutionOption = {
    resolution: IncidentResolution;
    group: IncidentResolutionGroup;
    recommended: boolean;
    noteRequired: boolean;
    irreversible: boolean;
    shipmentAction: boolean;
    opensShipment: boolean;
    repackaging: boolean;
};

type ResolutionRule = Omit<IncidentResolutionOption, "recommended"> & {
    allowedStatuses: ShipmentStatusDto[] | "ALL";
};

const NOT_FINISHED: ShipmentStatusDto[] = ["PLANNED", "CREATED", "PREPARED", "COLLECTED", "ACCEPTED", "REROUTE", "SENT", "HANDOVER", "UNDELIVERABLE", "REDIRECT"];
const LOSABLE: ShipmentStatusDto[] = [...NOT_FINISHED, "RETURN"];
const RETURNABLE: ShipmentStatusDto[] = ["COLLECTED", "ACCEPTED", "SENT", "HANDOVER", "UNDELIVERABLE", "DELIVERY"];
const IN_TRANSIT: ShipmentStatusDto[] = ["COLLECTED", "ACCEPTED", "SENT", "HANDOVER", "UNDELIVERABLE", "REROUTE", "REDIRECT"];

const recordOnly = (resolution: IncidentResolution, group: IncidentResolutionGroup, noteRequired: boolean): ResolutionRule => ({
    resolution, group, noteRequired, irreversible: false, shipmentAction: false, opensShipment: false, repackaging: false,
    allowedStatuses: "ALL",
});

const correction = (resolution: IncidentResolution, group: IncidentResolutionGroup, noteRequired = false): ResolutionRule => ({
    resolution, group, noteRequired, irreversible: false, shipmentAction: false, opensShipment: true, repackaging: false,
    allowedStatuses: NOT_FINISHED,
});

const shipmentChange = (resolution: IncidentResolution, group: IncidentResolutionGroup, noteRequired: boolean,
                        allowedStatuses: ShipmentStatusDto[]): ResolutionRule => ({
    resolution, group, noteRequired, irreversible: true, shipmentAction: true, opensShipment: false, repackaging: false,
    allowedStatuses,
});

const RESOLUTION_RULES: ResolutionRule[] = [
    recordOnly("EXPLAINED", "GENERAL", true),
    correction("DATA_CORRECTED", "GENERAL"),
    recordOnly("DUPLICATE", "GENERAL", false),
    recordOnly("INVALID_REPORT", "GENERAL", true),
    shipmentChange("CANCELED", "GENERAL", true, NOT_FINISHED),

    {
        resolution: "REPACKED", group: "DAMAGED", noteRequired: true, irreversible: false, shipmentAction: true,
        opensShipment: false, repackaging: true, allowedStatuses: NOT_FINISHED,
    },
    recordOnly("COSMETIC_DAMAGE_ACCEPTED", "DAMAGED", false),
    shipmentChange("DESTROYED_DISPOSED", "DAMAGED", true, LOSABLE),
    shipmentChange("REFUSED_BY_RECIPIENT", "DAMAGED", false, RETURNABLE),
    recordOnly("DAMAGE_CLAIM_FILED", "DAMAGED", true),

    recordOnly("FOUND", "MISSING", false),
    recordOnly("MISSORTED_REDIRECTED", "MISSING", false),
    shipmentChange("DELIVERED_WITHOUT_SCAN", "MISSING", true, IN_TRANSIT),
    shipmentChange("STOLEN", "MISSING", true, LOSABLE),
    shipmentChange("WRITTEN_OFF", "MISSING", true, LOSABLE),

    correction("ADDRESS_CORRECTED", "INVALID_ADDRESS"),
    correction("ADDRESS_OBTAINED", "INVALID_ADDRESS"),
    correction("REDIRECTED_TO_PICKUP_POINT", "INVALID_ADDRESS"),
    shipmentChange("RETURN_CREATED", "INVALID_ADDRESS", false, RETURNABLE),

    correction("LABEL_REPRINTED", "LABEL_ISSUE"),
    recordOnly("MANUALLY_LABELED", "LABEL_ISSUE", false),

    correction("WEIGHT_CORRECTED", "WEIGHT_MISMATCH"),
    correction("WEIGHT_CORRECTED_SURCHARGE", "WEIGHT_MISMATCH", true),

    recordOnly("DOCUMENTS_RECEIVED", "MISSING_DOCUMENTS", false),
    recordOnly("DOCUMENTS_REGENERATED", "MISSING_DOCUMENTS", false),
];

export const availableResolutionOptions = (category: IncidentCategory,
                                           shipmentStatus: ShipmentStatusDto | null): IncidentResolutionOption[] =>
    RESOLUTION_RULES
        .filter((rule) => rule.allowedStatuses === "ALL" || shipmentStatus === null
            || rule.allowedStatuses.includes(shipmentStatus))
        .map(({allowedStatuses, ...option}) => ({
            ...option,
            recommended: option.group === category || option.resolution === "EXPLAINED",
        }));
