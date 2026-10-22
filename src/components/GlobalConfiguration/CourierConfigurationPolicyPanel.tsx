import React, {useCallback, useEffect, useState} from "react";
import {Alert, Button, CircularProgress, MenuItem, TextField} from "components/ui";
import {Refresh, Save} from "components/ui/icons";
import CourierConfigurationService from "../../hooks/CourierConfigurationService";
import pl from "../../i18n/translate";
import {
    courierErrorMessage,
    CourierPolicyMode,
    courierPolicyModes,
    courierSettingGroups,
    courierSettingsByGroup,
    isCourierConfigurationConflict,
    toCourierPolicyMode,
} from "../Couriers/courierConfigurationModel";
import {CourierConfigurationPolicyDto, CourierSetting} from "../Couriers/dto/CourierConfigurationDto";

type EnforcedSettings = Partial<Record<CourierSetting, boolean>>;

function CourierConfigurationPolicyPanel() {
    const translation = pl.globalConfiguration.courierConfiguration;
    const [policy, setPolicy] = useState<CourierConfigurationPolicyDto | null>(null);
    const [enforcedSettings, setEnforcedSettings] = useState<EnforcedSettings>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [conflict, setConflict] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const loadPolicy = useCallback(() => {
        setLoading(true);
        setError("");
        setConflict(false);
        CourierConfigurationService.getPolicy()
            .then((response) => {
                setPolicy(response.data);
                setEnforcedSettings(response.data.enforcedSettings);
            })
            .catch((exception: unknown) => setError(courierErrorMessage(exception, translation.messages.policyLoadError)))
            .finally(() => setLoading(false));
    }, [translation]);

    useEffect(() => {
        loadPolicy();
    }, [loadPolicy]);

    const changeMode = (setting: CourierSetting, mode: CourierPolicyMode) => {
        setEnforcedSettings((currentSettings) => {
            const nextSettings = {...currentSettings};
            if (mode === "SUPPLIER") {
                delete nextSettings[setting];
            } else {
                nextSettings[setting] = mode === "ENFORCED_ON";
            }
            return nextSettings;
        });
        setSuccessMessage("");
    };

    const savePolicy = () => {
        setSaving(true);
        setError("");
        CourierConfigurationService.updatePolicy({version: policy?.version ?? null, enforcedSettings})
            .then((response) => {
                setPolicy(response.data);
                setEnforcedSettings(response.data.enforcedSettings);
                setSuccessMessage(translation.messages.policySaved);
            })
            .catch((exception: unknown) => {
                if (isCourierConfigurationConflict(exception)) {
                    setConflict(true);
                    return;
                }
                setError(courierErrorMessage(exception, translation.messages.policySaveError));
            })
            .finally(() => setSaving(false));
    };

    return (
        <section className="courier-policy-panel">
            <header className="courier-policy-header">
                <div>
                    <h3>{translation.policy.title}</h3>
                    <p>{translation.policy.description}</p>
                </div>
                <Button disabled={loading || saving || conflict} startIcon={<Save />} variant="contained" onClick={savePolicy}>
                    {translation.actions.savePolicy}
                </Button>
            </header>
            {successMessage ? <Alert severity="success">{successMessage}</Alert> : undefined}
            {conflict ? (
                <Alert
                    severity="warning"
                    action={<Button startIcon={<Refresh />} variant="outlined" onClick={loadPolicy}>{translation.actions.reload}</Button>}
                >
                    {translation.messages.conflict}
                </Alert>
            ) : undefined}
            {error ? <Alert severity="error">{error}</Alert> : undefined}
            {loading ? (
                <div className="courier-configuration-loading">
                    <CircularProgress size={18} />
                    <span>{pl.common.loading}</span>
                </div>
            ) : (
                courierSettingGroups.map((group) => (
                    <fieldset className="courier-policy-group" key={group}>
                        <legend>{translation.tabs[group]}</legend>
                        {courierSettingsByGroup[group].map((setting) => (
                            <div className="courier-policy-row" key={setting}>
                                <span>{translation.settings[setting].label}</span>
                                <TextField
                                    aria-label={translation.settings[setting].label}
                                    disabled={saving}
                                    select
                                    size="small"
                                    value={toCourierPolicyMode(enforcedSettings[setting])}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => changeMode(setting, event.target.value as CourierPolicyMode)}
                                >
                                    {courierPolicyModes.map((mode) => (
                                        <MenuItem key={mode} value={mode}>{translation.policy.modes[mode]}</MenuItem>
                                    ))}
                                </TextField>
                            </div>
                        ))}
                    </fieldset>
                ))
            )}
        </section>
    );
}

export default CourierConfigurationPolicyPanel;
