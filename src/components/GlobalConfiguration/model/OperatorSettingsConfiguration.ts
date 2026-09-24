export type CustomerLanguageApi = "PL" | "EN" | "DE";

export type RegionalDateFormatApi = "DD_MM_YYYY" | "YYYY_MM_DD" | "MM_DD_YYYY";

export type CurrencyCodeApi = "PLN" | "EUR" | "USD" | "CZK" | "GBP";

export type WeightUnitApi = "KG" | "LB";

export type LengthUnitApi = "CM" | "IN";

export type DuplicateScanPolicyApi = "WARN" | "BLOCK" | "IGNORE";

export type UnresolvedDestinationPolicyApi = "ROUTE_TO_EXCEPTION_RAMP" | "BLOCK";

export type ScanErrorFeedbackApi = "SOUND" | "VIBRATION" | "SOUND_AND_VIBRATION" | "NONE";

export type SortingConfigurationApi = {
    requireInboundScan: boolean;
    requireSortScan: boolean;
    requireOutboundScan: boolean;
    duplicateScanPolicy: DuplicateScanPolicyApi;
    unresolvedDestinationPolicy: UnresolvedDestinationPolicyApi;
    exceptionRampCode: string;
    requireDamagePhotoOnInbound: boolean;
    scanErrorFeedback: ScanErrorFeedbackApi;
    missingInWarehouseAfterHours: number;
};

export type FleetConfigurationApi = {
    vehicleInspectionReminderDays: number;
    vehicleInsuranceReminderDays: number;
    maxDriverShiftHours: number;
    requiredBreakMinutes: number;
    requirePreTripChecklist: boolean;
    gpsPositionIntervalSeconds: number;
    defaultVehiclePalletCapacity: number;
};

export type CommunicationConfigurationApi = {
    senderName: string;
    replyToEmail: string;
    emailFooter: string;
    logoUrl: string;
    accentColor: string;
    defaultCustomerLanguage: CustomerLanguageApi;
    chatMessageRetentionDays: number;
    chatAttachmentsAllowed: boolean;
    chatMaxAttachmentSizeMb: number;
};

export type RegionalConfigurationApi = {
    timeZone: string;
    dateFormat: RegionalDateFormatApi;
    currency: CurrencyCodeApi;
    weightUnit: WeightUnitApi;
    lengthUnit: LengthUnitApi;
    workingDayStart: string;
    workingDayEnd: string;
    saturdayWorkingDay: boolean;
    sundayWorkingDay: boolean;
};

export const defaultFleetConfiguration: FleetConfigurationApi = {
    vehicleInspectionReminderDays: 30,
    vehicleInsuranceReminderDays: 30,
    maxDriverShiftHours: 9,
    requiredBreakMinutes: 45,
    requirePreTripChecklist: true,
    gpsPositionIntervalSeconds: 30,
    defaultVehiclePalletCapacity: 18,
};

export const defaultCommunicationConfiguration: CommunicationConfigurationApi = {
    senderName: "",
    replyToEmail: "",
    emailFooter: "",
    logoUrl: "",
    accentColor: "#1E88E5",
    defaultCustomerLanguage: "PL",
    chatMessageRetentionDays: 365,
    chatAttachmentsAllowed: true,
    chatMaxAttachmentSizeMb: 10,
};

export const defaultRegionalConfiguration: RegionalConfigurationApi = {
    timeZone: "Europe/Warsaw",
    dateFormat: "DD_MM_YYYY",
    currency: "PLN",
    weightUnit: "KG",
    lengthUnit: "CM",
    workingDayStart: "08:00",
    workingDayEnd: "16:00",
    saturdayWorkingDay: false,
    sundayWorkingDay: false,
};

export const defaultSortingConfiguration: SortingConfigurationApi = {
    requireInboundScan: true,
    requireSortScan: true,
    requireOutboundScan: true,
    duplicateScanPolicy: "WARN",
    unresolvedDestinationPolicy: "ROUTE_TO_EXCEPTION_RAMP",
    exceptionRampCode: "",
    requireDamagePhotoOnInbound: true,
    scanErrorFeedback: "SOUND_AND_VIBRATION",
    missingInWarehouseAfterHours: 24,
};

