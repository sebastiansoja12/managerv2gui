import React, {useEffect, useState} from "react";
import {
    Alert,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    MenuItem,
    Snackbar,
    Switch,
    TextField,
} from "components/ui";
import {CheckCircle, InfoOutlined, Save, Settings} from "components/ui/icons";
import {getBackendErrorMessage} from "../../api/errorMessage";
import {useAuthState} from "../../auth/AuthState";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import pl from "../../i18n/translate";
import {
    CashOnDeliveryPaymentMethodApi,
    DefaultShipmentStatusApi,
    ProofOfDeliveryModeApi,
    ShipmentConfigurationApi,
    ShipmentConfigurationSection,
    ShipmentLabelFormatApi,
    ShipmentNotificationChannelApi,
    ShipmentServiceLevelApi,
    TrackingNumberDateFormatApi,
    TrackingNumberPrefixModeApi,
    TrackingNumberSourceApi,
} from "./model/ShipmentConfiguration";

type ShipmentConfigurationDraft = {
    validateAddressData: boolean;
    requireRecipientPhone: boolean;
    requireRecipientEmail: boolean;
    preventDuplicateTracking: boolean;
    requireSenderReference: boolean;
    validatePostalCode: boolean;
    autoGenerateLabels: boolean;
    includeReturnLabel: boolean;
    attachPackingSlip: boolean;
    labelFormat: string;
    maximumWeightKg: string;
    minimumWeightKg: string;
    maximumLengthCm: string;
    maximumWidthCm: string;
    maximumHeightCm: string;
    maximumShipmentValue: string;
    allowOversized: boolean;
    defaultStatus: string;
    defaultServiceLevel: string;
    autoAssignCourier: boolean;
    autoCloseDelivered: boolean;
    generateTrackingNumber: boolean;
    trackingNumberPrefixMode: TrackingNumberPrefixMode;
    trackingNumberKey: string;
    trackingNumberSeparator: string;
    trackingNumberSource: string;
    trackingNumberRandomLength: string;
    trackingNumberIncludeDate: boolean;
    trackingNumberDateFormat: string;
    trackingNumberUppercase: boolean;
    cancellationWindowMinutes: string;
    pickupCutoffTime: string;
    notifyRecipientOnCreated: boolean;
    notifyRecipientOnDispatched: boolean;
    notifyRecipientOnDelivered: boolean;
    notifySenderOnException: boolean;
    notificationChannel: string;
    requireDeliveryToken: boolean;
    proofOfDelivery: string;
    maxDeliveryAttempts: string;
    allowNeighbourDelivery: boolean;
    allowSafePlaceDelivery: boolean;
    redirectToPickupPointAfterFailure: boolean;
    allowReturns: boolean;
    returnWindowDays: string;
    autoReturnAfterFailedDelivery: boolean;
    pickupPointStorageDays: string;
    requireReturnReason: boolean;
    allowCashOnDelivery: boolean;
    maxCashOnDeliveryAmount: string;
    cashOnDeliveryPaymentMethod: string;
    requireInsuranceAboveValue: string;
    economySlaHours: string;
    standardSlaHours: string;
    expressSlaHours: string;
    flagDelayedAfterHours: string;
    requireExceptionNote: boolean;
    escalateDelaysToDepartmentManager: boolean;
    anonymizeRecipientDataAfterDays: string;
    archiveClosedShipmentsAfterDays: string;
    deliveryPhotoRetentionDays: string;
};

type TrackingNumberPrefixMode = "custom" | "departmentCode" | "none";

type ShipmentConfigurationGroup =
    | "validation"
    | "labels"
    | "limits"
    | "workflow"
    | "notifications"
    | "delivery"
    | "returns"
    | "payments"
    | "sla"
    | "dataRetention";

const groupSections: Record<ShipmentConfigurationGroup, ShipmentConfigurationSection[]> = {
    validation: ["validationConfiguration"],
    labels: ["labelConfiguration"],
    limits: ["shipmentLimits"],
    workflow: ["workflowConfiguration", "trackingNumberRule"],
    notifications: ["notificationConfiguration"],
    delivery: ["deliveryConfiguration"],
    returns: ["returnConfiguration"],
    payments: ["paymentConfiguration"],
    sla: ["slaConfiguration"],
    dataRetention: ["dataRetentionConfiguration"],
};

const sectionDraftFields: Record<ShipmentConfigurationSection, (keyof ShipmentConfigurationDraft)[]> = {
    validationConfiguration: [
        "validateAddressData",
        "requireRecipientPhone",
        "requireRecipientEmail",
        "preventDuplicateTracking",
        "requireSenderReference",
        "validatePostalCode",
    ],
    labelConfiguration: ["autoGenerateLabels", "includeReturnLabel", "attachPackingSlip", "labelFormat"],
    shipmentLimits: [
        "maximumWeightKg",
        "minimumWeightKg",
        "maximumLengthCm",
        "maximumWidthCm",
        "maximumHeightCm",
        "maximumShipmentValue",
        "allowOversized",
    ],
    workflowConfiguration: [
        "defaultStatus",
        "defaultServiceLevel",
        "autoAssignCourier",
        "autoCloseDelivered",
        "generateTrackingNumber",
        "cancellationWindowMinutes",
        "pickupCutoffTime",
    ],
    trackingNumberRule: [
        "trackingNumberPrefixMode",
        "trackingNumberKey",
        "trackingNumberSeparator",
        "trackingNumberSource",
        "trackingNumberRandomLength",
        "trackingNumberIncludeDate",
        "trackingNumberDateFormat",
        "trackingNumberUppercase",
    ],
    notificationConfiguration: [
        "notifyRecipientOnCreated",
        "notifyRecipientOnDispatched",
        "notifyRecipientOnDelivered",
        "notifySenderOnException",
        "notificationChannel",
    ],
    deliveryConfiguration: [
        "requireDeliveryToken",
        "proofOfDelivery",
        "maxDeliveryAttempts",
        "allowNeighbourDelivery",
        "allowSafePlaceDelivery",
        "redirectToPickupPointAfterFailure",
    ],
    returnConfiguration: [
        "allowReturns",
        "returnWindowDays",
        "autoReturnAfterFailedDelivery",
        "pickupPointStorageDays",
        "requireReturnReason",
    ],
    paymentConfiguration: [
        "allowCashOnDelivery",
        "maxCashOnDeliveryAmount",
        "cashOnDeliveryPaymentMethod",
        "requireInsuranceAboveValue",
    ],
    slaConfiguration: [
        "economySlaHours",
        "standardSlaHours",
        "expressSlaHours",
        "flagDelayedAfterHours",
        "requireExceptionNote",
        "escalateDelaysToDepartmentManager",
    ],
    dataRetentionConfiguration: [
        "anonymizeRecipientDataAfterDays",
        "archiveClosedShipmentsAfterDays",
        "deliveryPhotoRetentionDays",
    ],
};

const groupDraftFields = (group: ShipmentConfigurationGroup) => (
    groupSections[group].flatMap((section) => sectionDraftFields[section])
);

const pickDraftFields = (configuration: ShipmentConfigurationDraft, fields: (keyof ShipmentConfigurationDraft)[]) => (
    Object.fromEntries(fields.map((field) => [field, configuration[field]])) as Partial<ShipmentConfigurationDraft>
);

type BooleanSettingKey = {
    [Key in keyof ShipmentConfigurationDraft]: ShipmentConfigurationDraft[Key] extends boolean ? Key : never;
}[keyof ShipmentConfigurationDraft];

type TextSettingKey = Exclude<keyof ShipmentConfigurationDraft, BooleanSettingKey>;

type SettingOption = {
    label: string;
    value: string;
};

type TrackingNumberRuleDraft = Pick<ShipmentConfigurationDraft,
    | "trackingNumberPrefixMode"
    | "trackingNumberKey"
    | "trackingNumberSeparator"
    | "trackingNumberSource"
    | "trackingNumberRandomLength"
    | "trackingNumberIncludeDate"
    | "trackingNumberDateFormat"
    | "trackingNumberUppercase"
>;

const SHIPMENT_CONFIGURATION_STORAGE_KEY = "manager.globalConfiguration.shipments";

