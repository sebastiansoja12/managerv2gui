import React, {useCallback, useEffect, useState} from "react";
import {Alert, Button, Chip, CircularProgress} from "components/ui";
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

    const enforcedCount = Object.keys(enforcedSettings).length;
    const totalCount = courierSettingGroups.reduce((total, group) => total + courierSettingsByGroup[group].length, 0);
    const hasUnsavedChanges = policy !== null
        && JSON.stringify(sortedSettings(enforcedSettings)) !== JSON.stringify(sortedSettings(policy.enforcedSettings));

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
        <section className="global-configuration-section courier-policy-panel">
            <div className="global-configuration-panel-header courier-policy-header">
                <div>
                    <h3>{translation.policy.title}</h3>
                    <p>{translation.policy.description}</p>
                </div>
                <div className="courier-policy-actions">
                    {hasUnsavedChanges ? <Chip size="small" color="warning" label={translation.messages.unsavedChanges} /> : null}
                    <Chip size="small" variant="outlined" label={translation.policy.enforcedSummary
                        .replace("{count}", String(enforcedCount)).replace("{total}", String(totalCount))} />
                    <Button disabled={loading || saving || conflict || !hasUnsavedChanges}
                            startIcon={saving ? <CircularProgress size={18} /> : <Save />}
                            variant="contained" onClick={savePolicy}>
                        {translation.actions.savePolicy}
                    </Button>
                </div>
            </div>
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
                <div className="courier-policy-groups">
                    {courierSettingGroups.map((group) => {
                        const settings = courierSettingsByGroup[group];
                        const groupEnforced = settings.filter((setting) => enforcedSettings[setting] !== undefined).length;
                        return (
                            <section className="courier-policy-group" key={group} aria-labelledby={`courier-policy-${group}`}>
                                <header className="courier-policy-group-header">
                                    <h4 id={`courier-policy-${group}`}>{translation.tabs[group]}</h4>
                                    {groupEnforced > 0 ? (
                                        <span className="courier-policy-group-count">
                                            {translation.policy.groupEnforced.replace("{count}", String(groupEnforced))}
                                        </span>
                                    ) : null}
                                </header>
                                <ul className="courier-policy-rows">
                                    {settings.map((setting) => {
                                        const mode = toCourierPolicyMode(enforcedSettings[setting]);
                                        return (
                                            <li className={`courier-policy-row${mode === "SUPPLIER" ? "" : " is-enforced"}`} key={setting}>
                                                <div className="courier-policy-row-text">
                                                    <span className="courier-policy-row-label">{translation.settings[setting].label}</span>
                                                    <span className="courier-policy-row-description">
                                                        {translation.settings[setting].description}
                                                    </span>
                                                </div>
                                                <div className="courier-policy-segmented" role="radiogroup"
                                                     aria-label={`${translation.settings[setting].label}: ${translation.policy.modeLabel}`}>
                                                    {courierPolicyModes.map((option) => (
                                                        <label className={`courier-policy-segment courier-policy-segment-${option.toLowerCase()}`}
                                                               key={option} title={translation.policy.modes[option]}>
                                                            <input type="radio" name={`courier-policy-${setting}`} value={option}
                                                                   checked={mode === option} disabled={saving}
                                                                   aria-label={translation.policy.modes[option]}
                                                                   onChange={() => changeMode(setting, option)} />
                                                            <span>{translation.policy.modesShort[option]}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

const sortedSettings = (settings: EnforcedSettings) => Object.fromEntries(
    Object.entries(settings).sort(([first], [second]) => first.localeCompare(second)));

export default CourierConfigurationPolicyPanel;
