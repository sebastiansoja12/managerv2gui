import http from "../http-super-admin";
import {CreateOperatorRequest, Operator, OperatorIdResponse, UpdateOperatorRequest} from "../components/Operators/model/Operator";

const getAll = () => http.get<Operator[]>("/operators");

const getById = (operatorId: string | number) => http.get<Operator>(`/operators/${operatorId}`);

const create = (request: CreateOperatorRequest) => http.post<OperatorIdResponse>("/operators", request);

const update = (operatorId: string, request: UpdateOperatorRequest) => (
    http.put<Operator>(`/operators/${operatorId}`, request)
);

const OperatorService = {
    getAll,
    getById,
    create,
    update,
};

export default OperatorService;
