export type AuditLogResourceType = "SHIPMENT" | "PICKUP_POINT" | "PALLET" | "DELIVERY_NETWORK" | "DELIVERY";

export interface AuditLogChangeDto {
    field: string;
    previousValue: string | null;
    currentValue: string | null;
}

export interface AuditLogEntryDto {
    id: number;
    resourceType: AuditLogResourceType;
    resourceId: string;
    action: string;
    changes: AuditLogChangeDto[];
    userId: number | null;
    username: string | null;
    system: boolean;
    departmentId: number | null;
    occurredAt: string;
}

export interface AuditLogEntryPageDto {
    content: AuditLogEntryDto[];
    page: number;
    size: number;
    totalElements: number;
}
