import {DepartmentLoad} from "../components/Departments/model/DepartmentLoad";
import http from "../http-common";

const getAll = () => {
    return http.get<DepartmentLoad[]>("/deliveries/department-loads");
};

const DepartmentLoadService = {
    getAll,
};

export default DepartmentLoadService;
