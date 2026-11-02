import pl from "../../i18n/translate";
import {AuditLogEntryDto, AuditLogResourceType} from "./model/AuditLogEntry";

export const auditLogActionLabel = (resourceType: AuditLogResourceType, action: string) => {
    const resourceActions = (pl.auditLog.actions as Record<string, Record<string, string> | string>)[resourceType];
    if (typeof resourceActions !== "object") {
        return pl.auditLog.actions.UNKNOWN;
    }
    return resourceActions?.[action] || pl.auditLog.actions.UNKNOWN;
};

export const auditLogFieldLabel = (field: string) => {
    const fields = pl.auditLog.fields as Record<string, string>;
    if (fields[field]) {
        return fields[field];
    }
    const [scope, ...rest] = field.split(".");
    const nestedField = rest.join(".");
    if (nestedField && fields[scope] && fields[nestedField]) {
        return `${fields[scope]} · ${fields[nestedField]}`;
    }
    return field;
};

export const auditLogActorLabel = (entry: Pick<AuditLogEntryDto, "system" | "username" | "userId">) => {
    if (entry.system) {
        return pl.auditLog.systemActor;
    }
    return entry.username || (entry.userId !== null ? String(entry.userId) : pl.common.dash);
};

const valueDictionary = (resourceType: AuditLogResourceType, field: string): Record<string, string> | undefined => {
    const fieldName = field.split(".").pop() || field;
    switch (fieldName) {
        case "shipmentStatus":
            return pl.shipments.status;
        case "shipmentType":
            return pl.shipments.type;
        case "shipmentPriority":
            return pl.shipments.priority;
        case "packagingType":
            return pl.shipments.packagingType;
        case "serviceLevel":
            return pl.shipments.serviceLevel;
        case "pickupMethod":
            return pl.shipments.pickupMethod;
        case "method":
            return pl.shipments.deliveryMethod;
        case "deliveryStatus":
            return pl.deliveries.status;
        case "status":
            return resourceType === "PICKUP_POINT" ? pl.pickupPoints.status : undefined;
        case "type":
            return resourceType === "PICKUP_POINT" ? pl.pickupPoints.type : undefined;
        default:
            return undefined;
    }
};

export const auditLogValueLabel = (resourceType: AuditLogResourceType, field: string, value: string | null) => {
    if (value === null || value === "") {
        return null;
    }
    if (value === "true" || value === "false") {
        return value === "true" ? pl.auditLog.yes : pl.auditLog.no;
    }
    return valueDictionary(resourceType, field)?.[value] || value;
};

export const formatAuditLogDate = (value: string) => new Date(value).toLocaleString(pl.common.locale);