const defaultShipmentConfiguration: ShipmentConfigurationDraft = {
    validateAddressData: true,
    requireRecipientPhone: true,
    requireRecipientEmail: false,
    preventDuplicateTracking: true,
    requireSenderReference: false,
    validatePostalCode: true,
    autoGenerateLabels: false,
    includeReturnLabel: false,
    attachPackingSlip: false,
    labelFormat: "pdfA6",
    maximumWeightKg: "31.5",
    minimumWeightKg: "0.2",
    maximumLengthCm: "120",
    maximumWidthCm: "80",
    maximumHeightCm: "80",
    maximumShipmentValue: "5000",
    allowOversized: false,
    defaultStatus: "created",
    defaultServiceLevel: "standard",
    autoAssignCourier: false,
    autoCloseDelivered: true,
    generateTrackingNumber: false,
    trackingNumberPrefixMode: "custom",
    trackingNumberKey: "MGR",
    trackingNumberSeparator: "-",
    trackingNumberSource: "sequence",
    trackingNumberRandomLength: "8",
    trackingNumberIncludeDate: true,
    trackingNumberDateFormat: "yyyyMMdd",
    trackingNumberUppercase: true,
    cancellationWindowMinutes: "30",
    pickupCutoffTime: "16:00",
    notifyRecipientOnCreated: true,
    notifyRecipientOnDispatched: true,
    notifyRecipientOnDelivered: true,
    notifySenderOnException: true,
    notificationChannel: "sms",
    requireDeliveryToken: false,
    proofOfDelivery: "signature",
    maxDeliveryAttempts: "2",
    allowNeighbourDelivery: false,
    allowSafePlaceDelivery: false,
    redirectToPickupPointAfterFailure: true,
    allowReturns: true,
    returnWindowDays: "14",
    autoReturnAfterFailedDelivery: true,
    pickupPointStorageDays: "7",
    requireReturnReason: false,
    allowCashOnDelivery: true,
    maxCashOnDeliveryAmount: "5000",
    cashOnDeliveryPaymentMethod: "both",
    requireInsuranceAboveValue: "0",
    economySlaHours: "96",
    standardSlaHours: "48",
    expressSlaHours: "24",
    flagDelayedAfterHours: "24",
    requireExceptionNote: true,
    escalateDelaysToDepartmentManager: false,
    anonymizeRecipientDataAfterDays: "365",
    archiveClosedShipmentsAfterDays: "90",
    deliveryPhotoRetentionDays: "180",
};

const labelFormatFromApi: Record<ShipmentLabelFormatApi, string> = {
    PDF_A6: "pdfA6",
    PDF_A4: "pdfA4",
    ZPL: "zpl",
};

const labelFormatToApi: Record<string, ShipmentLabelFormatApi> = {
    pdfA6: "PDF_A6",
    pdfA4: "PDF_A4",
    zpl: "ZPL",
};

const shipmentStatusFromApi: Record<DefaultShipmentStatusApi, string> = {
    CREATED: "created",
    PREPARED: "prepared",
};

const shipmentStatusToApi: Record<string, DefaultShipmentStatusApi> = {
    created: "CREATED",
    prepared: "PREPARED",
};

const serviceLevelFromApi: Record<ShipmentServiceLevelApi, string> = {
    ECONOMY: "economy",
    STANDARD: "standard",
    EXPRESS: "express",
};

const serviceLevelToApi: Record<string, ShipmentServiceLevelApi> = {
    economy: "ECONOMY",
    standard: "STANDARD",
    express: "EXPRESS",
};

const trackingPrefixModeFromApi: Record<TrackingNumberPrefixModeApi, TrackingNumberPrefixMode> = {
    CUSTOM: "custom",
    DEPARTMENT_CODE: "departmentCode",
    NONE: "none",
};

const trackingPrefixModeToApi: Record<TrackingNumberPrefixMode, TrackingNumberPrefixModeApi> = {
    custom: "CUSTOM",
    departmentCode: "DEPARTMENT_CODE",
    none: "NONE",
};

const trackingSourceFromApi: Record<TrackingNumberSourceApi, string> = {
    SEQUENCE: "sequence",
    SHIPMENT_ID: "shipmentId",
    RANDOM: "random",
};

const trackingSourceToApi: Record<string, TrackingNumberSourceApi> = {
    sequence: "SEQUENCE",
    shipmentId: "SHIPMENT_ID",
    random: "RANDOM",
};

const trackingDateFormatFromApi: Record<TrackingNumberDateFormatApi, string> = {
    YYYYMMDD: "yyyyMMdd",
    YYMMDD: "yyMMdd",
    YYYYMM: "yyyyMM",
};

const trackingDateFormatToApi: Record<string, TrackingNumberDateFormatApi> = {
    yyyyMMdd: "YYYYMMDD",
    yyMMdd: "YYMMDD",
    yyyyMM: "YYYYMM",
};

const notificationChannelFromApi: Record<ShipmentNotificationChannelApi, string> = {
    SMS: "sms",
    EMAIL: "email",
    BOTH: "both",
};

const notificationChannelToApi: Record<string, ShipmentNotificationChannelApi> = {
    sms: "SMS",
    email: "EMAIL",
    both: "BOTH",
};

const proofOfDeliveryFromApi: Record<ProofOfDeliveryModeApi, string> = {
    NONE: "none",
    SIGNATURE: "signature",
    PHOTO: "photo",
    SIGNATURE_AND_PHOTO: "signatureAndPhoto",
};

const proofOfDeliveryToApi: Record<string, ProofOfDeliveryModeApi> = {
    none: "NONE",
    signature: "SIGNATURE",
    photo: "PHOTO",
    signatureAndPhoto: "SIGNATURE_AND_PHOTO",
};

const cashOnDeliveryPaymentMethodFromApi: Record<CashOnDeliveryPaymentMethodApi, string> = {
    CASH: "cash",
    CARD: "card",
    BOTH: "both",
};

const cashOnDeliveryPaymentMethodToApi: Record<string, CashOnDeliveryPaymentMethodApi> = {
    cash: "CASH",
    card: "CARD",
    both: "BOTH",
};

const getTrackingNumberRule = (configuration: ShipmentConfigurationDraft): TrackingNumberRuleDraft => ({
    trackingNumberPrefixMode: configuration.trackingNumberPrefixMode,
    trackingNumberKey: configuration.trackingNumberKey,
    trackingNumberSeparator: configuration.trackingNumberSeparator,
    trackingNumberSource: configuration.trackingNumberSource,
    trackingNumberRandomLength: configuration.trackingNumberRandomLength,
    trackingNumberIncludeDate: configuration.trackingNumberIncludeDate,
    trackingNumberDateFormat: configuration.trackingNumberDateFormat,
    trackingNumberUppercase: configuration.trackingNumberUppercase,
});

const getTrackingDatePreview = (format: string) => {
    const year = "2026";
    const month = "08";
    const day = "14";
    if (format === "yyMMdd") return `${year.slice(-2)}${month}${day}`;
    if (format === "yyyyMM") return `${year}${month}`;
    return `${year}${month}${day}`;
};

const getTrackingSourcePreview = (rule: TrackingNumberRuleDraft) => {
    if (rule.trackingNumberSource === "shipmentId") return "582104";
    if (rule.trackingNumberSource === "random") {
        const requestedLength = Number(rule.trackingNumberRandomLength);
        const length = Number.isFinite(requestedLength) ? Math.min(16, Math.max(4, requestedLength)) : 8;
        return "7K9M2P4X8N6R3T5Q".slice(0, length);
    }
    return "000042";
};

const getTrackingNumberPrefix = (rule: TrackingNumberRuleDraft, departmentCode: string) => {
    if (rule.trackingNumberPrefixMode === "none") return "";
    if (rule.trackingNumberPrefixMode === "departmentCode") return departmentCode.trim();
    return rule.trackingNumberKey.trim();
};

const buildTrackingNumberPreview = (rule: TrackingNumberRuleDraft, departmentCode: string) => {
    const parts = [
        getTrackingNumberPrefix(rule, departmentCode),
        rule.trackingNumberIncludeDate ? getTrackingDatePreview(rule.trackingNumberDateFormat) : "",
        getTrackingSourcePreview(rule),
    ].filter(Boolean);
    const trackingNumber = parts.join(rule.trackingNumberSeparator);
    return rule.trackingNumberUppercase ? trackingNumber.toUpperCase() : trackingNumber;
};

