export type GeocodingProvider = string;

export type GeocodingConfigurationField =
    | "API_USER_NAME"
    | "API_PASSWORD"
    | "API_KEY"
    | "CLIENT_NUMBER"
    | "ACCESS_TOKEN"
    | "REFRESH_TOKEN";

export type GeocodingProviderApi = "GEOCODING_API";

export type GeocodingConfigurationId = {
    value: string;
};

export type GeocodingProviderDefinition = {
    provider: GeocodingProvider;
    url: string;
    activeFields: GeocodingConfigurationField[];
    providerApis: GeocodingProviderApi[];
};

export type GeocodingConfiguration = {
    geocodingConfigurationId: GeocodingConfigurationId;
    apiUrl: string | null;
    apiUserName: string | null;
    apiPassword: string | null;
    apiKey: string | null;
    clientNumber: string | null;
    accessToken: string | null;
    refreshToken: string | null;
    enabled: boolean;
    defaultProvider: boolean;
    provider: GeocodingProvider;
};

export type GeocodingConfigurationRequest = Omit<
    GeocodingConfiguration,
    "geocodingConfigurationId" | "apiUrl"
>;
