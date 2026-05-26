import DepartmentCode from "../../components/DepartmentCode";

export interface Address {
    city: string;
    street: string;
    postalCode: string;
    countryCode: string;
}

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export default interface Department {
    departmentId: number;
    departmentCode: DepartmentCode;
    address: Address;
    coordinates?: Coordinates | null;
    taxId: string;
    telephoneNumber: string;
    openingHours: string;
    email: string;
    departmentType: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}