const readShipmentConfiguration = (): ShipmentConfigurationDraft => {
    try {
        const storedValue = window.localStorage.getItem(SHIPMENT_CONFIGURATION_STORAGE_KEY);
        if (!storedValue) {
            return defaultShipmentConfiguration;
        }

        const parsedConfiguration = JSON.parse(storedValue) as Partial<ShipmentConfigurationDraft>;
        return {
            ...defaultShipmentConfiguration,
            ...parsedConfiguration,
            trackingNumberPrefixMode: parsedConfiguration.trackingNumberPrefixMode
                || (parsedConfiguration.trackingNumberKey?.trim() === "" ? "none" : "custom"),
        };
    } catch {
        return defaultShipmentConfiguration;
    }
};

const toTextNumber = (value: number | null | undefined, fallback: string) => (
    Number.isFinite(value) ? String(value) : fallback
);

const toApiNumber = (value: string, fallback: string) => {
    const parsedValue = Number(value);
    if (Number.isFinite(parsedValue)) {
        return parsedValue;
    }

    return Number(fallback);
};

const mapApiToDraft = (
    configuration: ShipmentConfigurationApi,
    departmentCode: string,
): ShipmentConfigurationDraft => {
    const trackingNumberKey = configuration.trackingNumberRule?.key
        ?? defaultShipmentConfiguration.trackingNumberKey;
    const normalizedDepartmentCode = departmentCode.trim().toUpperCase();
    const normalizedTrackingNumberKey = trackingNumberKey.trim().toUpperCase();
    const trackingNumberPrefixMode: TrackingNumberPrefixMode = configuration.trackingNumberRule?.prefixMode
        ? trackingPrefixModeFromApi[configuration.trackingNumberRule.prefixMode]
        : !normalizedTrackingNumberKey
            ? "none"
            : normalizedDepartmentCode && normalizedTrackingNumberKey === normalizedDepartmentCode
                ? "departmentCode"
                : "custom";

    return {
        validateAddressData: Boolean(configuration.validationConfiguration?.validateAddressData),
        requireRecipientPhone: Boolean(configuration.validationConfiguration?.requireRecipientPhone),
        requireRecipientEmail: Boolean(configuration.validationConfiguration?.requireRecipientEmail),
        preventDuplicateTracking: Boolean(configuration.validationConfiguration?.preventDuplicateTracking),
        requireSenderReference: Boolean(configuration.validationConfiguration?.requireSenderReference),
        validatePostalCode: Boolean(configuration.validationConfiguration?.validatePostalCode),
        autoGenerateLabels: Boolean(configuration.labelConfiguration?.autoGenerateLabels),
        includeReturnLabel: Boolean(configuration.labelConfiguration?.includeReturnLabel),
        attachPackingSlip: Boolean(configuration.labelConfiguration?.attachPackingSlip),
        labelFormat: labelFormatFromApi[configuration.labelConfiguration?.labelFormat]
            || defaultShipmentConfiguration.labelFormat,
        maximumWeightKg: toTextNumber(
            configuration.shipmentLimits?.maxWeight,
            defaultShipmentConfiguration.maximumWeightKg,
        ),
        minimumWeightKg: toTextNumber(
            configuration.shipmentLimits?.minWeight,
            defaultShipmentConfiguration.minimumWeightKg,
        ),
        maximumLengthCm: toTextNumber(
            configuration.shipmentLimits?.maxLength,
            defaultShipmentConfiguration.maximumLengthCm,
        ),
        maximumWidthCm: toTextNumber(
            configuration.shipmentLimits?.maxWidth,
            defaultShipmentConfiguration.maximumWidthCm,
        ),
        maximumHeightCm: toTextNumber(
            configuration.shipmentLimits?.maxHeight,
            defaultShipmentConfiguration.maximumHeightCm,
        ),
        maximumShipmentValue: toTextNumber(
            configuration.shipmentLimits?.maxShipmentValue,
            defaultShipmentConfiguration.maximumShipmentValue,
        ),
        allowOversized: Boolean(configuration.shipmentLimits?.allowOversized),
        defaultStatus: shipmentStatusFromApi[configuration.workflowConfiguration?.defaultStatus]
            || defaultShipmentConfiguration.defaultStatus,
        defaultServiceLevel: serviceLevelFromApi[configuration.workflowConfiguration?.defaultServiceLevel]
            || defaultShipmentConfiguration.defaultServiceLevel,
        autoAssignCourier: Boolean(configuration.workflowConfiguration?.autoAssignCourier),
        autoCloseDelivered: Boolean(configuration.workflowConfiguration?.autoCloseDelivered),
        generateTrackingNumber: Boolean(configuration.workflowConfiguration?.generateTrackingNumber),
        trackingNumberPrefixMode,
        trackingNumberKey,
        trackingNumberSeparator: configuration.trackingNumberRule?.separator
            ?? defaultShipmentConfiguration.trackingNumberSeparator,
        trackingNumberSource: trackingSourceFromApi[configuration.trackingNumberRule?.source]
            || defaultShipmentConfiguration.trackingNumberSource,
        trackingNumberRandomLength: toTextNumber(
            configuration.trackingNumberRule?.randomLength,
            defaultShipmentConfiguration.trackingNumberRandomLength,
        ),
        trackingNumberIncludeDate: Boolean(configuration.trackingNumberRule?.includeDate),
        trackingNumberDateFormat: trackingDateFormatFromApi[configuration.trackingNumberRule?.dateFormat]
            || defaultShipmentConfiguration.trackingNumberDateFormat,
        trackingNumberUppercase: Boolean(configuration.trackingNumberRule?.uppercase),
        cancellationWindowMinutes: toTextNumber(
            configuration.workflowConfiguration?.cancellationWindowMinutes,
            defaultShipmentConfiguration.cancellationWindowMinutes,
        ),
        pickupCutoffTime: configuration.workflowConfiguration?.pickupCutoffTime
            || defaultShipmentConfiguration.pickupCutoffTime,
        notifyRecipientOnCreated: Boolean(configuration.notificationConfiguration?.notifyRecipientOnCreated),
        notifyRecipientOnDispatched: Boolean(configuration.notificationConfiguration?.notifyRecipientOnDispatched),
        notifyRecipientOnDelivered: Boolean(configuration.notificationConfiguration?.notifyRecipientOnDelivered),
        notifySenderOnException: Boolean(configuration.notificationConfiguration?.notifySenderOnException),
        notificationChannel: notificationChannelFromApi[configuration.notificationConfiguration?.notificationChannel]
            || defaultShipmentConfiguration.notificationChannel,
        requireDeliveryToken: configuration.deliveryConfiguration?.requireDeliveryToken ?? defaultShipmentConfiguration.requireDeliveryToken,
        proofOfDelivery: proofOfDeliveryFromApi[configuration.deliveryConfiguration?.proofOfDelivery]
            || defaultShipmentConfiguration.proofOfDelivery,
        maxDeliveryAttempts: toTextNumber(configuration.deliveryConfiguration?.maxDeliveryAttempts, defaultShipmentConfiguration.maxDeliveryAttempts),
        allowNeighbourDelivery: configuration.deliveryConfiguration?.allowNeighbourDelivery ?? defaultShipmentConfiguration.allowNeighbourDelivery,
        allowSafePlaceDelivery: configuration.deliveryConfiguration?.allowSafePlaceDelivery ?? defaultShipmentConfiguration.allowSafePlaceDelivery,
        redirectToPickupPointAfterFailure: configuration.deliveryConfiguration?.redirectToPickupPointAfterFailure ?? defaultShipmentConfiguration.redirectToPickupPointAfterFailure,
        allowReturns: configuration.returnConfiguration?.allowReturns ?? defaultShipmentConfiguration.allowReturns,
        returnWindowDays: toTextNumber(configuration.returnConfiguration?.returnWindowDays, defaultShipmentConfiguration.returnWindowDays),
        autoReturnAfterFailedDelivery: configuration.returnConfiguration?.autoReturnAfterFailedDelivery ?? defaultShipmentConfiguration.autoReturnAfterFailedDelivery,
        pickupPointStorageDays: toTextNumber(configuration.returnConfiguration?.pickupPointStorageDays, defaultShipmentConfiguration.pickupPointStorageDays),
        requireReturnReason: configuration.returnConfiguration?.requireReturnReason ?? defaultShipmentConfiguration.requireReturnReason,
        allowCashOnDelivery: configuration.paymentConfiguration?.allowCashOnDelivery ?? defaultShipmentConfiguration.allowCashOnDelivery,
        maxCashOnDeliveryAmount: toTextNumber(configuration.paymentConfiguration?.maxCashOnDeliveryAmount, defaultShipmentConfiguration.maxCashOnDeliveryAmount),
        cashOnDeliveryPaymentMethod: cashOnDeliveryPaymentMethodFromApi[configuration.paymentConfiguration?.cashOnDeliveryPaymentMethod]
            || defaultShipmentConfiguration.cashOnDeliveryPaymentMethod,
        requireInsuranceAboveValue: toTextNumber(configuration.paymentConfiguration?.requireInsuranceAboveValue, defaultShipmentConfiguration.requireInsuranceAboveValue),
        economySlaHours: toTextNumber(configuration.slaConfiguration?.economySlaHours, defaultShipmentConfiguration.economySlaHours),
        standardSlaHours: toTextNumber(configuration.slaConfiguration?.standardSlaHours, defaultShipmentConfiguration.standardSlaHours),
        expressSlaHours: toTextNumber(configuration.slaConfiguration?.expressSlaHours, defaultShipmentConfiguration.expressSlaHours),
        flagDelayedAfterHours: toTextNumber(configuration.slaConfiguration?.flagDelayedAfterHours, defaultShipmentConfiguration.flagDelayedAfterHours),
        requireExceptionNote: configuration.slaConfiguration?.requireExceptionNote ?? defaultShipmentConfiguration.requireExceptionNote,
        escalateDelaysToDepartmentManager: configuration.slaConfiguration?.escalateDelaysToDepartmentManager ?? defaultShipmentConfiguration.escalateDelaysToDepartmentManager,
        anonymizeRecipientDataAfterDays: toTextNumber(configuration.dataRetentionConfiguration?.anonymizeRecipientDataAfterDays, defaultShipmentConfiguration.anonymizeRecipientDataAfterDays),
        archiveClosedShipmentsAfterDays: toTextNumber(configuration.dataRetentionConfiguration?.archiveClosedShipmentsAfterDays, defaultShipmentConfiguration.archiveClosedShipmentsAfterDays),
        deliveryPhotoRetentionDays: toTextNumber(configuration.dataRetentionConfiguration?.deliveryPhotoRetentionDays, defaultShipmentConfiguration.deliveryPhotoRetentionDays),
    };
};

