export interface SupplierCodeDto {
    value: string;
}

export interface DepartmentCodeDto {
    value: string;
}

export interface VehicleIdDto {
    value: string;
}

export interface DeviceIdDto {
    value: string;
}

export interface DriverLicenseDto {
    number: string;
    acquiredDate: string;
    drivingLicenseExpiryDate: string;
}

export interface DangerousGoodCertificationDto {
    certificateNumber: string;
    issueDate: string;
    expiryDate: string;
    authority: string;
    valid: boolean;
}

export interface DeliveryAreaDto {
    areaName: string;
    city: string;
    district: string;
    municipality: string;
    region: string;
    country: string;
    postalCodes: string[];
}

export interface UserIdDto {
    value: string;
    operatorId?: number | null;
}

export interface CourierDto {
    supplierCode: SupplierCodeDto;
    firstName: string;
    lastName: string;
    telephoneNumber: string;
    departmentCode?: DepartmentCodeDto | null;
    status?: string | null;
    userStatus?: string | null;
    vehicleId?: VehicleIdDto | null;
    deviceId?: DeviceIdDto | null;
    dangerousGoodCertification?: DangerousGoodCertificationDto | null;
    driverLicense?: DriverLicenseDto | null;
    deliveryArea?: DeliveryAreaDto | null;
    supportedPackageTypes?: string[] | null;
    termsAccepted?: boolean | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    createdUserId?: UserIdDto | null;
}

export interface CourierBasicDataUpdateRequest {
    supplierCode: SupplierCodeDto;
    firstName: string;
    lastName: string;
    telephoneNumber: string;
}

export interface CourierCreateRequest {
    supplierCode: SupplierCodeDto;
    firstName: string;
    lastName: string;
    telephoneNumber: string;
}

export interface CertificationUpdateRequest {
    supplierCode: SupplierCodeDto;
    dangerousGoodCertification: DangerousGoodCertificationDto;
}
