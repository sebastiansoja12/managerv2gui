import {TransportTypeDto} from "../../Pallets/model/Pallet";

export type VehicleTypeDto = "VAN" | "TRUCK" | "SEMI_TRAILER" | "REFRIGERATED_TRUCK" | "OTHER";

export const VEHICLE_TYPES: VehicleTypeDto[] = ["VAN", "TRUCK", "SEMI_TRAILER", "REFRIGERATED_TRUCK", "OTHER"];

export type CarrierField = "name" | "tax-id" | "phone" | "email" | "default-transport-type";
export type VehicleField = "registration-number" | "vehicle-type" | "trailer-registration-number" | "max-load";
export type DriverField = "first-name" | "last-name" | "phone" | "license-number";

export interface CarrierDriverDto {
    driverId: number | string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    licenseNumber?: string | null;
    active: boolean;
}

export interface CarrierVehicleDto {
    vehicleId: number | string;
    registrationNumber: string;
    vehicleType: VehicleTypeDto;
    trailerRegistrationNumber?: string | null;
    maxLoadKg?: number | string | null;
    active: boolean;
}

export interface CarrierDto {
    carrierId: number | string;
    name: string;
    taxId?: string | null;
    phone?: string | null;
    email?: string | null;
    defaultTransportType?: TransportTypeDto | null;
    active: boolean;
    created?: string | null;
    drivers: CarrierDriverDto[];
    vehicles: CarrierVehicleDto[];
}

export interface DriverDto {
    driverId: number | string;
    carrierId: number | string;
    carrierName: string;
    carrierActive: boolean;
    firstName: string;
    lastName: string;
    phone?: string | null;
    licenseNumber?: string | null;
    active: boolean;
}

export interface CarrierRequestApi {
    name: string;
    taxId?: string | null;
    phone?: string | null;
    email?: string | null;
    defaultTransportType?: TransportTypeDto | null;
}

export interface DriverRequestApi {
    carrierId: number | string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    licenseNumber?: string | null;
}

export interface CarrierVehicleRequestApi {
    registrationNumber: string;
    vehicleType?: VehicleTypeDto | null;
    trailerRegistrationNumber?: string | null;
    maxLoadKg?: number | null;
}