const mapDraftToApi = (
    configuration: ShipmentConfigurationDraft,
    departmentCode: string,
): ShipmentConfigurationApi => ({
    validationConfiguration: {
        validateAddressData: configuration.validateAddressData,
        requireRecipientPhone: configuration.requireRecipientPhone,
        requireRecipientEmail: configuration.requireRecipientEmail,
        preventDuplicateTracking: configuration.preventDuplicateTracking,
        requireSenderReference: configuration.requireSenderReference,
        validatePostalCode: configuration.validatePostalCode,
    },
    labelConfiguration: {
        autoGenerateLabels: configuration.autoGenerateLabels,
        includeReturnLabel: configuration.includeReturnLabel,
        attachPackingSlip: configuration.attachPackingSlip,
        labelFormat: labelFormatToApi[configuration.labelFormat] || "PDF_A6",
    },
    shipmentLimits: {
        maxWeight: toApiNumber(configuration.maximumWeightKg, defaultShipmentConfiguration.maximumWeightKg),
        minWeight: toApiNumber(configuration.minimumWeightKg, defaultShipmentConfiguration.minimumWeightKg),
        maxLength: toApiNumber(configuration.maximumLengthCm, defaultShipmentConfiguration.maximumLengthCm),
        maxWidth: toApiNumber(configuration.maximumWidthCm, defaultShipmentConfiguration.maximumWidthCm),
        maxHeight: toApiNumber(configuration.maximumHeightCm, defaultShipmentConfiguration.maximumHeightCm),
        maxShipmentValue: toApiNumber(
            configuration.maximumShipmentValue,
            defaultShipmentConfiguration.maximumShipmentValue,
        ),
        allowOversized: configuration.allowOversized,
    },
    workflowConfiguration: {
        defaultStatus: shipmentStatusToApi[configuration.defaultStatus] || "CREATED",
        defaultServiceLevel: serviceLevelToApi[configuration.defaultServiceLevel] || "STANDARD",
        autoAssignCourier: configuration.autoAssignCourier,
        autoCloseDelivered: configuration.autoCloseDelivered,
        generateTrackingNumber: configuration.generateTrackingNumber,
        cancellationWindowMinutes: toApiNumber(
            configuration.cancellationWindowMinutes,
            defaultShipmentConfiguration.cancellationWindowMinutes,
        ),
        pickupCutoffTime: configuration.pickupCutoffTime,
    },
    trackingNumberRule: {
        prefixMode: trackingPrefixModeToApi[configuration.trackingNumberPrefixMode],
        key: getTrackingNumberPrefix(getTrackingNumberRule(configuration), departmentCode),
        separator: configuration.trackingNumberSeparator,
        source: trackingSourceToApi[configuration.trackingNumberSource] || "SEQUENCE",
        randomLength: toApiNumber(
            configuration.trackingNumberRandomLength,
            defaultShipmentConfiguration.trackingNumberRandomLength,
        ),
        includeDate: configuration.trackingNumberIncludeDate,
        dateFormat: trackingDateFormatToApi[configuration.trackingNumberDateFormat] || "YYYYMMDD",
        uppercase: configuration.trackingNumberUppercase,
    },
    notificationConfiguration: {
        notifyRecipientOnCreated: configuration.notifyRecipientOnCreated,
        notifyRecipientOnDispatched: configuration.notifyRecipientOnDispatched,
        notifyRecipientOnDelivered: configuration.notifyRecipientOnDelivered,
        notifySenderOnException: configuration.notifySenderOnException,
        notificationChannel: notificationChannelToApi[configuration.notificationChannel] || "SMS",
    },
    deliveryConfiguration: {
        requireDeliveryToken: configuration.requireDeliveryToken,
        proofOfDelivery: proofOfDeliveryToApi[configuration.proofOfDelivery] || "SIGNATURE",
        maxDeliveryAttempts: toApiNumber(configuration.maxDeliveryAttempts, defaultShipmentConfiguration.maxDeliveryAttempts),
        allowNeighbourDelivery: configuration.allowNeighbourDelivery,
        allowSafePlaceDelivery: configuration.allowSafePlaceDelivery,
        redirectToPickupPointAfterFailure: configuration.redirectToPickupPointAfterFailure,
    },
    returnConfiguration: {
        allowReturns: configuration.allowReturns,
        returnWindowDays: toApiNumber(configuration.returnWindowDays, defaultShipmentConfiguration.returnWindowDays),
        autoReturnAfterFailedDelivery: configuration.autoReturnAfterFailedDelivery,
        pickupPointStorageDays: toApiNumber(configuration.pickupPointStorageDays, defaultShipmentConfiguration.pickupPointStorageDays),
        requireReturnReason: configuration.requireReturnReason,
    },
    paymentConfiguration: {
        allowCashOnDelivery: configuration.allowCashOnDelivery,
        maxCashOnDeliveryAmount: toApiNumber(configuration.maxCashOnDeliveryAmount, defaultShipmentConfiguration.maxCashOnDeliveryAmount),
        cashOnDeliveryPaymentMethod: cashOnDeliveryPaymentMethodToApi[configuration.cashOnDeliveryPaymentMethod] || "BOTH",
        requireInsuranceAboveValue: toApiNumber(configuration.requireInsuranceAboveValue, defaultShipmentConfiguration.requireInsuranceAboveValue),
    },
    slaConfiguration: {
        economySlaHours: toApiNumber(configuration.economySlaHours, defaultShipmentConfiguration.economySlaHours),
        standardSlaHours: toApiNumber(configuration.standardSlaHours, defaultShipmentConfiguration.standardSlaHours),
        expressSlaHours: toApiNumber(configuration.expressSlaHours, defaultShipmentConfiguration.expressSlaHours),
        flagDelayedAfterHours: toApiNumber(configuration.flagDelayedAfterHours, defaultShipmentConfiguration.flagDelayedAfterHours),
        requireExceptionNote: configuration.requireExceptionNote,
        escalateDelaysToDepartmentManager: configuration.escalateDelaysToDepartmentManager,
    },
    dataRetentionConfiguration: {
        anonymizeRecipientDataAfterDays: toApiNumber(configuration.anonymizeRecipientDataAfterDays, defaultShipmentConfiguration.anonymizeRecipientDataAfterDays),
        archiveClosedShipmentsAfterDays: toApiNumber(configuration.archiveClosedShipmentsAfterDays, defaultShipmentConfiguration.archiveClosedShipmentsAfterDays),
        deliveryPhotoRetentionDays: toApiNumber(configuration.deliveryPhotoRetentionDays, defaultShipmentConfiguration.deliveryPhotoRetentionDays),
    },
});

