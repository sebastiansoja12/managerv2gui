import BackendClient from "../api/BackendClient";
import {ApiResult, QueryParams} from "../api/ApiResult";
import {
    EligiblePickupPointQuery,
    PickupPointCreateRequest,
    PickupPointDetails,
    PickupPointPage,
    PickupPointSearchQuery,
    PickupPointStatusRequest,
    PickupPointUpdateRequest,
} from "../components/PickupPoints/model/PickupPoint";
import http from "../http-common";

const client = new BackendClient(http);

const queryParams = (query: PickupPointSearchQuery | EligiblePickupPointQuery): QueryParams => {
    return Object.entries(query).reduce<QueryParams>((parameters, [name, value]) => {
        if (value !== undefined && value !== "") {
            parameters[name] = value;
        }
        return parameters;
    }, {});
};

const search = async (query: PickupPointSearchQuery = {}): Promise<ApiResult<PickupPointPage>> => {
    return client.get<PickupPointPage>("/pickup-points", {params: queryParams(query)});
};

const findEligible = async (query: EligiblePickupPointQuery): Promise<ApiResult<PickupPointPage>> => {
    return client.get<PickupPointPage>("/pickup-points/eligible", {params: queryParams(query)});
};

const getById = async (pickupPointId: string): Promise<ApiResult<PickupPointDetails>> => {
    return client.get<PickupPointDetails>(`/pickup-points/${encodeURIComponent(pickupPointId)}`);
};

const create = async (
    request: PickupPointCreateRequest,
): Promise<ApiResult<PickupPointDetails>> => {
    return client.post<PickupPointCreateRequest, PickupPointDetails>("/pickup-points", request);
};

const update = async (
    pickupPointId: string,
    request: PickupPointUpdateRequest,
): Promise<ApiResult<PickupPointDetails>> => {
    return client.put<PickupPointUpdateRequest, PickupPointDetails>(
        `/pickup-points/${encodeURIComponent(pickupPointId)}`,
        request,
    );
};

const changeStatus = async (
    pickupPointId: string,
    request: PickupPointStatusRequest,
): Promise<ApiResult<PickupPointDetails>> => {
    return client.put<PickupPointStatusRequest, PickupPointDetails>(
        `/pickup-points/${encodeURIComponent(pickupPointId)}/status`,
        request,
    );
};

const PickupPointService = {
    search,
    findEligible,
    getById,
    create,
    update,
    changeStatus,
};

export default PickupPointService;
