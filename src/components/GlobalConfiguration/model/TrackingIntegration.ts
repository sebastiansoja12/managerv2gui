export type TrackingProviderId = string;

export type TrackingProvider = {
    id: TrackingProviderId;
    displayName: string;
};

export type TrackingIntegration = {
    provider: TrackingProviderId;
    displayName: string;
    configured: boolean;
    enabled: boolean;
    values: Record<string, string>;
    configuredSecretFields: string[];
};

export type TrackingIntegrationRequest = {
    enabled: boolean;
    values: Record<string, string>;
};

export type TrackingIntegrationFieldType = "TEXT" | "SECRET" | "SELECT" | "BOOLEAN";

export type TrackingIntegrationFieldOption = {
    value: string;
    label: string;
};

export type TrackingIntegrationFieldDefinition = {
    key: string;
    label: string;
    type: TrackingIntegrationFieldType;
    required: boolean;
    defaultValue: string;
    maxLength: number;
    options?: TrackingIntegrationFieldOption[];
};

export type TrackingIntegrationDefinition = {
    provider: TrackingProviderId;
    displayName: string;
    fields: TrackingIntegrationFieldDefinition[];
};

export type TrackingLocation = {
    id?: string | null;
    type?: string | null;
    name?: string | null;
    address?: string | null;
    postalCode?: string | null;
    city?: string | null;
    country?: string | null;
    description?: string | null;
};

export type ExternalTrackingEvent = {
    timestamp?: string | null;
    name?: string | null;
    description?: string | null;
    eventCode?: string | null;
    location?: TrackingLocation | null;
};

export type ExternalTrackingResult = {
    provider: TrackingProviderId;
    trackingNumber: string;
    currentStatus?: string | null;
    updatedAt?: string | null;
    events: ExternalTrackingEvent[];
    origin?: TrackingLocation | null;
    destination?: TrackingLocation | null;
    shipmentType?: string | null;
    deliveryRecipientName?: string | null;
    deliveryNotes?: string | null;
    returnTrackingNumber?: string | null;
};
