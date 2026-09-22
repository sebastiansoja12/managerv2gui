import React, {useEffect, useState} from "react";
import {Alert, Button, CircularProgress, FormControlLabel, MenuItem, Switch, TextField} from "components/ui";
import {Save} from "components/ui/icons";
import {getBackendErrorMessage} from "../../api/errorMessage";
import {useAuthState} from "../../auth/AuthState";
import departmentService from "../../hooks/DepartmentService";
import pl from "../../i18n/translate";
import {applyDepartmentAutomations} from "./departmentAutomation";
import {
    defaultDepartmentPolicies,
    DepartmentConfiguration,
    DepartmentPolicies,
    DepartmentPolicyKey,
    useDepartmentConfiguration,
    writeDepartmentConfiguration,
} from "./model/DepartmentConfiguration";

type SettingKey = "autoAssignDeliveryAreas" | "autoConnectDepartments"
    | "preventDepartmentDeletion" | "preventDepartmentArchiving";

const settingKeys: SettingKey[] = [
    "autoAssignDeliveryAreas", "autoConnectDepartments", "preventDepartmentDeletion", "preventDepartmentArchiving",
];

type PolicyField =
    | {key: string; kind: "boolean"}
    | {key: string; kind: "select"; options: string[]}
    | {key: string; kind: "number"; min: number; max: number; unit?: "km" | "days" | "percent" | "shipments" | "couriers"};

const policyFields: Record<DepartmentPolicyKey, PolicyField[]> = {
    deliveryAreaPolicy: [
        {key: "deliveryAreaMode", kind: "select", options: ["COUNTRY_PARTITION", "RADIUS"]},
        {key: "maxDeliveryRadiusKm", kind: "number", min: 1, max: 500, unit: "km"},
        {key: "allowManualDeliveryAreaEdit", kind: "boolean"},
        {key: "recalculateAreasOnStatusChange", kind: "boolean"},
        {key: "uncoveredPostalCodePolicy", kind: "select", options: ["WARN", "ASSIGN_NEAREST", "BLOCK"]},
    ],
    connectionPolicy: [
        {key: "sortingCenterConnectionCount", kind: "number", min: 1, max: 3},
        {key: "maxAutoConnectionDistanceKm", kind: "number", min: 1, max: 1000, unit: "km"},
        {key: "requireSortingConnectionForActivation", kind: "boolean"},
        {key: "bidirectionalConnectionsByDefault", kind: "boolean"},
    ],
    lifecyclePolicy: [
        {key: "requireStatusChangeReason", kind: "boolean"},
        {key: "blockDeactivationWithActiveWork", kind: "boolean"},
        {key: "workTransferOnDeactivation", kind: "select", options: ["MANUAL", "AUTOMATIC"]},
        {key: "autoArchiveInactiveAfterDays", kind: "number", min: 0, max: 3650, unit: "days"},
    ],
    capacityPolicy: [
        {key: "defaultDailyCapacity", kind: "number", min: 1, max: 1000000, unit: "shipments"},
        {key: "capacityWarningThresholdPercent", kind: "number", min: 1, max: 100, unit: "percent"},
        {key: "redirectOverflowToNeighbour", kind: "boolean"},
        {key: "maxCouriersPerDepartment", kind: "number", min: 0, max: 1000, unit: "couriers"},
    ],
};

const policyKeys = Object.keys(policyFields) as DepartmentPolicyKey[];

type PolicyValues = Record<string, string | number | boolean>;

const policyValues = (draft: DepartmentConfiguration, policy: DepartmentPolicyKey) => (
    (draft[policy] ?? defaultDepartmentPolicies[policy]) as unknown as PolicyValues
);

const numberFieldError = (field: PolicyField, value: unknown) => {
    if (field.kind !== "number") return null;
    const messages = pl.globalConfiguration.departmentConfiguration.validation;
    const numberValue = Number(value);
    if (!Number.isInteger(numberValue)) return messages.integer;
    if (numberValue < field.min || numberValue > field.max) {
        return messages.range.replace("{min}", String(field.min)).replace("{max}", String(field.max));
    }
    return null;
};

const isFieldDisabled = (policy: DepartmentPolicyKey, fieldKey: string, draft: DepartmentConfiguration) => (
    policy === "deliveryAreaPolicy"
    && fieldKey === "maxDeliveryRadiusKm"
    && policyValues(draft, policy).deliveryAreaMode !== "RADIUS"
);

