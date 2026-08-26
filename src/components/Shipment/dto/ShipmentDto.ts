import RouteLogRecord from "../../RouteLog/model/RouteLogRecord";
import {valueObjectValue, ValueObject} from "../../../utils/valueObject";

export interface ShipmentIdDto {
    value: string;
}

export interface OperatorIdDto {
    value: number;
}

export interface MoneyApi {
    amount: number;
    currency: string;
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

export interface DepartmentIdDto {
    value: number;
}

export type DepartmentCodeValue = ValueObject<string>;

export const departmentCodeValue = (departmentCode: DepartmentCodeValue): string => {
    return valueObjectValue(departmentCode);
};

export interface DangerousGoodApi {
    unNumber: string;
    properShippingName: string;
    description: string;
    hazardClass: string;
    hazardDivision: string;
    subsidiaryRisk: string;
    packingGroup: string;
    quantity: number;
    quantityUnit: string;
    packageCount: number;
    packagingType: string;
    limitedQuantity: boolean;
    exceptedQuantity: boolean;
    environmentallyHazardous: boolean;
    marinePollutant: boolean;
    transportCategory: string;
    tunnelRestrictionCode: string;
    flashPoint: number | null;
    emergencyContact: string;
    emergencyContact24h: string;
    safetyDataSheetReference: string;
    declarationDocumentReference: string;
    regulationType: string;
    transportMode: string;
    flammable: boolean;
    corrosive: boolean;
    toxic: boolean;
    hazardSymbols: string;
    storageRequirements: string;
    handlingInstructions: string;
    countryOfOrigin: string;
}

export interface ShipmentConfigurationApi {
    forceUpdate: boolean;
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
    operatorId?: OperatorIdDto | null;
    sender: PersonApi;
    recipient: PersonApi;
    shipmentSize: ShipmentSizeDto;
    destination: DepartmentCodeValue;
    originDepartmentId?: DepartmentIdDto | null;
    originCountry?: CountryCodeDto | null;
    destinationCountry?: CountryCodeDto | null;
    shipmentStatus: ShipmentStatusDto;
    shipmentType: ShipmentTypeDto;
    shipmentRelatedId?: ShipmentIdDto | null;
    shipmentPriority: ShipmentPriorityDto;
    price: MoneyApi;
    trackingNumber: TrackingNumberDto;
    locked: boolean;
    signature?: SignatureDto | null;
    dangerousGood?: DangerousGoodApi | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface ShipmentDetailsDto {
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
    dangerousGood?: DangerousGoodApi;
    shipmentPriority: ShipmentPriorityDto;
    issuerCountryCode: string;
    receiverCountryCode: string;
}

export interface ShipmentCreateResponseDto {
    shipmentId: string;
    trackingNumber: string;
}

export interface ShipmentCreateInitialState {
    sender: PersonApi;
    recipient: PersonApi;
    shipmentSize: ShipmentSizeDto;
    shipmentPriority: ShipmentPriorityDto;
    priceAmount: string;
    currency: string;
    issuerCountryCode: CountryCodeDto;
    receiverCountryCode: CountryCodeDto;
    dangerousGood?: DangerousGoodApi | null;
}

export interface ShipmentUpdateRequestApi {
    shipmentId: ShipmentIdDto;
    sender: PersonApi;
    recipient: PersonApi;
    destination: DepartmentCodeDto;
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
    hasDangerousGoods?: boolean | null;
    unNumber?: string | null;
    hazardClass?: string | null;
    regulationType?: string | null;
    transportMode?: string | null;
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

export type CountryCodeDto = typeof countryCodes[number];

export type ShipmentStatusDto = "CREATED" | "PREPARED" | "ACCEPTED" | "REROUTE" | "SENT" | "DELIVERY" | "RETURN" | "REDIRECT" | "CANCELED";

export type ShipmentTypeDto = "PARENT" | "CHILD";

export type SignatureMethod = "DIGITAL" | "HANDWRITTEN" | "BIOMETRIC" | "NONE";

export const shipmentSizes: ShipmentSizeDto[] = ["TINY", "SMALL", "MEDIUM", "AVERAGE", "BIG", "CUSTOM", "TEST"];

export const shipmentPriorities: ShipmentPriorityDto[] = ["LOW", "MEDIUM", "HIGH", "EXPRESS"];

export const shipmentStatuses: ShipmentStatusDto[] = ["CREATED", "PREPARED", "ACCEPTED", "REROUTE", "SENT", "DELIVERY", "RETURN", "REDIRECT", "CANCELED"];

export const shipmentChangeStatuses: ShipmentStatusDto[] = shipmentStatuses.filter((status) => status !== "CANCELED");

export const shipmentTypes: ShipmentTypeDto[] = ["PARENT", "CHILD"];

export const signatureMethods: SignatureMethod[] = ["DIGITAL", "HANDWRITTEN", "BIOMETRIC", "NONE"];

export const personTypes: PersonType[] = ["SENDER", "RECIPIENT"];

export const packingGroups = ["", "I", "II", "III"] as const;

export const dangerousGoodQuantityUnits = [
    "MILLIGRAM", "GRAM", "KILOGRAM", "TONNE", "OUNCE", "POUND", "LITRE",
] as const;

export const dangerousGoodRegulationTypes = ["ADR", "IATA", "IMDG", "RID"] as const;

export const dangerousGoodTransportModes = ["ROAD", "AIR", "SEA", "RAIL"] as const;

export const countryCodes = [
    "AL", "AD", "AM", "AT", "AZ", "BY", "BE", "BA", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
    "GE", "DE", "GR", "HU", "IS", "IE", "IT", "KZ", "XK", "LV", "LI", "LT", "LU", "MT", "MD", "MC",
    "ME", "NL", "MK", "NO", "PL", "PT", "RO", "RU", "SM", "RS", "SK", "SI", "ES", "SE", "CH", "TR",
    "UA", "GB", "VA",
] as const;
