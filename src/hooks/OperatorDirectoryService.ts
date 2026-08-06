import http from "../http-super-admin";
import Department from "../class/depots/Department";
import {CourierDto} from "../components/Couriers/dto/CourierDto";
import {User} from "../components/Users/model/User";

export type CreateOperatorDepartmentRequest = {
    departmentCode: string;
    city: string;
    street: string;
    postalCode: string;
    countryCode: string;
    taxId: string;
    telephoneNumber: string;
    openingHours: string;
    email: string;
    departmentType: string;
};

export type CreateOperatorCourierRequest = {
    supplierCode: string;
    firstName: string;
    lastName: string;
    telephoneNumber: string;
    departmentCode: string;
};

export type CreatedValueResponse = {
    value: string | number;
};

const getUsers = (operatorId: string | number) => (
    http.get<User[]>(`/operators/${operatorId}/users`).then((response) => response.data)
);

const getDepartments = (operatorId: string | number) => (
    http.get<Department[]>(`/operators/${operatorId}/departments`).then((response) => response.data)
);

const getCouriers = (operatorId: string | number) => (
    http.get<CourierDto[]>(`/operators/${operatorId}/couriers`).then((response) => response.data)
);

const createDepartment = (operatorId: string | number, request: CreateOperatorDepartmentRequest) => (
    http.post<CreatedValueResponse>(`/operators/${operatorId}/departments`, request)
);

const createCourier = (operatorId: string | number, request: CreateOperatorCourierRequest) => (
    http.post<CreatedValueResponse>(`/operators/${operatorId}/couriers`, request)
);

const OperatorDirectoryService = {
    getUsers,
    getDepartments,
    getCouriers,
    createDepartment,
    createCourier,
};

export default OperatorDirectoryService;
