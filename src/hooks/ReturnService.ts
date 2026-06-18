import BackendClient from "../api/BackendClient";
import {
    ReturnCreateRequest,
    ReturnPageDto,
    ReturnPackageDto,
    ReturnReasonCode,
    ReturnTokenValidationRequest,
    ReturnTokenValidationResponse,
} from "../components/Returns/model/ReturnPackage";
import http from "../http-common";
import returningHttp from "../http-returning";

const managerClient = new BackendClient(http);
const returningClient = new BackendClient(returningHttp);

const create = (request: ReturnCreateRequest) =>
    managerClient.put<ReturnCreateRequest, {status: "OK"}>("/shipments/returns", request);

const get = (returnPackageId: string) =>
    managerClient.get<ReturnPackageDto>(`/shipments/returns/${returnPackageId}`);

const getAllByDepartment = async (departmentCode: string): Promise<ReturnPackageDto[]> => {
    const pageSize = 100;
    const returnPackages: ReturnPackageDto[] = [];
    let page = 0;
    let totalPages = 1;

    while (page < totalPages) {
        const response = await managerClient.get<ReturnPageDto>("/shipments/returns", {
            params: {departmentCode, page, size: pageSize},
        });
        returnPackages.push(...response.data.content);
        totalPages = response.data.totalPages;
        page += 1;
    }

    return returnPackages;
};

const changeReasonCode = (returnPackageId: string, reasonCode: ReturnReasonCode) =>
    returningClient.put<{returnPackageId: {value: string}; reasonCode: ReturnReasonCode}, void>(
        "/returns/reason-code",
        {
            returnPackageId: {value: returnPackageId},
            reasonCode,
        },
    );

const complete = (shipmentId: string) =>
    returningClient.put<{shipmentId: {value: string}; returnStatus: "COMPLETED"}, void>(
        "/returns/complete",
        {
            shipmentId: {value: shipmentId},
            returnStatus: "COMPLETED",
        },
    );

const validateToken = (request: ReturnTokenValidationRequest) =>
    returningClient.post<ReturnTokenValidationRequest, ReturnTokenValidationResponse>(
        "/returns/token/validate",
        request,
    );

const cancel = (returnPackageId: string) =>
    returningClient.delete<undefined, {status: "OK"}>(`/returns/${returnPackageId}`, undefined);

const ReturnService = {
    cancel,
    changeReasonCode,
    complete,
    create,
    get,
    getAllByDepartment,
    validateToken,
};

export default ReturnService;