export type ShipmentConfigurationSource = {
    load: () => Promise<ShipmentConfigurationApi>;
    save: (
        section: ShipmentConfigurationSection,
        configuration: ShipmentConfigurationApi,
    ) => Promise<ShipmentConfigurationApi>;
};

type ShipmentConfigurationPanelProps = {
    source?: ShipmentConfigurationSource;
    departmentCode?: string;
    persistLocally?: boolean;
};

const currentOperatorSource: ShipmentConfigurationSource = {
    load: async () => (await OperatorConfigurationService.getCurrentShipmentConfiguration()).data,
    save: async (section, configuration) => (
        await OperatorConfigurationService.updateCurrentShipmentConfigurationSection(section, configuration[section])
    ).data,
};

const rememberConfiguration = (persistLocally: boolean, configuration: ShipmentConfigurationDraft) => {
    if (!persistLocally) {
        return;
    }
    try {
        window.localStorage.setItem(SHIPMENT_CONFIGURATION_STORAGE_KEY, JSON.stringify(configuration));
    } catch {
        // Local cache is only a convenience for the current browser.
    }
};

export function ShipmentConfigurationPanel({
    source = currentOperatorSource,
    departmentCode: departmentCodeOverride,
    persistLocally = true,
}: ShipmentConfigurationPanelProps = {}) {
    const {user} = useAuthState();
    const departmentCode = departmentCodeOverride ?? user?.departmentCode ?? "";
    const [configuration, setConfiguration] = useState<ShipmentConfigurationDraft>(
        () => persistLocally ? readShipmentConfiguration() : defaultShipmentConfiguration,
    );
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [persistedConfiguration, setPersistedConfiguration] = useState<ShipmentConfigurationApi | null>(null);
    const [savingGroup, setSavingGroup] = useState<ShipmentConfigurationGroup | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [trackingNumberDialogOpen, setTrackingNumberDialogOpen] = useState(false);
    const [trackingNumberRuleDraft, setTrackingNumberRuleDraft] = useState<TrackingNumberRuleDraft>(
        getTrackingNumberRule(defaultShipmentConfiguration),
    );
    const shipmentConfiguration = pl.globalConfiguration.shipmentConfiguration;
    const trackingNumberPreview = buildTrackingNumberPreview(getTrackingNumberRule(configuration), departmentCode);
    const trackingNumberDraftPreview = buildTrackingNumberPreview(trackingNumberRuleDraft, departmentCode);
    const trackingNumberPrefixInvalid = (
        trackingNumberRuleDraft.trackingNumberPrefixMode === "custom"
        && !trackingNumberRuleDraft.trackingNumberKey.trim()
    ) || (
        trackingNumberRuleDraft.trackingNumberPrefixMode === "departmentCode"
        && !departmentCode.trim()
    );

    useEffect(() => {
        let active = true;

        const loadConfiguration = async () => {
            try {
                setLoading(true);
                setError(null);
                const loadedConfiguration = await source.load();
                if (!active) {
                    return;
                }

                const nextConfiguration = mapApiToDraft(loadedConfiguration, departmentCode);
                setPersistedConfiguration(loadedConfiguration);
                setConfiguration(nextConfiguration);
                rememberConfiguration(persistLocally, nextConfiguration);
            } catch (exception) {
                if (active) {
                    setError(getBackendErrorMessage(
                        exception,
                        shipmentConfiguration.messages.loadError,
                    ));
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadConfiguration();

        return () => {
            active = false;
        };
    }, [departmentCode, persistLocally, shipmentConfiguration.messages.loadError, source]);

    const updateConfiguration = <Key extends keyof ShipmentConfigurationDraft>(
        field: Key,
        value: ShipmentConfigurationDraft[Key],
    ) => {
        setConfiguration((currentConfiguration) => ({
            ...currentConfiguration,
            [field]: value,
        }));
        setSaved(false);
    };

    const isSectionChanged = (section: ShipmentConfigurationSection) => {
        if (!persistedConfiguration) {
            return true;
        }
        const fields = sectionDraftFields[section];
        return JSON.stringify(pickDraftFields(configuration, fields))
            !== JSON.stringify(pickDraftFields(mapApiToDraft(persistedConfiguration, departmentCode), fields));
    };

    const isGroupChanged = (group: ShipmentConfigurationGroup) => groupSections[group].some(isSectionChanged);

    const saveGroup = async (group: ShipmentConfigurationGroup) => {
        try {
            setSavingGroup(group);
            setError(null);
            const draftConfiguration = mapDraftToApi(configuration, departmentCode);
            let savedConfiguration = persistedConfiguration ?? draftConfiguration;
            for (const section of groupSections[group].filter(isSectionChanged)) {
                savedConfiguration = await source.save(section, {
                    ...savedConfiguration,
                    [section]: draftConfiguration[section],
                });
            }
            const savedDraft = mapApiToDraft(savedConfiguration, departmentCode);
            const savedGroupFields = pickDraftFields(savedDraft, groupDraftFields(group));
            setPersistedConfiguration(savedConfiguration);
            setConfiguration((currentConfiguration) => ({
                ...currentConfiguration,
                ...savedGroupFields,
            }));
            rememberConfiguration(persistLocally, savedDraft);
            setSaved(true);
        } catch (exception) {
            setError(getBackendErrorMessage(exception, shipmentConfiguration.messages.saveError));
            setSaved(false);
        } finally {
            setSavingGroup(null);
        }
    };

    const renderGroupHeader = (group: ShipmentConfigurationGroup) => (
        <header>
            <div>
                <h3>{shipmentConfiguration.categories[group]}</h3>
                <p>{shipmentConfiguration.categoryDescriptions[group]}</p>
            </div>
            <Button
                aria-label={`${pl.common.saveChanges}: ${shipmentConfiguration.categories[group]}`}
                disabled={loading || savingGroup !== null || !isGroupChanged(group)}
                startIcon={<Save />}
                variant="outlined"
                onClick={() => saveGroup(group)}
            >
                {savingGroup === group ? shipmentConfiguration.messages.saving : pl.common.saveChanges}
            </Button>
        </header>
    );

    const openTrackingNumberDialog = () => {
        setTrackingNumberRuleDraft(getTrackingNumberRule(configuration));
        setTrackingNumberDialogOpen(true);
    };

    const updateTrackingNumberRule = <Key extends keyof TrackingNumberRuleDraft>(
        field: Key,
        value: TrackingNumberRuleDraft[Key],
    ) => {
        setTrackingNumberRuleDraft((currentRule) => ({
            ...currentRule,
            [field]: value,
        }));
    };

    const saveTrackingNumberRule = () => {
        const nextConfiguration = {
            ...configuration,
            ...trackingNumberRuleDraft,
        };
        setConfiguration(nextConfiguration);
        setSaved(false);
        setTrackingNumberDialogOpen(false);
    };

    const renderSettingDescription = (label: string, hint: string) => (
        <span className="shipment-setting-copy">
            <strong>{label}</strong>
            <small>{hint}</small>
        </span>
    );

    const renderBooleanSetting = (
        field: BooleanSettingKey,
        label: string,
        hint: string,
    ) => (
        <div className="shipment-setting-row" key={field}>
            {renderSettingDescription(label, hint)}
            <FormControlLabel
                control={(
                    <Switch
                        aria-label={label}
                        checked={configuration[field]}
                        onChange={(event) => updateConfiguration(field, event.target.checked)}
                    />
                )}
                label={configuration[field]
                    ? shipmentConfiguration.values.enabled
                    : shipmentConfiguration.values.disabled}
            />
        </div>
    );

    const renderInputSetting = (
        field: TextSettingKey,
        label: string,
        hint: string,
        options?: {
            disabled?: boolean;
            min?: string;
            step?: string;
            type?: string;
            unit?: string;
        },
    ) => (
        <div
            aria-disabled={options?.disabled || undefined}
            className={options?.disabled ? "shipment-setting-row shipment-setting-row--disabled" : "shipment-setting-row"}
            key={field}
        >
            {renderSettingDescription(label, hint)}
            <div className="shipment-setting-input">
                <TextField
                    aria-label={label}
                    disabled={options?.disabled}
                    fullWidth
                    inputProps={{min: options?.min, step: options?.step}}
                    size="small"
                    type={options?.type || "text"}
                    value={configuration[field]}
                    onChange={(event) => updateConfiguration(field, event.target.value)}
                />
                {options?.unit ? <span>{options.unit}</span> : undefined}
            </div>
        </div>
    );

    const renderSelectSetting = (
        field: TextSettingKey,
        label: string,
        hint: string,
        options: SettingOption[],
    ) => (
        <div className="shipment-setting-row" key={field}>
            {renderSettingDescription(label, hint)}
            <TextField
                aria-label={label}
                className="shipment-setting-select"
                fullWidth
                select
                size="small"
                value={configuration[field]}
                onChange={(event) => updateConfiguration(field, event.target.value)}
            >
                {options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
            </TextField>
        </div>
    );

    return (
        <section className="global-configuration-section global-configuration-shipment-panel">
            <div className="shipment-configuration-topbar">
                <div className="global-configuration-preview-note">
                    <InfoOutlined fontSize="small" />
                    <span>{shipmentConfiguration.previewNote}</span>
                </div>
            </div>

            {loading ? (
                <Alert severity="info">
                    <span className="shipment-configuration-loading">
                        <CircularProgress size={18} />
                        {shipmentConfiguration.messages.loading}
                    </span>
                </Alert>
            ) : undefined}
            {error ? <Alert severity="error">{error}</Alert> : undefined}

            <div className="shipment-configuration-sections">
                <section className="shipment-configuration-group">
                    {renderGroupHeader("validation")}
                    <div className="shipment-configuration-grid">
                        {renderBooleanSetting("validateAddressData", shipmentConfiguration.fields.validateAddressData.label, shipmentConfiguration.fields.validateAddressData.hint)}
                        {renderBooleanSetting("requireRecipientPhone", shipmentConfiguration.fields.requireRecipientPhone.label, shipmentConfiguration.fields.requireRecipientPhone.hint)}
                        {renderBooleanSetting("requireRecipientEmail", shipmentConfiguration.fields.requireRecipientEmail.label, shipmentConfiguration.fields.requireRecipientEmail.hint)}
                        {renderBooleanSetting("preventDuplicateTracking", shipmentConfiguration.fields.preventDuplicateTracking.label, shipmentConfiguration.fields.preventDuplicateTracking.hint)}
                        {renderBooleanSetting("requireSenderReference", shipmentConfiguration.fields.requireSenderReference.label, shipmentConfiguration.fields.requireSenderReference.hint)}
                        {renderBooleanSetting("validatePostalCode", shipmentConfiguration.fields.validatePostalCode.label, shipmentConfiguration.fields.validatePostalCode.hint)}
                    </div>
                </section>

                <section className="shipment-configuration-group">
                    {renderGroupHeader("labels")}
                    <div className="shipment-configuration-grid">
                        {renderBooleanSetting("autoGenerateLabels", shipmentConfiguration.fields.autoGenerateLabels.label, shipmentConfiguration.fields.autoGenerateLabels.hint)}
                        {renderBooleanSetting("includeReturnLabel", shipmentConfiguration.fields.includeReturnLabel.label, shipmentConfiguration.fields.includeReturnLabel.hint)}
                        {renderBooleanSetting("attachPackingSlip", shipmentConfiguration.fields.attachPackingSlip.label, shipmentConfiguration.fields.attachPackingSlip.hint)}
                        {renderSelectSetting("labelFormat", shipmentConfiguration.fields.labelFormat.label, shipmentConfiguration.fields.labelFormat.hint, [
                            {value: "pdfA6", label: shipmentConfiguration.labelFormats.pdfA6},
                            {value: "pdfA4", label: shipmentConfiguration.labelFormats.pdfA4},
                            {value: "zpl", label: shipmentConfiguration.labelFormats.zpl},
                        ])}
                    </div>
                </section>

                <section className="shipment-configuration-group">
                    {renderGroupHeader("limits")}
                    <div className="shipment-configuration-grid">
                        {renderInputSetting("maximumWeightKg", shipmentConfiguration.fields.maximumWeightKg.label, shipmentConfiguration.fields.maximumWeightKg.hint, {disabled: configuration.allowOversized, min: "0.1", step: "0.1", type: "number", unit: "kg"})}
                        {renderInputSetting("maximumLengthCm", shipmentConfiguration.fields.maximumLengthCm.label, shipmentConfiguration.fields.maximumLengthCm.hint, {disabled: configuration.allowOversized, min: "1", step: "1", type: "number", unit: "cm"})}
                        {renderInputSetting("maximumWidthCm", shipmentConfiguration.fields.maximumWidthCm.label, shipmentConfiguration.fields.maximumWidthCm.hint, {disabled: configuration.allowOversized, min: "1", step: "1", type: "number", unit: "cm"})}
                        {renderInputSetting("maximumHeightCm", shipmentConfiguration.fields.maximumHeightCm.label, shipmentConfiguration.fields.maximumHeightCm.hint, {disabled: configuration.allowOversized, min: "1", step: "1", type: "number", unit: "cm"})}
                        {renderBooleanSetting("allowOversized", shipmentConfiguration.fields.allowOversized.label, shipmentConfiguration.fields.allowOversized.hint)}
                    </div>
                </section>

                <section className="shipment-configuration-group">
                    {renderGroupHeader("workflow")}
                    <div className="shipment-configuration-grid">
                        {renderSelectSetting("defaultStatus", shipmentConfiguration.fields.defaultStatus.label, shipmentConfiguration.fields.defaultStatus.hint, [
                            {value: "created", label: shipmentConfiguration.statuses.created},
                            {value: "prepared", label: shipmentConfiguration.statuses.prepared},
                        ])}
                        {renderSelectSetting("defaultServiceLevel", shipmentConfiguration.fields.defaultServiceLevel.label, shipmentConfiguration.fields.defaultServiceLevel.hint, [
                            {value: "economy", label: shipmentConfiguration.serviceLevels.economy},
                            {value: "standard", label: shipmentConfiguration.serviceLevels.standard},
                            {value: "express", label: shipmentConfiguration.serviceLevels.express},
                        ])}
                        {renderBooleanSetting("autoAssignCourier", shipmentConfiguration.fields.autoAssignCourier.label, shipmentConfiguration.fields.autoAssignCourier.hint)}
                        {renderBooleanSetting("autoCloseDelivered", shipmentConfiguration.fields.autoCloseDelivered.label, shipmentConfiguration.fields.autoCloseDelivered.hint)}
                        {renderBooleanSetting("generateTrackingNumber", shipmentConfiguration.fields.generateTrackingNumber.label, shipmentConfiguration.fields.generateTrackingNumber.hint)}
                        <div className="shipment-setting-row shipment-tracking-rule-row">
                            {renderSettingDescription(shipmentConfiguration.fields.trackingNumberRule.label, shipmentConfiguration.fields.trackingNumberRule.hint)}
                            <div className="shipment-tracking-rule-summary">
                                <code>{trackingNumberPreview}</code>
                                <Button startIcon={<Settings />} variant="outlined" onClick={openTrackingNumberDialog}>
                                    {shipmentConfiguration.trackingNumber.configure}
                                </Button>
                            </div>
                        </div>
                        {renderInputSetting("cancellationWindowMinutes", shipmentConfiguration.fields.cancellationWindowMinutes.label, shipmentConfiguration.fields.cancellationWindowMinutes.hint, {min: "0", step: "5", type: "number", unit: "min"})}
                        {renderInputSetting("pickupCutoffTime", shipmentConfiguration.fields.pickupCutoffTime.label, shipmentConfiguration.fields.pickupCutoffTime.hint, {type: "time"})}
                    </div>
                </section>

                <section className="shipment-configuration-group">
                    {renderGroupHeader("notifications")}
                    <div className="shipment-configuration-grid">
                        {renderBooleanSetting("notifyRecipientOnCreated", shipmentConfiguration.fields.notifyRecipientOnCreated.label, shipmentConfiguration.fields.notifyRecipientOnCreated.hint)}
                        {renderBooleanSetting("notifyRecipientOnDispatched", shipmentConfiguration.fields.notifyRecipientOnDispatched.label, shipmentConfiguration.fields.notifyRecipientOnDispatched.hint)}
                        {renderBooleanSetting("notifyRecipientOnDelivered", shipmentConfiguration.fields.notifyRecipientOnDelivered.label, shipmentConfiguration.fields.notifyRecipientOnDelivered.hint)}
                        {renderBooleanSetting("notifySenderOnException", shipmentConfiguration.fields.notifySenderOnException.label, shipmentConfiguration.fields.notifySenderOnException.hint)}
                        {renderSelectSetting("notificationChannel", shipmentConfiguration.fields.notificationChannel.label, shipmentConfiguration.fields.notificationChannel.hint, [
                            {value: "sms", label: shipmentConfiguration.notificationChannels.sms},
                            {value: "email", label: shipmentConfiguration.notificationChannels.email},
                            {value: "both", label: shipmentConfiguration.notificationChannels.both},
                        ])}
                    </div>
                </section>

                <section className="shipment-configuration-group">
                    {renderGroupHeader("delivery")}
                    <div className="shipment-configuration-grid">
                        {renderBooleanSetting("requireDeliveryToken", shipmentConfiguration.fields.requireDeliveryToken.label, shipmentConfiguration.fields.requireDeliveryToken.hint)}
                        {renderSelectSetting("proofOfDelivery", shipmentConfiguration.fields.proofOfDelivery.label, shipmentConfiguration.fields.proofOfDelivery.hint, [
                            {value: "none", label: shipmentConfiguration.proofOfDeliveryOptions.none},
                            {value: "signature", label: shipmentConfiguration.proofOfDeliveryOptions.signature},
                            {value: "photo", label: shipmentConfiguration.proofOfDeliveryOptions.photo},
                            {value: "signatureAndPhoto", label: shipmentConfiguration.proofOfDeliveryOptions.signatureAndPhoto},
                        ])}
                        {renderInputSetting("maxDeliveryAttempts", shipmentConfiguration.fields.maxDeliveryAttempts.label, shipmentConfiguration.fields.maxDeliveryAttempts.hint, {min: "1", step: "1", type: "number"})}
                        {renderBooleanSetting("allowNeighbourDelivery", shipmentConfiguration.fields.allowNeighbourDelivery.label, shipmentConfiguration.fields.allowNeighbourDelivery.hint)}
                        {renderBooleanSetting("allowSafePlaceDelivery", shipmentConfiguration.fields.allowSafePlaceDelivery.label, shipmentConfiguration.fields.allowSafePlaceDelivery.hint)}
                        {renderBooleanSetting("redirectToPickupPointAfterFailure", shipmentConfiguration.fields.redirectToPickupPointAfterFailure.label, shipmentConfiguration.fields.redirectToPickupPointAfterFailure.hint)}
                    </div>
                </section>

                <section className="shipment-configuration-group">
                    {renderGroupHeader("returns")}
                    <div className="shipment-configuration-grid">
                        {renderBooleanSetting("allowReturns", shipmentConfiguration.fields.allowReturns.label, shipmentConfiguration.fields.allowReturns.hint)}
                        {renderInputSetting("returnWindowDays", shipmentConfiguration.fields.returnWindowDays.label, shipmentConfiguration.fields.returnWindowDays.hint, {disabled: !configuration.allowReturns, min: "0", step: "1", type: "number", unit: shipmentConfiguration.units.days})}
                        {renderBooleanSetting("autoReturnAfterFailedDelivery", shipmentConfiguration.fields.autoReturnAfterFailedDelivery.label, shipmentConfiguration.fields.autoReturnAfterFailedDelivery.hint)}
                        {renderInputSetting("pickupPointStorageDays", shipmentConfiguration.fields.pickupPointStorageDays.label, shipmentConfiguration.fields.pickupPointStorageDays.hint, {min: "0", step: "1", type: "number", unit: shipmentConfiguration.units.days})}
                        {renderBooleanSetting("requireReturnReason", shipmentConfiguration.fields.requireReturnReason.label, shipmentConfiguration.fields.requireReturnReason.hint)}
                    </div>
                </section>

                <section className="shipment-configuration-group">
                    {renderGroupHeader("payments")}
                    <div className="shipment-configuration-grid">
                        {renderBooleanSetting("allowCashOnDelivery", shipmentConfiguration.fields.allowCashOnDelivery.label, shipmentConfiguration.fields.allowCashOnDelivery.hint)}
                        {renderInputSetting("maxCashOnDeliveryAmount", shipmentConfiguration.fields.maxCashOnDeliveryAmount.label, shipmentConfiguration.fields.maxCashOnDeliveryAmount.hint, {disabled: !configuration.allowCashOnDelivery, min: "0", step: "0.01", type: "number", unit: shipmentConfiguration.units.currency})}
                        {renderSelectSetting("cashOnDeliveryPaymentMethod", shipmentConfiguration.fields.cashOnDeliveryPaymentMethod.label, shipmentConfiguration.fields.cashOnDeliveryPaymentMethod.hint, [
                            {value: "cash", label: shipmentConfiguration.cashOnDeliveryPaymentMethodOptions.cash},
                            {value: "card", label: shipmentConfiguration.cashOnDeliveryPaymentMethodOptions.card},
                            {value: "both", label: shipmentConfiguration.cashOnDeliveryPaymentMethodOptions.both},
                        ])}
                        {renderInputSetting("requireInsuranceAboveValue", shipmentConfiguration.fields.requireInsuranceAboveValue.label, shipmentConfiguration.fields.requireInsuranceAboveValue.hint, {min: "0", step: "0.01", type: "number", unit: shipmentConfiguration.units.currency})}
                    </div>
                </section>

                <section className="shipment-configuration-group">
                    {renderGroupHeader("sla")}
                    <div className="shipment-configuration-grid">
                        {renderInputSetting("economySlaHours", shipmentConfiguration.fields.economySlaHours.label, shipmentConfiguration.fields.economySlaHours.hint, {min: "0", step: "1", type: "number", unit: shipmentConfiguration.units.hours})}
                        {renderInputSetting("standardSlaHours", shipmentConfiguration.fields.standardSlaHours.label, shipmentConfiguration.fields.standardSlaHours.hint, {min: "0", step: "1", type: "number", unit: shipmentConfiguration.units.hours})}
                        {renderInputSetting("expressSlaHours", shipmentConfiguration.fields.expressSlaHours.label, shipmentConfiguration.fields.expressSlaHours.hint, {min: "0", step: "1", type: "number", unit: shipmentConfiguration.units.hours})}
                        {renderInputSetting("flagDelayedAfterHours", shipmentConfiguration.fields.flagDelayedAfterHours.label, shipmentConfiguration.fields.flagDelayedAfterHours.hint, {min: "0", step: "1", type: "number", unit: shipmentConfiguration.units.hours})}
                        {renderBooleanSetting("requireExceptionNote", shipmentConfiguration.fields.requireExceptionNote.label, shipmentConfiguration.fields.requireExceptionNote.hint)}
                        {renderBooleanSetting("escalateDelaysToDepartmentManager", shipmentConfiguration.fields.escalateDelaysToDepartmentManager.label, shipmentConfiguration.fields.escalateDelaysToDepartmentManager.hint)}
                    </div>
                </section>

                <section className="shipment-configuration-group">
                    {renderGroupHeader("dataRetention")}
                    <div className="shipment-configuration-grid">
                        {renderInputSetting("anonymizeRecipientDataAfterDays", shipmentConfiguration.fields.anonymizeRecipientDataAfterDays.label, shipmentConfiguration.fields.anonymizeRecipientDataAfterDays.hint, {min: "0", step: "1", type: "number", unit: shipmentConfiguration.units.days})}
                        {renderInputSetting("archiveClosedShipmentsAfterDays", shipmentConfiguration.fields.archiveClosedShipmentsAfterDays.label, shipmentConfiguration.fields.archiveClosedShipmentsAfterDays.hint, {min: "0", step: "1", type: "number", unit: shipmentConfiguration.units.days})}
                        {renderInputSetting("deliveryPhotoRetentionDays", shipmentConfiguration.fields.deliveryPhotoRetentionDays.label, shipmentConfiguration.fields.deliveryPhotoRetentionDays.hint, {min: "0", step: "1", type: "number", unit: shipmentConfiguration.units.days})}
                    </div>
                </section>
            </div>

            <Dialog
                className="shipment-tracking-number-dialog"
                fullWidth
                maxWidth="md"
                open={trackingNumberDialogOpen}
                onClose={() => setTrackingNumberDialogOpen(false)}
            >
                <DialogTitle>{shipmentConfiguration.trackingNumber.title}</DialogTitle>
                <DialogContent>
                    <p className="shipment-tracking-number-description">
                        {shipmentConfiguration.trackingNumber.description}
                    </p>
                    <div className="shipment-tracking-number-fields">
                        <TextField
                            fullWidth
                            label={shipmentConfiguration.trackingNumber.prefixModeLabel}
                            select
                            value={trackingNumberRuleDraft.trackingNumberPrefixMode}
                            onChange={(event) => updateTrackingNumberRule(
                                "trackingNumberPrefixMode",
                                event.target.value as TrackingNumberPrefixMode,
                            )}
                        >
                            <MenuItem value="custom">
                                {shipmentConfiguration.trackingNumber.prefixModes.custom}
                            </MenuItem>
                            <MenuItem disabled={!departmentCode.trim()} value="departmentCode">
                                {shipmentConfiguration.trackingNumber.prefixModes.departmentCode.replace(
                                    "{code}",
                                    departmentCode || pl.common.dash,
                                )}
                            </MenuItem>
                            <MenuItem value="none">
                                {shipmentConfiguration.trackingNumber.prefixModes.none}
                            </MenuItem>
                        </TextField>
                        {trackingNumberRuleDraft.trackingNumberPrefixMode === "custom" ? (
                            <TextField
                                fullWidth
                                inputProps={{maxLength: 20}}
                                label={shipmentConfiguration.trackingNumber.keyLabel}
                                value={trackingNumberRuleDraft.trackingNumberKey}
                                onChange={(event) => updateTrackingNumberRule("trackingNumberKey", event.target.value)}
                            />
                        ) : (
                            <TextField
                                disabled
                                fullWidth
                                label={trackingNumberRuleDraft.trackingNumberPrefixMode === "departmentCode"
                                    ? shipmentConfiguration.trackingNumber.departmentCodeLabel
                                    : shipmentConfiguration.trackingNumber.keyLabel}
                                value={trackingNumberRuleDraft.trackingNumberPrefixMode === "departmentCode"
                                    ? departmentCode
                                    : shipmentConfiguration.trackingNumber.noPrefixValue}
                            />
                        )}
                        <TextField
                            fullWidth
                            inputProps={{maxLength: 3}}
                            label={shipmentConfiguration.trackingNumber.separatorLabel}
                            value={trackingNumberRuleDraft.trackingNumberSeparator}
                            onChange={(event) => updateTrackingNumberRule("trackingNumberSeparator", event.target.value)}
                        />
                        <TextField
                            fullWidth
                            label={shipmentConfiguration.trackingNumber.sourceLabel}
                            select
                            value={trackingNumberRuleDraft.trackingNumberSource}
                            onChange={(event) => updateTrackingNumberRule("trackingNumberSource", event.target.value)}
                        >
                            <MenuItem value="sequence">{shipmentConfiguration.trackingNumber.sources.sequence}</MenuItem>
                            <MenuItem value="shipmentId">{shipmentConfiguration.trackingNumber.sources.shipmentId}</MenuItem>
                            <MenuItem value="random">{shipmentConfiguration.trackingNumber.sources.random}</MenuItem>
                        </TextField>
                        {trackingNumberRuleDraft.trackingNumberSource === "random" ? (
                            <TextField
                                fullWidth
                                inputProps={{min: "4", max: "16", step: "1"}}
                                label={shipmentConfiguration.trackingNumber.randomLengthLabel}
                                type="number"
                                value={trackingNumberRuleDraft.trackingNumberRandomLength}
                                onChange={(event) => updateTrackingNumberRule("trackingNumberRandomLength", event.target.value)}
                            />
                        ) : undefined}
                        <div className="shipment-tracking-number-option">
                            <span>
                                <strong>{shipmentConfiguration.trackingNumber.includeDateLabel}</strong>
                                <small>{shipmentConfiguration.trackingNumber.includeDateHint}</small>
                            </span>
                            <Switch
                                checked={trackingNumberRuleDraft.trackingNumberIncludeDate}
                                onChange={(event) => updateTrackingNumberRule("trackingNumberIncludeDate", event.target.checked)}
                            />
                        </div>
                        {trackingNumberRuleDraft.trackingNumberIncludeDate ? (
                            <TextField
                                fullWidth
                                label={shipmentConfiguration.trackingNumber.dateFormatLabel}
                                select
                                value={trackingNumberRuleDraft.trackingNumberDateFormat}
                                onChange={(event) => updateTrackingNumberRule("trackingNumberDateFormat", event.target.value)}
                            >
                                <MenuItem value="yyyyMMdd">{shipmentConfiguration.trackingNumber.dateFormats.yyyyMMdd}</MenuItem>
                                <MenuItem value="yyMMdd">{shipmentConfiguration.trackingNumber.dateFormats.yyMMdd}</MenuItem>
                                <MenuItem value="yyyyMM">{shipmentConfiguration.trackingNumber.dateFormats.yyyyMM}</MenuItem>
                            </TextField>
                        ) : undefined}
                        <div className="shipment-tracking-number-option">
                            <span>
                                <strong>{shipmentConfiguration.trackingNumber.uppercaseLabel}</strong>
                                <small>{shipmentConfiguration.trackingNumber.uppercaseHint}</small>
                            </span>
                            <Switch
                                checked={trackingNumberRuleDraft.trackingNumberUppercase}
                                onChange={(event) => updateTrackingNumberRule("trackingNumberUppercase", event.target.checked)}
                            />
                        </div>
                    </div>
                    <div className="shipment-tracking-number-preview">
                        <span>{shipmentConfiguration.trackingNumber.previewLabel}</span>
                        <code>{trackingNumberDraftPreview}</code>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={() => setTrackingNumberDialogOpen(false)}>
                        {pl.common.cancel}
                    </Button>
                    <Button
                        className="shipment-tracking-number-save"
                        disabled={trackingNumberPrefixInvalid}
                        startIcon={<Save />}
                        variant="outlined"
                        onClick={saveTrackingNumberRule}
                    >
                        {shipmentConfiguration.trackingNumber.save}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                anchorOrigin={{vertical: "bottom", horizontal: "right"}}
                className="shipment-configuration-toast"
                open={saved}
                autoHideDuration={4500}
                onClose={() => setSaved(false)}
            >
                <Alert
                    className="shipment-configuration-toast-alert"
                    severity="success"
                    onClose={() => setSaved(false)}
                >
                    <span className="shipment-configuration-toast-icon">
                        <CheckCircle fontSize="small" />
                    </span>
                    <span className="shipment-configuration-toast-copy">
                        <strong>{shipmentConfiguration.messages.saved}</strong>
                    </span>
                </Alert>
            </Snackbar>
        </section>
    );
}

export default ShipmentConfigurationPanel;
