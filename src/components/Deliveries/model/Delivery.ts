export type DeliveryStep = {
    stepNumber: number;
    attemptedAt: string;
    outcome: string;
    deliveryStatus: string | null;
    userId: string | null;
    departmentId: string | null;
    supplierId: string | null;
    vehicleId: string | null;
    method: string | null;
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
    method: string | null;
    createdAt: string;
    plannedAt: string | null;
    deliveredAt: string | null;
    steps: DeliveryStep[];
};