function DepartmentConfigurationPanel() {
    const {user} = useAuthState();
    const operatorId = user?.operatorId?.value;
    const current = useDepartmentConfiguration(operatorId);
    const [draft, setDraft] = useState<DepartmentConfiguration>(current);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const labels = pl.globalConfiguration.departmentConfiguration;

    useEffect(() => setDraft(current), [current]);

    const hasErrors = policyKeys.some((policy) => policyFields[policy].some((field) => (
        !isFieldDisabled(policy, field.key, draft) && numberFieldError(field, policyValues(draft, policy)[field.key])
    )));

    const updatePolicy = (policy: DepartmentPolicyKey, key: string, value: string | number | boolean) => {
        setDraft((currentDraft) => ({
            ...currentDraft,
            [policy]: {...policyValues(currentDraft, policy), [key]: value} as unknown as DepartmentPolicies[typeof policy],
        }));
        setSuccess(null);
    };

    const save = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const departments = draft.autoAssignDeliveryAreas
                ? (await departmentService.getAll()).data || [] : [];
            await writeDepartmentConfiguration(draft);
            const result = await applyDepartmentAutomations(draft, departments);
            setSuccess(labels.saved.replace("{areas}", String(result.assignedAreas))
                .replace("{connections}", String(result.createdConnections)));
        } catch (cause) {
            setError(getBackendErrorMessage(cause, labels.saveError));
        } finally {
            setSaving(false);
        }
    };

    const renderPolicyField = (policy: DepartmentPolicyKey, field: PolicyField) => {
        const fieldLabels = labels.policies[policy].fields[field.key as keyof typeof labels.policies[typeof policy]["fields"]] as
            {label: string; hint: string};
        const value = policyValues(draft, policy)[field.key];
        const disabled = saving || isFieldDisabled(policy, field.key, draft);
        const copy = (
            <span className="shipment-setting-copy">
                <strong>{fieldLabels.label}</strong>
                <small>{fieldLabels.hint}</small>
            </span>
        );

        if (field.kind === "boolean") {
            return (
                <div className="shipment-setting-row" key={field.key}>
                    {copy}
                    <FormControlLabel
                        control={(
                            <Switch
                                aria-label={fieldLabels.label}
                                checked={value === true}
                                disabled={disabled}
                                onChange={(event) => updatePolicy(policy, field.key, event.target.checked)}
                            />
                        )}
                        label={value ? labels.values.enabled : labels.values.disabled}
                    />
                </div>
            );
        }

        if (field.kind === "select") {
            const options = labels.options[field.key as keyof typeof labels.options] as Record<string, string>;
            return (
                <div className="shipment-setting-row" key={field.key}>
                    {copy}
                    <TextField
                        aria-label={fieldLabels.label}
                        className="shipment-setting-select"
                        disabled={disabled}
                        fullWidth
                        select
                        size="small"
                        value={value}
                        onChange={(event) => updatePolicy(policy, field.key, event.target.value)}
                    >
                        {field.options.map((option) => (
                            <MenuItem key={option} value={option}>{options[option]}</MenuItem>
                        ))}
                    </TextField>
                </div>
            );
        }

        const fieldError = disabled ? null : numberFieldError(field, value);
        return (
            <div
                aria-disabled={disabled || undefined}
                className={disabled ? "shipment-setting-row shipment-setting-row--disabled" : "shipment-setting-row"}
                key={field.key}
            >
                {copy}
                <div className="shipment-setting-input">
                    <TextField
                        aria-label={fieldLabels.label}
                        disabled={disabled}
                        error={Boolean(fieldError)}
                        fullWidth
                        helperText={fieldError || undefined}
                        inputProps={{min: field.min, max: field.max, step: 1}}
                        size="small"
                        type="number"
                        value={String(value)}
                        onChange={(event) => updatePolicy(policy, field.key,
                            event.target.value === "" ? Number.NaN : Number(event.target.value))}
                    />
                    {field.unit ? <span>{labels.units[field.unit]}</span> : undefined}
                </div>
            </div>
        );
    };

    return <section className="global-configuration-section global-configuration-department-panel">
        <div className="global-configuration-panel-header">
            <div>
                <h3>{labels.title}</h3>
                <p>{labels.description}</p>
            </div>
            <Button disabled={saving || hasErrors} startIcon={saving ? <CircularProgress size={18} /> : <Save />}
                    variant="contained" onClick={save}>{saving ? labels.saving : pl.common.saveChanges}</Button>
        </div>
        <Alert severity="info">{labels.serverNote}</Alert>
        {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : null}
        {success ? <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert> : null}
        <div className="global-configuration-department-settings">
            {settingKeys.map((key) => <div className="global-configuration-department-setting" key={key}>
                <FormControlLabel control={<Switch checked={draft[key]} disabled={saving}
                    onChange={(event) => {
                        setDraft((value) => ({...value, [key]: event.target.checked}));
                        setSuccess(null);
                    }} />}
                    label={labels.settings[key].label} />
                <p>{labels.settings[key].hint}</p>
            </div>)}
        </div>
        <div className="shipment-configuration-sections">
            {policyKeys.map((policy) => (
                <section className="shipment-configuration-group" key={policy}>
                    <header>
                        <div>
                            <h3>{labels.policies[policy].title}</h3>
                            <p>{labels.policies[policy].description}</p>
                        </div>
                    </header>
                    <div className="shipment-configuration-grid">
                        {policyFields[policy].map((field) => renderPolicyField(policy, field))}
                    </div>
                </section>
            ))}
        </div>
    </section>;
}

export default DepartmentConfigurationPanel;