export type PickupPointConfigurationApi = {
    defaultsPolicy: {
        defaultType: "SERVICE_POINT" | "PARCEL_LOCKER";
        defaultDropOffEnabled: boolean;
        defaultCollectionEnabled: boolean;
        servicePointMaxShipmentSize: PickupPointMaxShipmentSizeApi;
        parcelLockerMaxShipmentSize: PickupPointMaxShipmentSizeApi;
        defaultAcceptsDangerousGoods: boolean;
        weekdayOpeningTime: string;
        weekdayClosingTime: string;
        saturdayOpen: boolean;
        saturdayOpeningTime: string;
        saturdayClosingTime: string;
        requireCoordinatesForActivation: boolean;
    };
    collectionPolicy: {
        verificationMethod: "PICKUP_CODE" | "SMS_CODE" | "ID_DOCUMENT";
        pickupCodeLength: number;
        pickupCodeValidityHours: number;
        maxInvalidCodeAttempts: number;
        allowAuthorizedPerson: boolean;
        reminderAfterDays: number;
        allowStorageExtension: boolean;
        storageExtensionDays: number;
    };
    lockerPolicy: {
        courierCompartmentHoldMinutes: number;
        compartmentReservationHours: number;
        oversizedShipmentPolicy: "REDIRECT_TO_SERVICE_POINT" | "RETURN_TO_DEPARTMENT";
        suspendAfterCompartmentFailures: number;
    };
    selectionPolicy: {
        maxDistanceKm: number;
        preference: "NEAREST" | "PARCEL_LOCKER" | "SERVICE_POINT";
        alternativeCount: number;
        fullPointPolicy: "SELECT_NEXT" | "REJECT";
        sameDepartmentOnly: boolean;
    };
    capacityPolicy: {
        defaultCapacity: number;
        capacityWarningThresholdPercent: number;
        blockIntakeWhenFull: boolean;
    };
    lifecyclePolicy: {
        requireStatusChangeReason: boolean;
        suspendedPointShipmentPolicy: "REDIRECT" | "WAIT" | "RETURN";
        blockClosingWithPendingShipments: boolean;
        autoResumeSuspendedAfterDays: number;
    };
};

export type PickupPointMaxShipmentSizeApi = "TINY" | "SMALL" | "MEDIUM" | "AVERAGE" | "BIG";

export type PickupPointPolicyKey = keyof PickupPointConfigurationApi;

export const defaultPickupPointConfiguration: PickupPointConfigurationApi = {
    defaultsPolicy: {
        defaultType: "SERVICE_POINT",
        defaultDropOffEnabled: true,
        defaultCollectionEnabled: true,
        servicePointMaxShipmentSize: "MEDIUM",
        parcelLockerMaxShipmentSize: "AVERAGE",
        defaultAcceptsDangerousGoods: false,
        weekdayOpeningTime: "08:00",
        weekdayClosingTime: "20:00",
        saturdayOpen: true,
        saturdayOpeningTime: "09:00",
        saturdayClosingTime: "14:00",
        requireCoordinatesForActivation: true,
    },
    collectionPolicy: {
        verificationMethod: "PICKUP_CODE",
        pickupCodeLength: 6,
        pickupCodeValidityHours: 72,
        maxInvalidCodeAttempts: 5,
        allowAuthorizedPerson: true,
        reminderAfterDays: 2,
        allowStorageExtension: true,
        storageExtensionDays: 2,
    },
    lockerPolicy: {
        courierCompartmentHoldMinutes: 15,
        compartmentReservationHours: 24,
        oversizedShipmentPolicy: "REDIRECT_TO_SERVICE_POINT",
        suspendAfterCompartmentFailures: 3,
    },
    selectionPolicy: {
        maxDistanceKm: 5,
        preference: "NEAREST",
        alternativeCount: 3,
        fullPointPolicy: "SELECT_NEXT",
        sameDepartmentOnly: false,
    },
    capacityPolicy: {
        defaultCapacity: 200,
        capacityWarningThresholdPercent: 85,
        blockIntakeWhenFull: true,
    },
    lifecyclePolicy: {
        requireStatusChangeReason: true,
        suspendedPointShipmentPolicy: "REDIRECT",
        blockClosingWithPendingShipments: true,
        autoResumeSuspendedAfterDays: 0,
    },
};

export type FlatPickupPointConfiguration = Record<string, string | number | boolean>;

const pickupPointPolicyKeys = Object.keys(defaultPickupPointConfiguration) as PickupPointPolicyKey[];

export const flattenPickupPointConfiguration = (
    configuration: Partial<PickupPointConfigurationApi> | undefined,
): FlatPickupPointConfiguration => Object.assign({}, ...pickupPointPolicyKeys.map((policy) => ({
    ...defaultPickupPointConfiguration[policy],
    ...configuration?.[policy],
})));

export const nestPickupPointConfiguration = (
    configuration: FlatPickupPointConfiguration,
): PickupPointConfigurationApi => Object.fromEntries(pickupPointPolicyKeys.map((policy) => [
    policy,
    Object.fromEntries(Object.keys(defaultPickupPointConfiguration[policy]).map((key) => [key, configuration[key]])),
])) as PickupPointConfigurationApi;
