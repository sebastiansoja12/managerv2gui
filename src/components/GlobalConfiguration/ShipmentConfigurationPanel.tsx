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
    preventDuplicateTracking: boolean;
    autoGenerateLabels: boolean;
    maximumWeightKg: string;
    defaultStatus: string;
};

type BooleanSettingKey = {
    [Key in keyof ShipmentConfigurationDraft]: ShipmentConfigurationDraft[Key] extends boolean ? Key : never;
}[keyof ShipmentConfigurationDraft];

const SHIPMENT_CONFIGURATION_STORAGE_KEY = "manager.globalConfiguration.shipments";

const defaultShipmentConfiguration: ShipmentConfigurationDraft = {
    validateAddressData: true,
    requireRecipientPhone: true,
    preventDuplicateTracking: true,
    autoGenerateLabels: false,
    maximumWeightKg: "31.5",
    defaultStatus: "created",
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

function ShipmentConfigurationPanel() {
    const [configuration, setConfiguration] = useState<ShipmentConfigurationDraft>(readShipmentConfiguration);
    const [saved, setSaved] = useState(false);

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

    const renderBooleanSetting = (
        field: BooleanSettingKey,
        category: string,
        label: string,
        hint: string,
    ) => (
        <tr key={field}>
            <td>
                <span className="global-configuration-setting-name">{label}</span>
                <span className="global-configuration-setting-hint">{hint}</span>
            </td>
            <td>
                <span className="global-configuration-category">{category}</span>
            </td>
            <td>
                <FormControlLabel
                    control={(
                        <Switch
                            aria-label={label}
                            checked={configuration[field]}
                            onChange={(event) => updateConfiguration(field, event.target.checked)}
                        />
                    )}
                    label={configuration[field]
                        ? pl.globalConfiguration.shipmentConfiguration.values.enabled
                        : pl.globalConfiguration.shipmentConfiguration.values.disabled}
                />
            </td>
            <td>
                <Button startIcon={<Save />} variant="outlined" onClick={saveConfiguration}>
                    {pl.common.saveChanges}
                </Button>
            </td>
        </tr>
    );

    const shipmentConfiguration = pl.globalConfiguration.shipmentConfiguration;

    return (
        <section className="global-configuration-section global-configuration-shipment-panel">
            <div className="global-configuration-preview-note">
                <InfoOutlined fontSize="small" />
                <span>{shipmentConfiguration.previewNote}</span>
            </div>
            {saved ? <Alert severity="success">{shipmentConfiguration.messages.saved}</Alert> : undefined}
            <div className="global-configuration-table-wrap">
                <table className="global-configuration-table global-configuration-settings-table">
                    <thead>
                    <tr>
                        <th>{pl.globalConfiguration.columns.name}</th>
                        <th>{pl.globalConfiguration.columns.category}</th>
                        <th>{pl.globalConfiguration.columns.value}</th>
                        <th>{pl.common.actions}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {renderBooleanSetting(
                        "validateAddressData",
                        shipmentConfiguration.categories.validation,
                        shipmentConfiguration.fields.validateAddressData.label,
                        shipmentConfiguration.fields.validateAddressData.hint,
                    )}
                    {renderBooleanSetting(
                        "requireRecipientPhone",
                        shipmentConfiguration.categories.validation,
                        shipmentConfiguration.fields.requireRecipientPhone.label,
                        shipmentConfiguration.fields.requireRecipientPhone.hint,
                    )}
                    {renderBooleanSetting(
                        "preventDuplicateTracking",
                        shipmentConfiguration.categories.validation,
                        shipmentConfiguration.fields.preventDuplicateTracking.label,
                        shipmentConfiguration.fields.preventDuplicateTracking.hint,
                    )}
                    {renderBooleanSetting(
                        "autoGenerateLabels",
                        shipmentConfiguration.categories.labels,
                        shipmentConfiguration.fields.autoGenerateLabels.label,
                        shipmentConfiguration.fields.autoGenerateLabels.hint,
                    )}
                    <tr>
                        <td>
                            <span className="global-configuration-setting-name">
                                {shipmentConfiguration.fields.maximumWeightKg.label}
                            </span>
                            <span className="global-configuration-setting-hint">
                                {shipmentConfiguration.fields.maximumWeightKg.hint}
                            </span>
                        </td>
                        <td>
                            <span className="global-configuration-category">
                                {shipmentConfiguration.categories.limits}
                            </span>
                        </td>
                        <td>
                            <div className="global-configuration-compact-control">
                                <TextField
                                    aria-label={shipmentConfiguration.fields.maximumWeightKg.label}
                                    fullWidth
                                    inputProps={{min: "0.1", step: "0.1"}}
                                    type="number"
                                    value={configuration.maximumWeightKg}
                                    onChange={(event) => updateConfiguration("maximumWeightKg", event.target.value)}
                                />
                                <span>kg</span>
                            </div>
                        </td>
                        <td>
                            <Button startIcon={<Save />} variant="outlined" onClick={saveConfiguration}>
                                {pl.common.saveChanges}
                            </Button>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span className="global-configuration-setting-name">
                                {shipmentConfiguration.fields.defaultStatus.label}
                            </span>
                            <span className="global-configuration-setting-hint">
                                {shipmentConfiguration.fields.defaultStatus.hint}
                            </span>
                        </td>
                        <td>
                            <span className="global-configuration-category">
                                {shipmentConfiguration.categories.workflow}
                            </span>
                        </td>
                        <td>
                            <TextField
                                aria-label={shipmentConfiguration.fields.defaultStatus.label}
                                fullWidth
                                select
                                value={configuration.defaultStatus}
                                onChange={(event) => updateConfiguration("defaultStatus", event.target.value)}
                            >
                                <MenuItem value="created">{shipmentConfiguration.statuses.created}</MenuItem>
                                <MenuItem value="prepared">{shipmentConfiguration.statuses.prepared}</MenuItem>
                                <MenuItem value="accepted">{shipmentConfiguration.statuses.accepted}</MenuItem>
                            </TextField>
                        </td>
                        <td>
                            <Button startIcon={<Save />} variant="outlined" onClick={saveConfiguration}>
                                {pl.common.saveChanges}
                            </Button>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default ShipmentConfigurationPanel;
