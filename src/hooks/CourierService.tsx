import http from "../http-common";
import {
    CertificationUpdateRequest,
    CourierBasicDataUpdateRequest,
    CourierCreateRequest,
    CourierDeliveryAreaUpdateRequest,
    CourierDepartmentUpdateRequest,
    CourierDeviceUpdateRequest,
    CourierDto,
    CourierPackageTypesUpdateRequest,
    CourierUpdateRequest,
    CourierVehicleUpdateRequest,
    DriverLicenseUpdateRequest,
} from "../components/Couriers/dto/CourierDto";

const getAll = () => {
    return http.get<Array<CourierDto>>("/suppliers");
};

const updateBasicData = (data: CourierBasicDataUpdateRequest) => {
    return http.patch("/suppliers/basic-data", data);
};

const create = (data: CourierCreateRequest) => {
    return http.post("/suppliers", data);
};

const update = (data: CourierUpdateRequest) => {
    return http.put("/suppliers", data);
};

const updateCertification = (data: CertificationUpdateRequest) => {
    return http.put("/suppliers/certifications", data);
};

const updateDriverLicense = (data: DriverLicenseUpdateRequest) => {
    return http.put("/suppliers/driver-licenses", data);
};

const updateDepartment = (data: CourierDepartmentUpdateRequest) => {
    return http.put("/suppliers/department-codes", data);
};

const updateDevice = (data: CourierDeviceUpdateRequest) => {
    return http.put("/suppliers/devices", data);
};

const updateVehicle = (data: CourierVehicleUpdateRequest) => {
    return http.put("/suppliers/vehicles", data);
};

const updateDeliveryArea = (data: CourierDeliveryAreaUpdateRequest) => {
    return http.put("/suppliers/delivery-areas", data);
};

const updatePackageTypes = (data: CourierPackageTypesUpdateRequest) => {
    return http.put("/suppliers/supported-package-types", data);
};

const activate = (supplierCode: string) => {
    return http.put(`/suppliers/${encodeURIComponent(supplierCode)}/activate`);
};

const deactivate = (supplierCode: string) => {
    return http.put(`/suppliers/${encodeURIComponent(supplierCode)}/deactivate`);
};

const CourierService = {
    getAll,
    create,
    update,
    updateBasicData,
    updateCertification,
    updateDriverLicense,
    updateDepartment,
    updateDevice,
    updateVehicle,
    updateDeliveryArea,
    updatePackageTypes,
    activate,
    deactivate,
};

export default CourierService;
