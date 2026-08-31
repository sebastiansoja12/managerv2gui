import {ApiErrorResponse} from "../../api/ApiResult";
import {
    CourierConfigurationDto,
    CourierConfigurationErrorDto,
    CourierConfigurationParameter,
    CourierConfigurationUpdateRequest,
    CourierConfigurationViolationCode,
    CourierLabelFormat,
    CourierSetting,
    CourierSettingDefinitionDto,
    CourierSettingGroup,
    CourierShipmentSortOrder,
} from "./dto/CourierConfigurationDto";

export type CourierConfigurationDraft = {
    settings: Record<CourierSetting, boolean>;
    maxDeliveryAttempts: string;
    maxShipmentsPerRoute: string;
    substituteSupplierCode: string;
    preferredLabelFormat: CourierLabelFormat;
    defaultShipmentSortOrder: CourierShipmentSortOrder;
};

export type CourierConfigurationFieldErrors = Partial<Record<CourierSetting | CourierConfigurationParameter,
    CourierConfigurationViolationCode>>;

export const courierSettingGroups: CourierSettingGroup[] = ["SHIPMENTS", "DELIVERIES", "ROUTES", "RETURNS", "PREFERENCES"];

export const courierLabelFormats: CourierLabelFormat[] = ["PDF_A6", "PDF_A4", "ZPL"];

export const courierShipmentSortOrders: CourierShipmentSortOrder[] = [
    "DELIVERY_ORDER",
    "POSTAL_CODE",
    "RECIPIENT_NAME",
    "ASSIGNED_AT",
];

export const toCourierConfigurationDraft = (configuration: CourierConfigurationDto): CourierConfigurationDraft => ({
    settings: {...configuration.settings},
    maxDeliveryAttempts: String(configuration.maxDeliveryAttempts),
    maxShipmentsPerRoute: configuration.maxShipmentsPerRoute === null ? "" : String(configuration.maxShipmentsPerRoute),
    substituteSupplierCode: configuration.substituteSupplierCode || "",
    preferredLabelFormat: configuration.preferredLabelFormat,
    defaultShipmentSortOrder: configuration.defaultShipmentSortOrder,
});

const parseInteger = (value: string): number | null => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
        return null;
    }

    const parsedValue = Number(trimmedValue);
    return Number.isInteger(parsedValue) ? parsedValue : NaN;
};

export const validateCourierConfigurationDraft = (draft: CourierConfigurationDraft): CourierConfigurationFieldErrors => {
    const fieldErrors: CourierConfigurationFieldErrors = {};
    const maxDeliveryAttempts = parseInteger(draft.maxDeliveryAttempts);
    if (maxDeliveryAttempts === null) {
        fieldErrors.MAX_DELIVERY_ATTEMPTS = "REQUIRED";
    } else if (Number.isNaN(maxDeliveryAttempts) || maxDeliveryAttempts <= 0) {
        fieldErrors.MAX_DELIVERY_ATTEMPTS = "MUST_BE_POSITIVE";
    }

    const maxShipmentsPerRoute = parseInteger(draft.maxShipmentsPerRoute);
    if (maxShipmentsPerRoute !== null && (Number.isNaN(maxShipmentsPerRoute) || maxShipmentsPerRoute <= 0)) {
        fieldErrors.MAX_SHIPMENTS_PER_ROUTE = "MUST_BE_POSITIVE";
    }

    return fieldErrors;
};

export const applyCourierSettingRules = (
    settings: Record<CourierSetting, boolean>,
): Record<CourierSetting, boolean> => (
    settings.REQUIRE_RECIPIENT_SIGNATURE || settings.REQUIRE_DELIVERY_PHOTO
        ? {...settings, REQUIRE_PROOF_OF_DELIVERY: true}
        : settings
);

export const isProofOfDeliveryForced = (settings: Record<CourierSetting, boolean>) => (
    settings.REQUIRE_RECIPIENT_SIGNATURE || settings.REQUIRE_DELIVERY_PHOTO
);

