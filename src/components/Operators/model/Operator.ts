export type Identifier<T extends string | number = string | number> = {
    value: T;
};

export type ShippingCapabilities = {
    supportsDomesticShipping: boolean;
    supportsInternationalShipping: boolean;
    supportsExpressShipping: boolean;
    supportsSameDayDelivery: boolean;
    supportsCashOnDelivery: boolean;
    supportsParcelLockers: boolean;
    supportsPickupPoints: boolean;
    supportsHomeDelivery: boolean;
    supportsSaturdayDelivery: boolean;
    supportsSundayDelivery: boolean;
    supportsReturnShipments: boolean;
    providesTracking: boolean;
    providesInsurance: boolean;
};

export type ShipmentLimits = {
    maxWeight: number;
    minWeight: number;
    maxLength: number;
    maxWidth: number;
    maxHeight: number;
    maxShipmentValue: number;
};

export type DeliveryTimeConfiguration = {
    minDeliveryDays: number;
    maxDeliveryDays: number;
    expressDeliveryDays: number;
    sameDayDeliveryHours: number;
    internationalDeliveryDays: number;
};

export type OperatorConfiguration = {
    shippingCapabilities: ShippingCapabilities;
    shipmentLimits: ShipmentLimits;
    deliveryTimeConfiguration: DeliveryTimeConfiguration;
};

export type Operator = {
    operatorId: Identifier;
    registeringUserId: Identifier<number>;
    taxId: Identifier<string>;
    supportsLockers: boolean;
    supportsInternationalShipping: boolean;
    supportsCashOnDelivery: boolean;
    contactPhone: string;
    contactEmail: string;
    companyName: string;
    contractStartDate: string;
    contractEndDate: string;
    foundedDate: string;
    configuration: OperatorConfiguration;
    status: "ACTIVE" | "INACTIVE" | string;
    createdAt?: string;
    updatedAt?: string;
};

export type CreateOperatorRequest = {
    userFirstName: string;
    userLastName: string;
    username: string;
    password: string;
    language: string;
    email: string;
    taxId: string;
    supportsLockers: boolean;
    supportsInternationalShipping: boolean;
    supportsCashOnDelivery: boolean;
    contactPhone: string;
    contactEmail: string;
    companyName: string;
    contractStartDate: string;
    contractEndDate: string;
    foundedDate: string;
    configuration: OperatorConfiguration;
    geocodingConfiguration: OperatorGeocodingConfigurationDraft;
    firstDepartment: FirstDepartmentDraft;
};

export type UpdateOperatorRequest = {
    taxId: string;
    supportsLockers: boolean;
    supportsInternationalShipping: boolean;
    supportsCashOnDelivery: boolean;
    contactPhone: string;
    contactEmail: string;
    companyName: string;
    contractStartDate: string;
    contractEndDate: string;
    foundedDate: string;
    configuration: OperatorConfiguration;
    status: "ACTIVE" | "INACTIVE" | string;
};

export type OperatorIdResponse = {
    value: number;
};

export type FirstDepartmentDraft = {
    departmentCode: string;
    city: string;
    street: string;
    postalCode: string;
    countryCode: string;
    openingHours: string;
    departmentType: string;
};

export type OperatorGeocodingConfigurationDraft = {
    apiUserName: string;
    apiPassword: string;
    apiKey: string;
    clientNumber: string;
    accessToken: string;
    refreshToken: string;
    enabled: boolean;
    provider: string;
};

export type OperatorDraft = CreateOperatorRequest & {
    operatorId?: string;
    registeringUserId?: number;
    status: "ACTIVE" | "INACTIVE" | string;
};

export const defaultCapabilities: ShippingCapabilities = {
    supportsDomesticShipping: true,
    supportsInternationalShipping: false,
    supportsExpressShipping: false,
    supportsSameDayDelivery: false,
    supportsCashOnDelivery: false,
    supportsParcelLockers: false,
    supportsPickupPoints: true,
    supportsHomeDelivery: true,
    supportsSaturdayDelivery: false,
    supportsSundayDelivery: false,
    supportsReturnShipments: true,
    providesTracking: true,
    providesInsurance: false,
};

