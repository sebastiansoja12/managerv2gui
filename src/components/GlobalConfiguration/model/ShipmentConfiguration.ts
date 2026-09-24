export type ShipmentLabelFormatApi = "PDF_A6" | "PDF_A4" | "ZPL";

export type DefaultShipmentStatusApi = "CREATED" | "PREPARED";

export type ShipmentServiceLevelApi = "ECONOMY" | "STANDARD" | "EXPRESS";

export type TrackingNumberSourceApi = "SEQUENCE" | "SHIPMENT_ID" | "RANDOM";

export type TrackingNumberPrefixModeApi = "CUSTOM" | "DEPARTMENT_CODE" | "NONE";

export type TrackingNumberDateFormatApi = "YYYYMMDD" | "YYMMDD" | "YYYYMM";

export type ShipmentNotificationChannelApi = "SMS" | "EMAIL" | "BOTH";

export type ProofOfDeliveryModeApi = "NONE" | "SIGNATURE" | "PHOTO" | "SIGNATURE_AND_PHOTO";

export type CashOnDeliveryPaymentMethodApi = "CASH" | "CARD" | "BOTH";

export type ShipmentValidationConfigurationApi = {
    validateAddressData: boolean;
    requireRecipientPhone: boolean;
    requireRecipientEmail: boolean;
    preventDuplicateTracking: boolean;
    requireSenderReference: boolean;
    validatePostalCode: boolean;
};

export type ShipmentLabelConfigurationApi = {
    autoGenerateLabels: boolean;
    includeReturnLabel: boolean;
    attachPackingSlip: boolean;
    labelFormat: ShipmentLabelFormatApi;
};

export type ShipmentLimitsApi = {
    maxWeight: number;
    minWeight: number;
    maxLength: number;
    maxWidth: number;
    maxHeight: number;
    maxShipmentValue: number;
    allowOversized: boolean;
};

export type ShipmentWorkflowConfigurationApi = {
    defaultStatus: DefaultShipmentStatusApi;
    defaultServiceLevel: ShipmentServiceLevelApi;
    autoAssignCourier: boolean;
    autoCloseDelivered: boolean;
    generateTrackingNumber: boolean;
    cancellationWindowMinutes: number;
    pickupCutoffTime: string;
};

export type TrackingNumberRuleApi = {
    prefixMode: TrackingNumberPrefixModeApi;
    key: string;
    separator: string;
    source: TrackingNumberSourceApi;
    randomLength: number;
    includeDate: boolean;
    dateFormat: TrackingNumberDateFormatApi;
    uppercase: boolean;
};

export type ShipmentNotificationConfigurationApi = {
    notifyRecipientOnCreated: boolean;
    notifyRecipientOnDispatched: boolean;
    notifyRecipientOnDelivered: boolean;
    notifySenderOnException: boolean;
    notificationChannel: ShipmentNotificationChannelApi;
};

export type ShipmentDeliveryConfigurationApi = {
    requireDeliveryToken: boolean;
    proofOfDelivery: ProofOfDeliveryModeApi;
    maxDeliveryAttempts: number;
    allowNeighbourDelivery: boolean;
    allowSafePlaceDelivery: boolean;
    redirectToPickupPointAfterFailure: boolean;
};

export type ShipmentReturnConfigurationApi = {
    allowReturns: boolean;
    returnWindowDays: number;
    autoReturnAfterFailedDelivery: boolean;
    pickupPointStorageDays: number;
    requireReturnReason: boolean;
};

export type ShipmentPaymentConfigurationApi = {
    allowCashOnDelivery: boolean;
    maxCashOnDeliveryAmount: number;
    cashOnDeliveryPaymentMethod: CashOnDeliveryPaymentMethodApi;
    requireInsuranceAboveValue: number;
};

export type ShipmentSlaConfigurationApi = {
    economySlaHours: number;
    standardSlaHours: number;
    expressSlaHours: number;
    flagDelayedAfterHours: number;
    requireExceptionNote: boolean;
    escalateDelaysToDepartmentManager: boolean;
};

export type ShipmentDataRetentionConfigurationApi = {
    anonymizeRecipientDataAfterDays: number;
    archiveClosedShipmentsAfterDays: number;
    deliveryPhotoRetentionDays: number;
};

export type ShipmentConfigurationApi = {
    validationConfiguration: ShipmentValidationConfigurationApi;
    labelConfiguration: ShipmentLabelConfigurationApi;
    shipmentLimits: ShipmentLimitsApi;
    workflowConfiguration: ShipmentWorkflowConfigurationApi;
    trackingNumberRule: TrackingNumberRuleApi;
    notificationConfiguration: ShipmentNotificationConfigurationApi;
    deliveryConfiguration: ShipmentDeliveryConfigurationApi;
    returnConfiguration: ShipmentReturnConfigurationApi;
    paymentConfiguration: ShipmentPaymentConfigurationApi;
    slaConfiguration: ShipmentSlaConfigurationApi;
    dataRetentionConfiguration: ShipmentDataRetentionConfigurationApi;
};

export type ShipmentConfigurationSection = keyof ShipmentConfigurationApi;
