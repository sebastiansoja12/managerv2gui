import DepartmentCode from "../../components/DepartmentCode";

export interface Address {
    city: string;
    street: string;
    postalCode: string;
    countryCode: string;
}

export default interface Department {
    departmentCode: DepartmentCode;
    address: Address;
    taxId: string;
    telephoneNumber: string;
    openingHours: string;
    email: string;
    departmentType: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}
