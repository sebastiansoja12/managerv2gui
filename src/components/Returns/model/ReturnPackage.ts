export type ReturnStatus = "CREATED" | "PROCESSING" | "COMPLETED" | "CANCELLED";

export type ReturnReasonCode = "DAMAGED" | "WRONG_ITEM" | "NO_LONGER_NEEDED";

export type StringValue = {
    value: string;
};

export interface ReturnPackageDto {
    returnPackageId: StringValue;
    shipmentId: StringValue;
    reason: string;
    returnStatus: ReturnStatus;
    returnToken: StringValue;
    assignedDepartmentCode: StringValue;
    returnedDepartmentCode: StringValue;
    assignedTo: StringValue;
    processedBy: StringValue;
    reasonCode: StringValue;
    operatorId?: number | null;
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
    departmentCode: StringValue;
    returnStatus: "CREATED";
}

export interface ReturnTokenValidationRequest {
    shipmentId: string;
    returnToken: string;
}

export interface ReturnTokenValidationResponse {
    shipmentId: number | string;
    valid: boolean;
    message: string;
}

export const returnReasonCodes: ReturnReasonCode[] = ["DAMAGED", "WRONG_ITEM", "NO_LONGER_NEEDED"];
