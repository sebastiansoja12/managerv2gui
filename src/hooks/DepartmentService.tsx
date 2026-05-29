import Department from "../class/depots/Department";
import http from "../http-common";

export type DepartmentStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED" | "DELETED" | "SUSPENDED";

export type DepartmentCreateRequest = {
    departments: Array<{
        departmentCode: {
            value: string;
        };
        city: string;
        street: string;
        postalCode: string;
        nip: string;
        telephoneNumber: string;
        openingHours: string;
        email: string;
        countryCode: string;
        departmentType: string;
    }>;
};

export type DepartmentAddressUpdateRequest = {
    departmentCode: {
        value: string;
    };
    address: {
        city: string;
        street: string;
        postalCode: string;
        countryCode: string;
    };
};

export type DepartmentEmailUpdateRequest = {
    departmentCode: {
        value: string;
    };
    email: string;
};

export type DepartmentIdentificationNumberUpdateRequest = {
    departmentCode: {
        value: string;
    };
    identificationNumber: string;
};

export type DepartmentStatusUpdateRequest = {
    departmentCode: {
        value: string;
    };
    status: DepartmentStatus;
};

const getAll = () => {
    return http.get<Array<Department>>("/departments");
};
const getArchived = () => {
    return http.get<Array<Department>>("/departments/archived");
};
const get = (depotCode: any) => {
    return http.get<Department>(`/depots/${depotCode}`);
};

const create = (data: DepartmentCreateRequest) => {
    return http.post<Department>("/departments", data);
};

const updateAddress = (data: DepartmentAddressUpdateRequest) => {
    return http.put<void>("/departments", data);
};

const changeType = (departmentCode: string, departmentType: string) => {
    return http.put<void>("/departments/department-type", undefined, {
        params: {
            departmentCode,
            departmentType,
        },
    });
};

const changeStatus = (data: DepartmentStatusUpdateRequest) => {
    return http.put<void>("/departments/statuses", data);
};

const archive = (data: DepartmentStatusUpdateRequest) => {
    return http.put<void>("/departments/statuses/archive", data);
};

const changeEmail = (data: DepartmentEmailUpdateRequest) => {
    return http.put<void>("/departments/emails", data);
};

const changeIdentificationNumber = (data: DepartmentIdentificationNumberUpdateRequest) => {
    return http.put<void>("/departments/identification-numbers", data);
};

const DepartmentService = {
    getAll,
    getArchived,
    get,
    create,
    updateAddress,
    changeType,
    changeStatus,
    archive,
    changeEmail,
    changeIdentificationNumber,
};

export default DepartmentService;
