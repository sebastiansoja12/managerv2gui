import BackendClient from "../api/BackendClient";
import http from "../http-common";
import {
    CourierConfigurationDto,
    CourierConfigurationPolicyDto,
    CourierConfigurationPolicyUpdateRequest,
    CourierConfigurationResetRequest,
    CourierConfigurationRevisionDto,
    CourierConfigurationUpdateRequest,
    SubstituteCourierDto,
} from "../components/Couriers/dto/CourierConfigurationDto";

const client = new BackendClient(http);

const configurationPath = (supplierCode: string | null) => (
    supplierCode === null ? "/suppliers/me/configuration" : `/suppliers/${encodeURIComponent(supplierCode)}/configuration`
);

const get = (supplierCode: string | null) => client.get<CourierConfigurationDto>(configurationPath(supplierCode));

const update = (supplierCode: string | null, request: CourierConfigurationUpdateRequest) => (
    client.put<CourierConfigurationUpdateRequest, CourierConfigurationDto>(configurationPath(supplierCode), request)
);

const resetToDefaults = (supplierCode: string | null, request: CourierConfigurationResetRequest) => (
    client.post<CourierConfigurationResetRequest, CourierConfigurationDto>(
        `${configurationPath(supplierCode)}/reset`,
        request,
    )
);

const getHistory = (supplierCode: string | null) => (
    client.get<CourierConfigurationRevisionDto[]>(`${configurationPath(supplierCode)}/history`)
);

const getSubstituteCandidates = (supplierCode: string | null) => (
    client.get<SubstituteCourierDto[]>(`${configurationPath(supplierCode)}/substitute-candidates`)
);

const getPolicy = () => client.get<CourierConfigurationPolicyDto>("/supplier-configuration-policy");

const updatePolicy = (request: CourierConfigurationPolicyUpdateRequest) => (
    client.put<CourierConfigurationPolicyUpdateRequest, CourierConfigurationPolicyDto>(
        "/supplier-configuration-policy",
        request,
    )
);

const CourierConfigurationService = {
    get,
    update,
    resetToDefaults,
    getHistory,
    getSubstituteCandidates,
    getPolicy,
    updatePolicy,
};

export default CourierConfigurationService;
