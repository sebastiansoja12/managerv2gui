export type DeliveryStep = {
    stepNumber: number;
    attemptedAt: string;
    outcome: string;
    deliveryStatus: string | null;
    userId: string | null;
    departmentId: string | null;
    supplierId: string | null;
    vehicleId: string | null;
    signatureId: string | null;
    comment: string | null;
    failureReason: string | null;
};

export type Delivery = {
    id: string;
    targetType: string;
    targetId: string;
    shipmentId: string | null;
    type: string;
    deliveryStatus: string | null;
    lifecycleStatus: string;
    originDepartmentId: string | null;
    destinationDepartmentId: string | null;
    pickupMethod: string | null;
    method: string | null;
    pickupPointId: string | null;
    deliveryPickupPointId: string | null;
    supplierId: string | null;
    vehicleId: string | null;
    signatureRequired: boolean | null;
    instructions: string | null;
    createdAt: string;
    plannedAt: string | null;
    deliveredAt: string | null;
    attemptLimit: number;
    steps: DeliveryStep[];
};

export type DeliveryRelation = {
    relation: "SOURCE" | "DERIVED" | "REPLACED_BY" | "REPLACES";
    delivery: Delivery;
};

export type DeliveryHistoryEntry = {
    eventType: "CREATED" | "MODIFIED" | "ATTEMPT_RECORDED" | "COMPLETED" | "CANCELED";
    occurredAt: string;
    userId: string | null;
    deliveryStatus: string | null;
    lifecycleStatus: string;
    originDepartmentId: string | null;
    destinationDepartmentId: string | null;
    pickupMethod: string | null;
    method: string | null;
    pickupPointId: string | null;
    deliveryPickupPointId: string | null;
    supplierId: string | null;
    vehicleId: string | null;
    signatureRequired: boolean | null;
    instructions: string | null;
    plannedAt: string | null;
    stepCount: number;
};

export type DeliveryListItem = {
    id: string;
    shipmentId: string | null;
    targetType: string;
    targetId: string;
    type: string;
    deliveryStatus: string | null;
    lifecycleStatus: string;
    originDepartmentId: string | null;
    destinationDepartmentId: string | null;
    method: string | null;
    stepCount: number;
    createdAt: string;
    deliveredAt: string | null;
};

export type DeliveryListPage = {
    items: DeliveryListItem[];
    page: number;
    size: number;
    hasNext: boolean;
};

export type DeliveryRouteRequest = {
    originDepartmentId: number | null;
    destinationDepartmentId: number | null;
    pickupMethod: string | null;
    pickupPointId: string | null;
    deliveryPickupPointId: string | null;
};

export type DeliveryConditionsRequest = {
    method: string;
    signatureRequired: boolean;
    instructions: string | null;
    plannedAt: string | null;
};

export type DeliveryCarrierRequest = {
    supplierId: number | null;
    vehicleId: number | null;
};

export type DeliverySortField =
    "CREATED" | "DELIVERED_AT" | "SHIPMENT" | "TARGET" | "TYPE" | "DELIVERY_STATUS" | "LIFECYCLE_STATUS" | "METHOD"
    | "STEP_COUNT";

export type DeliveryQueryFilter = {
    shipmentIds?: string[];
    text?: string;
    lifecycleStatuses?: string[];
    hideCanceled?: boolean;
    hideCompleted?: boolean;
    deliveryStatuses?: string[];
    type?: string;
    targetType?: string;
    method?: string;
    departmentId?: string;
    createdFrom?: string;
    createdTo?: string;
    sort?: DeliverySortField;
    direction?: "asc" | "desc";
};
