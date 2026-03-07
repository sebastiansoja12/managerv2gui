import RouteLogRecord from "../../RouteLog/model/RouteLogRecord";

export interface ShipmentIdDto {
    value: string;
}

export interface MoneyApi {
    amount: number;
    currency: string;
}

export interface WeightDto {
    value: number;
    unit: string;
}

export interface PersonApi {
    firstName: string;
    lastName: string;
    email: string;
    telephoneNumber: string;
    city: string;
    postalCode: string;
    street: string;
}

export interface SupplierCodeDto {
    value: string;
}

export interface ReasonCodeApi {
    value: string;
}

export interface DepartmentCodeDto {
    value: string;
}

export interface DangerousGoodApi {
    name: string;
    description: string;
    classificationCode: string;
    hazardSymbols: string[];
    storageRequirements: string;
    handlingInstructions: string;
    weight: WeightDto;
    packaging: string;
    flammable: boolean;
    corosive: boolean;
    toxic: boolean;
    emergencyContact: string;
    countryOfOrigin: string;
    safetyDataSheet: string;
}

export interface ShipmentConfigurationApi {
    forceUpdate: boolean;
    publishInRouteTracker: boolean;
    publishInReturnManager: boolean;
    customRerouteDepartment: boolean;
}

export interface SignatureDto {
    signerName: string;
    signedAt: string;
    signatureMethod: SignatureMethod;
    signature: string;
}

export interface ShipmentDto {
    shipmentId: ShipmentIdDto;
    sender: PersonApi;
    recipient: PersonApi;
    shipmentSize: ShipmentSizeDto;
    destination: string;
    shipmentStatus: ShipmentStatusDto;
    shipmentType: ShipmentTypeDto;
    shipmentRelatedId?: ShipmentIdDto | null;
    shipmentPriority: ShipmentPriorityDto;
    price: MoneyApi;
    trackingNumber: TrackingNumberDto;
    locked: boolean;
    signature?: SignatureDto | null;
    dangerousGood?: DangerousGoodApi | null;
}

export interface ShipmentControlCenterDto {
    shipment: ShipmentDto;
    routeLog: RouteLogRecord | null;
}

export interface TrackingNumberDto {
    value: string;
}

export interface ShipmentCreateRequestApi {
    sender: PersonApi;
    recipient: PersonApi;
    shipmentSize: ShipmentSizeDto;
    price: MoneyApi;
    dangerousGood: DangerousGoodApi | null;
    shipmentPriority: ShipmentPriorityDto;
    issuerCountryCode: string;
    receiverCountryCode: string;
    carrierOperator: string;
}

export interface ShipmentCreateResponseDto {
    shipmentId: string;
    trackingNumber: string;
}

export interface ShipmentUpdateRequestApi {
    shipmentId: ShipmentIdDto;
    sender: PersonApi;
    recipient: PersonApi;
    destination: string;
    shipmentSize: ShipmentSizeDto;
    price: MoneyApi;
    dangerousGood: DangerousGoodApi | null;
    shipmentPriority: ShipmentPriorityDto;
    shipmentStatus: ShipmentStatusDto;
    issuerCountryCode: string;
    receiverCountryCode: string;
    shipmentConfiguration: ShipmentConfigurationApi;
}

export interface ShipmentStatusRequestApi {
    shipmentId: ShipmentIdDto;
    shipmentStatus: ShipmentStatusDto;
}

export interface ShipmentSearchRequestApi {
    shipmentId?: string | null;
    trackingNumber?: string | null;
    shipmentStatuses?: ShipmentStatusDto[];
    shipmentSizes?: ShipmentSizeDto[];
    shipmentPriorities?: ShipmentPriorityDto[];
    senderName?: string | null;
    recipientName?: string | null;
    destination?: string | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    currency?: string | null;
    locked?: boolean | null;
    createdFrom?: string | null;
    createdTo?: string | null;
    page?: number;
    size?: number;
}

export interface SignatureChangeRequestApi {
    shipmentId: ShipmentIdDto;
    signerName: string;
    documentReference: string;
    signature: string;
}

export interface ShipmentReturnRequestApi {
    shipmentId: ShipmentIdDto;
    reason: string;
    reasonCode: ReasonCodeApi;
    departmentCode: DepartmentCodeDto;
    returnStatus: string;
}

export interface ShipmentDeliveryRequestApiDto {
    shipmentId: ShipmentIdDto;
    deliveryMethod: string;
    supplierCode: SupplierCodeDto;
    deliveryStatus: string;
}

export interface CountryRequestApi {
    issuerCountryCode: string;
    receiverCountryCode: string;
}

export interface ShipmentResponseInformation {
    status: "OK";
}

export type PersonType = "SENDER" | "RECIPIENT";

export type ShipmentPriorityDto = "LOW" | "MEDIUM" | "HIGH" | "EXPRESS";

export type ShipmentSizeDto = "TINY" | "SMALL" | "MEDIUM" | "AVERAGE" | "BIG" | "CUSTOM" | "TEST";

export type ShipmentStatusDto = "CREATED" | "REROUTE" | "SENT" | "DELIVERY" | "RETURN" | "REDIRECT";

export type ShipmentTypeDto = "PARENT" | "CHILD";

export type SignatureMethod = "DIGITAL" | "HANDWRITTEN" | "BIOMETRIC" | "NONE";

export const shipmentSizes: ShipmentSizeDto[] = ["TINY", "SMALL", "MEDIUM", "AVERAGE", "BIG", "CUSTOM", "TEST"];

export const shipmentPriorities: ShipmentPriorityDto[] = ["LOW", "MEDIUM", "HIGH", "EXPRESS"];

export const shipmentStatuses: ShipmentStatusDto[] = ["CREATED", "REROUTE", "SENT", "DELIVERY", "RETURN", "REDIRECT"];

export const shipmentTypes: ShipmentTypeDto[] = ["PARENT", "CHILD"];

export const signatureMethods: SignatureMethod[] = ["DIGITAL", "HANDWRITTEN", "BIOMETRIC", "NONE"];

export const personTypes: PersonType[] = ["SENDER", "RECIPIENT"];

export const countryCodes = [
    "AL", "AD", "AM", "AT", "AZ", "BY", "BE", "BA", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
    "GE", "DE", "GR", "HU", "IS", "IE", "IT", "KZ", "XK", "LV", "LI", "LT", "LU", "MT", "MD", "MC",
    "ME", "NL", "MK", "NO", "PL", "PT", "RO", "RU", "SM", "RS", "SK", "SI", "ES", "SE", "CH", "TR",
    "UA", "GB", "VA",
] as const;
