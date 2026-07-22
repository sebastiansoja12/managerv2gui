export type ReturnStatus = "CREATED" | "PROCESSING" | "COMPLETED" | "CANCELLED";

export const returnReasonCodes = [
    "DAMAGED",
    "WRONG_ITEM",
    "NO_LONGER_NEEDED",
    "RECIPIENT_REFUSED",
    "RECIPIENT_UNAVAILABLE",
    "INVALID_ADDRESS",
    "UNCLAIMED",
    "SENDER_REQUESTED",
    "OTHER",
] as const;

export type ReturnReasonCode = typeof returnReasonCodes[number];

export type StringValue = {
    value: string;
};

export interface ReturnPackageDto {
    returnPackageId: StringValue;
    shipmentId: StringValue;
    reason: string;
    returnStatus: ReturnStatus;
    returnToken: StringValue;
    assignedDepartmentId: StringValue;
    returnedDepartmentId: StringValue | null;
    assignedDepartmentCode: StringValue;
    returnedDepartmentCode: StringValue;
    assignedTo: StringValue;
    processedBy: StringValue;
    reasonCode: StringValue;
    operatorId?: StringValue | null;
    createdAt: string;
    updatedAt: string;
}

export interface ReturnPageDto {
    content: ReturnPackageDto[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export interface ReturnCreateRequest {
    shipmentId: StringValue;
    reason: string;
    reasonCode: StringValue;
    departmentId: StringValue;
    returnStatus: "CREATED";
}

export interface ReturnTokenValidationRequest {
    shipmentId: string;
    returnToken: string;
}

export interface ReturnTokenValidationResponse {
    valid: boolean;
}

export interface CreatedReturnDto {
    shipmentId: StringValue;
    returnId: StringValue;
    status: ReturnStatus;
}
