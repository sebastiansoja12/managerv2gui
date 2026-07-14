import Department from "../class/depots/Department";
import http from "../http-common";

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

const getAll = () => {
    return http.get<Array<Department>>("/departments");
};
const get = (depotCode: any) => {
    return http.get<Department>(`/depots/${depotCode}`);
};

const create = (data: DepartmentCreateRequest) => {
    return http.post<Department>("/departments", data);
};

const DepartmentService = {
    getAll,
    get,
    create,
};

export default DepartmentService;
