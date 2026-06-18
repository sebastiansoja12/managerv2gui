import React, {useState} from "react";
import {
    Alert,
    Button,
    FormControlLabel,
    MenuItem,
    Switch,
    TextField,
} from "components/ui";
import {InfoOutlined, Save} from "components/ui/icons";
import pl from "../../i18n/translate";

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
    maximumLengthCm: string;
    maximumWidthCm: string;
    maximumHeightCm: string;
    allowOversized: boolean;
    defaultStatus: string;
    defaultServiceLevel: string;
    autoAssignCourier: boolean;
    autoCloseDelivered: boolean;
    cancellationWindowMinutes: string;
    pickupCutoffTime: string;
    notifyRecipientOnCreated: boolean;
    notifyRecipientOnDispatched: boolean;
    notifyRecipientOnDelivered: boolean;
    notifySenderOnException: boolean;
    notificationChannel: string;
};

type BooleanSettingKey = {
    [Key in keyof ShipmentConfigurationDraft]: ShipmentConfigurationDraft[Key] extends boolean ? Key : never;
}[keyof ShipmentConfigurationDraft];

type TextSettingKey = Exclude<keyof ShipmentConfigurationDraft, BooleanSettingKey>;

type SettingOption = {
    label: string;
    value: string;
};

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
    maximumLengthCm: "120",
    maximumWidthCm: "80",
    maximumHeightCm: "80",
    allowOversized: false,
    defaultStatus: "created",
    defaultServiceLevel: "standard",
    autoAssignCourier: false,
    autoCloseDelivered: true,
    cancellationWindowMinutes: "30",
    pickupCutoffTime: "16:00",
    notifyRecipientOnCreated: true,
    notifyRecipientOnDispatched: true,
    notifyRecipientOnDelivered: true,
    notifySenderOnException: true,
    notificationChannel: "sms",
};

const readShipmentConfiguration = (): ShipmentConfigurationDraft => {
    try {
        const storedValue = window.localStorage.getItem(SHIPMENT_CONFIGURATION_STORAGE_KEY);
        if (!storedValue) {
            return defaultShipmentConfiguration;
        }

        return {
            ...defaultShipmentConfiguration,
            ...JSON.parse(storedValue),
        };
    } catch {
        return defaultShipmentConfiguration;
    }
};

export function ShipmentConfigurationPanel() {
    const [configuration, setConfiguration] = useState<ShipmentConfigurationDraft>(readShipmentConfiguration);
    const [saved, setSaved] = useState(false);
    const shipmentConfiguration = pl.globalConfiguration.shipmentConfiguration;

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

    const saveConfiguration = () => {
        window.localStorage.setItem(SHIPMENT_CONFIGURATION_STORAGE_KEY, JSON.stringify(configuration));
        setSaved(true);
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
            min?: string;
            step?: string;
            type?: string;
            unit?: string;
        },
    ) => (
        <div className="shipment-setting-row" key={field}>
            {renderSettingDescription(label, hint)}
            <div className="shipment-setting-input">
                <TextField
                    aria-label={label}
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
                <Button startIcon={<Save />} variant="outlined" onClick={saveConfiguration}>
                    {pl.common.saveChanges}
                </Button>
            </div>

            {saved ? <Alert severity="success">{shipmentConfiguration.messages.saved}</Alert> : undefined}

            <div className="shipment-configuration-sections">
                <section className="shipment-configuration-group">
                    <header>
                        <h3>{shipmentConfiguration.categories.validation}</h3>
                        <p>{shipmentConfiguration.categoryDescriptions.validation}</p>
                    </header>
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
                    <header>
                        <h3>{shipmentConfiguration.categories.labels}</h3>
                        <p>{shipmentConfiguration.categoryDescriptions.labels}</p>
                    </header>
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
                    <header>
                        <h3>{shipmentConfiguration.categories.limits}</h3>
                        <p>{shipmentConfiguration.categoryDescriptions.limits}</p>
                    </header>
                    <div className="shipment-configuration-grid">
                        {renderInputSetting("maximumWeightKg", shipmentConfiguration.fields.maximumWeightKg.label, shipmentConfiguration.fields.maximumWeightKg.hint, {min: "0.1", step: "0.1", type: "number", unit: "kg"})}
                        {renderInputSetting("maximumLengthCm", shipmentConfiguration.fields.maximumLengthCm.label, shipmentConfiguration.fields.maximumLengthCm.hint, {min: "1", step: "1", type: "number", unit: "cm"})}
                        {renderInputSetting("maximumWidthCm", shipmentConfiguration.fields.maximumWidthCm.label, shipmentConfiguration.fields.maximumWidthCm.hint, {min: "1", step: "1", type: "number", unit: "cm"})}
                        {renderInputSetting("maximumHeightCm", shipmentConfiguration.fields.maximumHeightCm.label, shipmentConfiguration.fields.maximumHeightCm.hint, {min: "1", step: "1", type: "number", unit: "cm"})}
                        {renderBooleanSetting("allowOversized", shipmentConfiguration.fields.allowOversized.label, shipmentConfiguration.fields.allowOversized.hint)}
                    </div>
                </section>

                <section className="shipment-configuration-group">
                    <header>
                        <h3>{shipmentConfiguration.categories.workflow}</h3>
                        <p>{shipmentConfiguration.categoryDescriptions.workflow}</p>
                    </header>
                    <div className="shipment-configuration-grid">
                        {renderSelectSetting("defaultStatus", shipmentConfiguration.fields.defaultStatus.label, shipmentConfiguration.fields.defaultStatus.hint, [
                            {value: "created", label: shipmentConfiguration.statuses.created},
                            {value: "prepared", label: shipmentConfiguration.statuses.prepared},
                            {value: "accepted", label: shipmentConfiguration.statuses.accepted},
                        ])}
                        {renderSelectSetting("defaultServiceLevel", shipmentConfiguration.fields.defaultServiceLevel.label, shipmentConfiguration.fields.defaultServiceLevel.hint, [
                            {value: "economy", label: shipmentConfiguration.serviceLevels.economy},
                            {value: "standard", label: shipmentConfiguration.serviceLevels.standard},
                            {value: "express", label: shipmentConfiguration.serviceLevels.express},
                        ])}
                        {renderBooleanSetting("autoAssignCourier", shipmentConfiguration.fields.autoAssignCourier.label, shipmentConfiguration.fields.autoAssignCourier.hint)}
                        {renderBooleanSetting("autoCloseDelivered", shipmentConfiguration.fields.autoCloseDelivered.label, shipmentConfiguration.fields.autoCloseDelivered.hint)}
                        {renderInputSetting("cancellationWindowMinutes", shipmentConfiguration.fields.cancellationWindowMinutes.label, shipmentConfiguration.fields.cancellationWindowMinutes.hint, {min: "0", step: "5", type: "number", unit: "min"})}
                        {renderInputSetting("pickupCutoffTime", shipmentConfiguration.fields.pickupCutoffTime.label, shipmentConfiguration.fields.pickupCutoffTime.hint, {type: "time"})}
                    </div>
                </section>

                <section className="shipment-configuration-group">
                    <header>
                        <h3>{shipmentConfiguration.categories.notifications}</h3>
                        <p>{shipmentConfiguration.categoryDescriptions.notifications}</p>
                    </header>
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
            </div>
        </section>
    );
}

export default ShipmentConfigurationPanel;
