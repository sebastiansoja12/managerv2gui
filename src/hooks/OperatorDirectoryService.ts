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
};

export type CreateOperatorCourierRequest = {
    supplierCode: string;
    firstName: string;
    lastName: string;
    telephoneNumber: string;
    departmentCode: string;
};

const listFromResponse = <T>(value: unknown): T[] => {
    if (Array.isArray(value)) {
        return value as T[];
    }

    if (!value || typeof value !== "object") {
        return [];
    }

    const payload = value as Record<string, unknown>;
    for (const key of ["items", "content", "users", "departments", "couriers", "suppliers", "data"]) {
        if (Array.isArray(payload[key])) {
            return payload[key] as T[];
        }
    }

    return [];
};

const responseStatus = (error: unknown) => (error as {response?: {status?: number}})?.response?.status;

const getDirectoryList = <T>(operatorId: string | number, endpoint: string, fallbackEndpoint: string) => (
    http.get<unknown>(endpoint)
        .catch((error) => {
            if (![400, 404, 405].includes(responseStatus(error) || 0)) {
                throw error;
            }

            return http.get<unknown>(fallbackEndpoint, {params: {operatorId}});
        })
        .then((response) => listFromResponse<T>(response.data))
        .catch((error) => {
            if (responseStatus(error) === 404) {
                return [] as T[];
            }
            throw error;
        })
);

const getUsers = (operatorId: string | number) => (
    getDirectoryList<User>(operatorId, `/operators/${operatorId}/users`, "/users")
);

const getDepartments = (operatorId: string | number) => (
    getDirectoryList<Department>(operatorId, `/operators/${operatorId}/departments`, "/departments")
);

const getCouriers = (operatorId: string | number) => (
    getDirectoryList<CourierDto>(operatorId, `/operators/${operatorId}/couriers`, "/suppliers")
);

const createDepartment = (operatorId: string | number, request: CreateOperatorDepartmentRequest) => (
    http.post(`/operators/${operatorId}/departments`, request)
);

const createCourier = (operatorId: string | number, request: CreateOperatorCourierRequest) => (
    http.post(`/operators/${operatorId}/couriers`, request)
);

const OperatorDirectoryService = {
    getUsers,
    getDepartments,
    getCouriers,
    createDepartment,
    createCourier,
};

export default OperatorDirectoryService;
