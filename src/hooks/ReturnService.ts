import BackendClient from "../api/BackendClient";
import {
    ReturnCreateRequest,
    CreatedReturnDto,
    ReturnPageDto,
    ReturnPackageDto,
    ReturnReasonCode,
    ReturnTokenValidationRequest,
    ReturnTokenValidationResponse,
} from "../components/Returns/model/ReturnPackage";
import http from "../http-common";

const managerClient = new BackendClient(http);

const create = (request: ReturnCreateRequest) =>
    managerClient.post<{
        shipmentId: ReturnCreateRequest["shipmentId"];
        departmentId: ReturnCreateRequest["departmentId"];
        reason: string;
        reasonCode: string;
    }, CreatedReturnDto[]>("/returns/packages", {
        shipmentId: request.shipmentId,
        departmentId: request.departmentId,
        reason: request.reason,
        reasonCode: request.reasonCode.value,
    });

const get = (returnPackageId: string) =>
    managerClient.get<ReturnPackageDto>(`/returns/packages/${returnPackageId}`);

const getAllByDepartment = async (departmentId: string): Promise<ReturnPackageDto[]> => {
    const pageSize = 100;
    const returnPackages: ReturnPackageDto[] = [];
    let page = 0;
    let totalPages = 1;

    while (page < totalPages) {
        const response = await managerClient.get<ReturnPageDto>("/returns/packages", {
            params: {departmentId, page, size: pageSize},
        });
        returnPackages.push(...response.data.content);
        totalPages = response.data.totalPages;
        page += 1;
    }

    return returnPackages;
};

const changeReasonCode = (returnPackageId: string, reasonCode: ReturnReasonCode) =>
    managerClient.put<{returnPackageId: {value: string}; reasonCode: ReturnReasonCode}, void>(
        "/returns/packages/reason-code",
        {
            returnPackageId: {value: returnPackageId},
            reasonCode,
        },
    );

const process = (returnPackageId: string) =>
    managerClient.put<undefined, void>(`/returns/packages/${returnPackageId}/process`, undefined);

const complete = (returnPackageId: string) =>
    managerClient.put<undefined, void>(`/returns/packages/${returnPackageId}/complete`, undefined);

const validateToken = (request: ReturnTokenValidationRequest) =>
    managerClient.post<{
        shipmentId: {value: string};
        returnToken: {value: string};
    }, ReturnTokenValidationResponse>(
        "/returns/packages/token/validate",
        {
            shipmentId: {value: request.shipmentId},
            returnToken: {value: request.returnToken},
        },
    );

const cancel = (returnPackageId: string) =>
    managerClient.delete<undefined, void>(`/returns/packages/${returnPackageId}`, undefined);

const ReturnService = {
    cancel,
    changeReasonCode,
    complete,
    create,
    get,
    getAllByDepartment,
    process,
    validateToken,
};

export default ReturnService;
