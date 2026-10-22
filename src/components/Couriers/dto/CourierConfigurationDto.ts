export type CourierSettingGroup = "SHIPMENTS" | "DELIVERIES" | "ROUTES" | "RETURNS" | "PREFERENCES";

export type CourierSettingCategory = "PREFERENCE" | "OPERATIONAL_PERMISSION" | "MANDATORY_REQUIREMENT";

export type CourierSetting =
    | "COPY_DEPARTMENT_CODE_FROM_DEVICE"
    | "SKIP_INVALID_SHIPMENTS"
    | "AUTO_GENERATE_LABELS"
    | "REQUIRE_PICKUP_SCAN"
    | "REQUIRE_DELIVERY_SCAN"
    | "ALLOW_MANUAL_SHIPMENT_ADDITION"
    | "ALLOW_SHIPMENT_TRANSFER"
    | "ALLOW_SHIPMENT_UNASSIGNMENT"
    | "REQUIRE_PROOF_OF_DELIVERY"
    | "REQUIRE_RECIPIENT_SIGNATURE"
    | "REQUIRE_DELIVERY_PHOTO"
    | "REQUIRE_NON_DELIVERY_REASON"
    | "ALLOW_DELIVERY_ADDRESS_CHANGE"
    | "ALLOW_DELIVERY_AREA_EDITING"
    | "ALLOW_OUT_OF_AREA_DELIVERY"
    | "ALLOW_DELIVERY_REORDERING"
    | "AUTO_ASSIGN_SHIPMENTS_BY_AREA"
    | "GENERATE_NEW_RETURN_CODES"
    | "AUTO_MARK_FOR_RETURN"
    | "REQUIRE_RETURN_SCAN"
    | "AUTO_GENERATE_RETURN_LABELS"
    | "NOTIFY_ABOUT_NEW_SHIPMENTS"
    | "NOTIFY_ABOUT_ROUTE_CHANGES"
    | "CONFIRM_SHIPMENT_TRANSFER";

export type CourierConfigurationParameter =
    | "MAX_DELIVERY_ATTEMPTS"
    | "MAX_SHIPMENTS_PER_ROUTE"
    | "SUBSTITUTE_SUPPLIER_ID"
    | "PREFERRED_LABEL_FORMAT"
    | "DEFAULT_SHIPMENT_SORT_ORDER";

export type CourierLabelFormat = "PDF_A6" | "PDF_A4" | "ZPL";

export type CourierShipmentSortOrder = "DELIVERY_ORDER" | "POSTAL_CODE" | "RECIPIENT_NAME" | "ASSIGNED_AT";

export type CourierConfigurationViolationCode =
    | "REQUIRED"
    | "MUST_BE_POSITIVE"
    | "SUBSTITUTE_SELF"
    | "SUBSTITUTE_UNAVAILABLE"
    | "ENFORCED_BY_POLICY";

export interface CourierSettingDefinitionDto {
    setting: CourierSetting;
    group: CourierSettingGroup;
    category: CourierSettingCategory;
    defaultValue: boolean;
}

export interface CourierConfigurationDto {
    supplierId: number;
    supplierCode: string;
    firstName: string | null;
    lastName: string | null;
    settings: Record<CourierSetting, boolean>;
    maxDeliveryAttempts: number;
    maxShipmentsPerRoute: number | null;
    substituteSupplierCode: string | null;
    preferredLabelFormat: CourierLabelFormat;
    defaultShipmentSortOrder: CourierShipmentSortOrder;
    enforcedSettings: Partial<Record<CourierSetting, boolean>>;
    definitions: CourierSettingDefinitionDto[];
    version: number | null;
    updatedAt: string | null;
    updatedBy: number | null;
}

export interface CourierConfigurationUpdateRequest {
    version: number | null;
    settings: Record<CourierSetting, boolean>;
    maxDeliveryAttempts: number | null;
    maxShipmentsPerRoute: number | null;
    substituteSupplierCode: string | null;
    preferredLabelFormat: CourierLabelFormat;
    defaultShipmentSortOrder: CourierShipmentSortOrder;
}

export interface CourierConfigurationResetRequest {
    version: number | null;
}

export interface CourierConfigurationChangeDto {
    field: CourierSetting | CourierConfigurationParameter;
    previousValue: string | null;
    newValue: string | null;
}

export interface CourierConfigurationRevisionDto {
    revisionId: string;
    changeType: "UPDATED" | "RESET_TO_DEFAULTS";
    changedBy: number | null;
    changedAt: string;
    changes: CourierConfigurationChangeDto[];
}

export interface SubstituteCourierDto {
    supplierCode: string;
    firstName: string | null;
    lastName: string | null;
}

export interface CourierConfigurationPolicyDto {
    enforcedSettings: Partial<Record<CourierSetting, boolean>>;
    version: number | null;
    updatedAt: string | null;
    updatedBy: number | null;
}

export interface CourierConfigurationPolicyUpdateRequest {
    version: number | null;
    enforcedSettings: Partial<Record<CourierSetting, boolean>>;
}

export interface CourierConfigurationFieldErrorDto {
    field: CourierSetting | CourierConfigurationParameter;
    code: CourierConfigurationViolationCode;
}

export interface CourierConfigurationErrorDto {
    code: string;
    message: string;
    fieldErrors: CourierConfigurationFieldErrorDto[];
}