export const toCourierConfigurationUpdateRequest = (
    draft: CourierConfigurationDraft,
    version: number | null,
): CourierConfigurationUpdateRequest => ({
    version,
    settings: draft.settings,
    maxDeliveryAttempts: parseInteger(draft.maxDeliveryAttempts),
    maxShipmentsPerRoute: parseInteger(draft.maxShipmentsPerRoute),
    substituteSupplierCode: draft.substituteSupplierCode.trim() || null,
    preferredLabelFormat: draft.preferredLabelFormat,
    defaultShipmentSortOrder: draft.defaultShipmentSortOrder,
});

export const settingsInGroup = (
    definitions: CourierSettingDefinitionDto[],
    group: CourierSettingGroup,
): CourierSettingDefinitionDto[] => definitions.filter((definition) => definition.group === group);

export const isCourierConfigurationConflict = (error: unknown) => (error as ApiErrorResponse)?.status === 409;

export const toCourierConfigurationFieldErrors = (error: unknown): CourierConfigurationFieldErrors => {
    const details = (error as ApiErrorResponse)?.details as CourierConfigurationErrorDto | undefined;
    if (!details || !Array.isArray(details.fieldErrors)) {
        return {};
    }

    return details.fieldErrors.reduce<CourierConfigurationFieldErrors>((fieldErrors, fieldError) => ({
        ...fieldErrors,
        [fieldError.field]: fieldError.code,
    }), {});
};

export const courierErrorMessage = (error: unknown, fallback: string) => (
    (error as ApiErrorResponse)?.message || fallback
);

export const courierSettingsByGroup: Record<CourierSettingGroup, CourierSetting[]> = {
    SHIPMENTS: [
        "COPY_DEPARTMENT_CODE_FROM_DEVICE",
        "SKIP_INVALID_SHIPMENTS",
        "AUTO_GENERATE_LABELS",
        "REQUIRE_PICKUP_SCAN",
        "REQUIRE_DELIVERY_SCAN",
        "ALLOW_MANUAL_SHIPMENT_ADDITION",
        "ALLOW_SHIPMENT_TRANSFER",
        "ALLOW_SHIPMENT_UNASSIGNMENT",
    ],
    DELIVERIES: [
        "REQUIRE_PROOF_OF_DELIVERY",
        "REQUIRE_RECIPIENT_SIGNATURE",
        "REQUIRE_DELIVERY_PHOTO",
        "REQUIRE_NON_DELIVERY_REASON",
        "ALLOW_DELIVERY_ADDRESS_CHANGE",
    ],
    ROUTES: [
        "ALLOW_DELIVERY_AREA_EDITING",
        "ALLOW_OUT_OF_AREA_DELIVERY",
        "ALLOW_DELIVERY_REORDERING",
        "AUTO_ASSIGN_SHIPMENTS_BY_AREA",
    ],
    RETURNS: [
        "GENERATE_NEW_RETURN_CODES",
        "AUTO_MARK_FOR_RETURN",
        "REQUIRE_RETURN_SCAN",
        "AUTO_GENERATE_RETURN_LABELS",
    ],
    PREFERENCES: [
        "NOTIFY_ABOUT_NEW_SHIPMENTS",
        "NOTIFY_ABOUT_ROUTE_CHANGES",
        "CONFIRM_SHIPMENT_TRANSFER",
    ],
};

export type CourierPolicyMode = "SUPPLIER" | "ENFORCED_ON" | "ENFORCED_OFF";

export const courierPolicyModes: CourierPolicyMode[] = ["SUPPLIER", "ENFORCED_ON", "ENFORCED_OFF"];

export const toCourierPolicyMode = (enforcedValue: boolean | undefined): CourierPolicyMode => {
    if (enforcedValue === undefined) {
        return "SUPPLIER";
    }
    return enforcedValue ? "ENFORCED_ON" : "ENFORCED_OFF";
};
