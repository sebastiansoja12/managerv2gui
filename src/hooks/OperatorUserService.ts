import http from "../http-super-admin";
import {
    CreateOperatorUserRequest,
    UserIdResponse,
} from "../components/SuperAdmin/operators/model/OperatorUser";

const create = (operatorId: string | number, request: CreateOperatorUserRequest) => (
    http.post<UserIdResponse>(`/operators/${operatorId}/users`, request)
);

const OperatorUserService = {
    create,
};

export default OperatorUserService;
