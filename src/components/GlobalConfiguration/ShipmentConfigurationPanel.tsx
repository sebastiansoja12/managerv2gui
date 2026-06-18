import React, {useState} from "react";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    MenuItem,
    Switch,
    TextField,
} from "components/ui";
import {InfoOutlined, Save, Settings} from "components/ui/icons";
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
    generateTrackingNumber: boolean;
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
};

type BooleanSettingKey = {
    [Key in keyof ShipmentConfigurationDraft]: ShipmentConfigurationDraft[Key] extends boolean ? Key : never;
}[keyof ShipmentConfigurationDraft];

type TextSettingKey = Exclude<keyof ShipmentConfigurationDraft, BooleanSettingKey>;

type SettingOption = {
    label: string;
    value: string;
};

type TrackingNumberRuleDraft = Pick<ShipmentConfigurationDraft,
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
    maximumLengthCm: "120",
    maximumWidthCm: "80",
    maximumHeightCm: "80",
    allowOversized: false,
    defaultStatus: "created",
    defaultServiceLevel: "standard",
    autoAssignCourier: false,
    autoCloseDelivered: true,
    generateTrackingNumber: false,
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
};

const getTrackingNumberRule = (configuration: ShipmentConfigurationDraft): TrackingNumberRuleDraft => ({
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

const buildTrackingNumberPreview = (rule: TrackingNumberRuleDraft) => {
    const parts = [
        rule.trackingNumberKey.trim(),
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
    const [trackingNumberDialogOpen, setTrackingNumberDialogOpen] = useState(false);
    const [trackingNumberRuleDraft, setTrackingNumberRuleDraft] = useState<TrackingNumberRuleDraft>(
        getTrackingNumberRule(defaultShipmentConfiguration),
    );
    const shipmentConfiguration = pl.globalConfiguration.shipmentConfiguration;
    const trackingNumberPreview = buildTrackingNumberPreview(getTrackingNumberRule(configuration));
    const trackingNumberDraftPreview = buildTrackingNumberPreview(trackingNumberRuleDraft);

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
        window.localStorage.setItem(SHIPMENT_CONFIGURATION_STORAGE_KEY, JSON.stringify(nextConfiguration));
        setSaved(true);
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
                            inputProps={{maxLength: 20}}
                            label={shipmentConfiguration.trackingNumber.keyLabel}
                            value={trackingNumberRuleDraft.trackingNumberKey}
                            onChange={(event) => updateTrackingNumberRule("trackingNumberKey", event.target.value)}
                        />
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
                        disabled={!trackingNumberRuleDraft.trackingNumberKey.trim()}
                        startIcon={<Save />}
                        variant="outlined"
                        onClick={saveTrackingNumberRule}
                    >
                        {shipmentConfiguration.trackingNumber.save}
                    </Button>
                </DialogActions>
            </Dialog>
        </section>
    );
}

export default ShipmentConfigurationPanel;
