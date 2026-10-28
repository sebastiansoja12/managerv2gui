import RouteLogRecord from "../../RouteLog/model/RouteLogRecord";
import {ReturnPackageDto} from "../../Returns/model/ReturnPackage";
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

export type LengthUnitDto = "MM" | "CM" | "M";

export type WeightUnitDto = "G" | "KG";

export interface DimensionsApi {
    length: number;
    width: number;
    height: number;
    unit: LengthUnitDto;
}

export interface WeightApi {
    value: number;
    unit: WeightUnitDto;
}

export interface PersonApi {
    firstName: string;
    lastName: string;
    email: string;
    telephoneNumber: string;
    city: string;
    postalCode: string;
    street: string;
    countryCode?: CountryCodeDto | null;
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

export interface ShipmentConfigurationApi {
    forceUpdate: boolean;
    publishInReturnManager: boolean;
    customRerouteDepartment: boolean;
}

export interface ShipmentDto {
    shipmentId: ShipmentIdDto;
    operatorId?: OperatorIdDto | null;
    sender: PersonApi;
    recipient: PersonApi;
    dimensions?: DimensionsApi | null;
    weight?: WeightApi | null;
    customerReference?: string | null;
    contentDescription?: string | null;
    declaredValue?: MoneyApi | null;
    shipmentStatus: ShipmentStatusDto;
    shipmentType: ShipmentTypeDto;
    shipmentRelatedId?: ShipmentIdDto | null;
    shipmentPriority: ShipmentPriorityDto;
    packagingType?: PackagingTypeDto | null;
    serviceLevel?: ShipmentServiceLevelDto | null;
    price: MoneyApi;
    trackingNumber: TrackingNumberDto;
    locked: boolean;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface ShipmentDetailsDto {
    shipment: ShipmentDto;
    routeLog: RouteLogRecord | null;
    returnPackage?: ReturnPackageDto | null;
}

export interface TrackingNumberDto {
    value: string;
}

export interface ShipmentCreateRequestApi {
    sender: PersonApi;
    recipient: PersonApi;
    dimensions: DimensionsApi;
    weight: WeightApi;
    customerReference?: string;
    contentDescription?: string;
    declaredValue?: MoneyApi;
    price: MoneyApi;
    shipmentPriority: ShipmentPriorityDto;
    packagingType?: PackagingTypeDto;
    serviceLevel?: ShipmentServiceLevelDto;
    pickupMethod: PickupMethodDto;
    deliveryMethod: DeliveryMethodDto;
    pickupPointId?: PickupPointIdDto;
    deliveryPickupPointId?: PickupPointIdDto;
}

export interface ShipmentCreateResponseDto {
    shipmentId: string;
    trackingNumber: string;
}

export interface ShipmentCreateInitialState {
    sender: PersonApi;
    recipient: PersonApi;
    dimensions?: DimensionsApi | null;
    weight?: WeightApi | null;
    customerReference?: string | null;
    contentDescription?: string | null;
    declaredValue?: MoneyApi | null;
    shipmentPriority: ShipmentPriorityDto;
    packagingType?: PackagingTypeDto | null;
    serviceLevel?: ShipmentServiceLevelDto | null;
    priceAmount: string;
    currency: string;
    pickupMethod?: PickupMethodDto;
    deliveryMethod?: DeliveryMethodDto;
    pickupPointId?: string;
    deliveryPickupPointId?: PickupPointIdDto | null;
    deliveryPickupPointCode?: string | null;
}

export interface ShipmentUpdateRequestApi {
    shipmentId: ShipmentIdDto;
    sender: PersonApi;
    recipient: PersonApi;
    dimensions: DimensionsApi;
    weight: WeightApi;
    contentDescription?: string;
    declaredValue?: MoneyApi;
    customerReference?: string;
    price: MoneyApi;
    shipmentPriority: ShipmentPriorityDto;
    shipmentStatus: ShipmentStatusDto;
    shipmentConfiguration: ShipmentConfigurationApi;
}

export interface ShipmentStatusRequestApi {
    shipmentId: ShipmentIdDto;
    shipmentStatus: ShipmentStatusDto;
}

export interface PickupPointIdDto {
    value: string;
}

export interface ShipmentSearchRequestApi {
    shipmentId?: string | null;
    trackingNumber?: string | null;
    shipmentStatuses?: ShipmentStatusDto[];
    shipmentPriorities?: ShipmentPriorityDto[];
    senderName?: string | null;
    recipientName?: string | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    currency?: string | null;
    locked?: boolean | null;
    createdFrom?: string | null;
    createdTo?: string | null;
    page?: number;
    size?: number;
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

export interface ShipmentResponseInformation {
    status: "OK";
}

export type PersonType = "SENDER" | "RECIPIENT";

export type ShipmentPriorityDto = "LOW" | "MEDIUM" | "HIGH" | "EXPRESS";

export type PackagingTypeDto = "ENVELOPE" | "BAG" | "BOX" | "TUBE" | "CRATE" | "OTHER";

export type ShipmentServiceLevelDto = "ECONOMY" | "STANDARD" | "EXPRESS";

export type ShipmentSizeDto = "TINY" | "SMALL" | "MEDIUM" | "AVERAGE" | "BIG" | "CUSTOM" | "TEST";

export type CountryCodeDto = typeof countryCodes[number];

export type ShipmentStatusDto = "PLANNED" | "CREATED" | "PREPARED" | "ACCEPTED" | "REROUTE" | "SENT" | "DELIVERY" | "RETURN" | "REDIRECT" | "CANCELED";

export type PickupMethodDto = "DEPARTMENT" | "COURIER" | "PICKUP_POINT" | "LOCKER";

export type DeliveryMethodDto = "COURIER" | "PICKUP_POINT" | "LOCKER";

export type ShipmentTypeDto = "PARENT" | "CHILD";

export const shipmentPriorities: ShipmentPriorityDto[] = ["LOW", "MEDIUM", "HIGH", "EXPRESS"];

export const shipmentStatuses: ShipmentStatusDto[] = ["PLANNED", "CREATED", "PREPARED", "ACCEPTED", "REROUTE", "SENT", "DELIVERY", "RETURN", "REDIRECT", "CANCELED"];

export const pickupMethods: PickupMethodDto[] = ["DEPARTMENT", "COURIER", "PICKUP_POINT", "LOCKER"];

export const deliveryMethods: DeliveryMethodDto[] = ["COURIER", "PICKUP_POINT", "LOCKER"];

export const shipmentChangeStatuses: ShipmentStatusDto[] = shipmentStatuses.filter(
    (status) => status !== "PLANNED" && status !== "CANCELED",
);

export const shipmentTypes: ShipmentTypeDto[] = ["PARENT", "CHILD"];

export const personTypes: PersonType[] = ["SENDER", "RECIPIENT"];

export const countryCodes = [
    "AL", "AD", "AM", "AT", "AZ", "BY", "BE", "BA", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
    "GE", "DE", "GR", "HU", "IS", "IE", "IT", "KZ", "XK", "LV", "LI", "LT", "LU", "MT", "MD", "MC",
    "ME", "NL", "MK", "NO", "PL", "PT", "RO", "RU", "SM", "RS", "SK", "SI", "ES", "SE", "CH", "TR",
    "UA", "GB", "VA",
] as const;
