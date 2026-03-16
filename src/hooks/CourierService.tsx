import http from "../http-common";
import {
    CertificationUpdateRequest,
    CourierBasicDataUpdateRequest,
    CourierDto,
} from "../components/Couriers/dto/CourierDto";

const getAll = () => {
    return http.get<Array<CourierDto>>("/suppliers");
};

const updateBasicData = (data: CourierBasicDataUpdateRequest) => {
    return http.patch("/suppliers/basic-data", data);
};

const updateCertification = (data: CertificationUpdateRequest) => {
    return http.put("/suppliers/certifications", data);
};

const activate = (supplierCode: string) => {
    return http.put(`/suppliers/${encodeURIComponent(supplierCode)}/activate`);
};

const deactivate = (supplierCode: string) => {
    return http.put(`/suppliers/${encodeURIComponent(supplierCode)}/deactivate`);
};

const CourierService = {
    getAll,
    updateBasicData,
    updateCertification,
    activate,
    deactivate,
};

export default CourierService;