export const defaultConfiguration: OperatorConfiguration = {
    shippingCapabilities: defaultCapabilities,
    shipmentLimits: {
        maxWeight: 31.5,
        minWeight: 0.1,
        maxLength: 120,
        maxWidth: 80,
        maxHeight: 80,
        maxShipmentValue: 5000,
    },
    deliveryTimeConfiguration: {
        minDeliveryDays: 1,
        maxDeliveryDays: 3,
        expressDeliveryDays: 1,
        sameDayDeliveryHours: 8,
        internationalDeliveryDays: 7,
    },
};

export const defaultFirstDepartment: FirstDepartmentDraft = {
    departmentCode: "",
    city: "",
    street: "",
    postalCode: "",
    countryCode: "PL",
    openingHours: "08:00-16:00",
    departmentType: "BRANCH",
};

export const defaultGeocodingConfiguration = (provider = ""): OperatorGeocodingConfigurationDraft => ({
    apiUserName: "",
    apiPassword: "",
    apiKey: "",
    clientNumber: "",
    accessToken: "",
    refreshToken: "",
    enabled: true,
    provider,
});

export const createEmptyOperatorDraft = (geocodingProvider = ""): OperatorDraft => ({
    userFirstName: "",
    userLastName: "",
    username: "",
    password: "",
    language: "pl",
    email: "",
    taxId: "",
    supportsLockers: false,
    supportsInternationalShipping: false,
    supportsCashOnDelivery: false,
    contactPhone: "",
    contactEmail: "",
    companyName: "",
    contractStartDate: "",
    contractEndDate: "",
    foundedDate: "",
    configuration: {
        ...defaultConfiguration,
        shippingCapabilities: {...defaultCapabilities},
        shipmentLimits: {...defaultConfiguration.shipmentLimits},
        deliveryTimeConfiguration: {...defaultConfiguration.deliveryTimeConfiguration},
    },
    geocodingConfiguration: defaultGeocodingConfiguration(geocodingProvider),
    firstDepartment: {...defaultFirstDepartment},
    status: "ACTIVE",
});

export const operatorToDraft = (operator: Operator): OperatorDraft => ({
    operatorId: String(operator.operatorId?.value ?? ""),
    registeringUserId: Number(operator.registeringUserId?.value ?? 1),
    userFirstName: "",
    userLastName: "",
    username: "",
    password: "",
    language: "pl",
    email: "",
    taxId: String(operator.taxId?.value ?? ""),
    supportsLockers: Boolean(operator.supportsLockers),
    supportsInternationalShipping: Boolean(operator.supportsInternationalShipping),
    supportsCashOnDelivery: Boolean(operator.supportsCashOnDelivery),
    contactPhone: operator.contactPhone || "",
    contactEmail: operator.contactEmail || "",
    companyName: operator.companyName || "",
    contractStartDate: operator.contractStartDate || "",
    contractEndDate: operator.contractEndDate || "",
    foundedDate: operator.foundedDate || "",
    configuration: operator.configuration || defaultConfiguration,
    geocodingConfiguration: defaultGeocodingConfiguration(),
    firstDepartment: {...defaultFirstDepartment},
    status: operator.status || "ACTIVE",
});

export const draftToOperator = (draft: OperatorDraft): Operator => ({
    operatorId: {value: draft.operatorId || "10000"},
    registeringUserId: {value: draft.registeringUserId || 1},
    taxId: {value: draft.taxId},
    supportsLockers: draft.supportsLockers,
    supportsInternationalShipping: draft.supportsInternationalShipping,
    supportsCashOnDelivery: draft.supportsCashOnDelivery,
    contactPhone: draft.contactPhone,
    contactEmail: draft.contactEmail,
    companyName: draft.companyName,
    contractStartDate: draft.contractStartDate,
    contractEndDate: draft.contractEndDate,
    foundedDate: draft.foundedDate,
    configuration: draft.configuration,
    status: draft.status,
});
