import BackendClient from "../api/BackendClient";
import http from "../http-common";
import {
    DeliveryAreaDto,
    DeliveryAreaIdentifier,
    DeliveryAreaRequestDto,
    DepartmentDeliveryAreasDto,
} from "../components/Departments/dto/DeliveryAreaDto";

const client = new BackendClient(http);

const departmentPath = (departmentId: number | string) => (
    `/delivery-areas/departments/${encodeURIComponent(String(departmentId))}`
);

const getAll = () => client.get<DeliveryAreaDto[]>("/delivery-areas");

const getByDepartment = (departmentId: number | string) => client.get<DeliveryAreaDto[]>(departmentPath(departmentId));

const replaceDepartmentAreas = (departmentId: number | string, areas: DeliveryAreaRequestDto[]) => (
    client.put<{areas: DeliveryAreaRequestDto[]}, DeliveryAreaDto[]>(departmentPath(departmentId), {areas})
);

const previewAutomatic = (departmentIds: DeliveryAreaIdentifier[]) => (
    client.post<{departmentIds: DeliveryAreaIdentifier[]}, DepartmentDeliveryAreasDto[]>("/delivery-areas/automatic/previews",
        {departmentIds})
);

const applyAutomatic = (departmentIds: DeliveryAreaIdentifier[]) => (
    client.post<{departmentIds: DeliveryAreaIdentifier[]}, DepartmentDeliveryAreasDto[]>("/delivery-areas/automatic", {departmentIds})
);

const DeliveryAreaService = {
    getAll,
    getByDepartment,
    replaceDepartmentAreas,
    previewAutomatic,
    applyAutomatic,
};

export default DeliveryAreaService;
