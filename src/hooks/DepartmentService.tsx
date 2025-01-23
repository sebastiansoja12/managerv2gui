import Department from "../class/depots/Department";
import http from "../http-common";
const getAll = () => {
    return http.get<Array<Department>>("/departments");
};
const get = (depotCode: any) => {
    return http.get<Department>(`/depots/${depotCode}`);
};

const create = (data: Department) => {
    return http.post<Department>("/departments", data);
};

const DepartmentService = {
    getAll,
    get,
    create,
};

export default DepartmentService;