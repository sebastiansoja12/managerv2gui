import http from "../http-common";
import {
    GeocodingConfiguration,
    GeocodingConfigurationRequest,
    GeocodingProviderDefinition,
} from "../components/GlobalConfiguration/model/GeocodingConfiguration";

const getAll = () => http.get<GeocodingConfiguration[]>("/geocoding-configurations");

const getProviders = () => http.get<GeocodingProviderDefinition[]>("/geocoding-configurations/providers");

const create = (request: GeocodingConfigurationRequest) => (
    http.post<void>("/geocoding-configurations", request)
);

const update = (configurationId: string, request: GeocodingConfigurationRequest) => (
    http.put<void>(`/geocoding-configurations/${configurationId}`, request)
);

const remove = (configurationId: string) => (
    http.delete<void>(`/geocoding-configurations/${configurationId}`)
);

const GeocodingConfigurationService = {
    create,
    getAll,
    getProviders,
    remove,
    update,
};

export default GeocodingConfigurationService;
