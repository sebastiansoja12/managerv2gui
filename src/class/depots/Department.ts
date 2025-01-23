import DepartmentCode from "../../components/DepartmentCode";

export default interface Department {
    departmentCode: DepartmentCode;
    city: string;
    street: string;
    country: string;
    postalCode:string;
    telephoneNumber:string;
    nip:string;
    openingHours:string;
}
