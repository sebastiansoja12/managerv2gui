import React, {useEffect, useState} from "react";
import {Alert, Button, CircularProgress, FormControlLabel, MenuItem, Switch, TextField} from "components/ui";
import {Map as MapIcon, Refresh, Save} from "components/ui/icons";
import {getBackendErrorMessage} from "../../api/errorMessage";
import {useAuthState} from "../../auth/AuthState";
import Department from "../../class/depots/Department";
import departmentService from "../../hooks/DepartmentService";
import {canEditOperatorConfiguration} from "../../config/roleAccess";
import pl from "../../i18n/translate";
import {applyDepartmentAutomations} from "./departmentAutomation";
import {
    defaultDepartmentPolicies,
    DepartmentConfiguration,
    DepartmentConfigurationOverride,
    DepartmentPolicies,
    DepartmentPolicyKey,
    DepartmentSettingKey,
    readDepartmentConfigurationOverride,
    useDepartmentConfiguration,
    writeDepartmentConfiguration,
    writeDepartmentConfigurationOverride,
} from "./model/DepartmentConfiguration";

type SettingKey = DepartmentSettingKey;

type SectionKey = DepartmentPolicyKey | "protection";

const sectionSettings: Record<SectionKey, SettingKey[]> = {
    deliveryAreaPolicy: ["autoAssignDeliveryAreas"],
    connectionPolicy: ["autoConnectDepartments"],
    lifecyclePolicy: [],
    capacityPolicy: [],
    protection: ["preventDepartmentDeletion", "preventDepartmentArchiving"],
};

const sectionKeys: SectionKey[] = ["deliveryAreaPolicy", "connectionPolicy", "lifecyclePolicy", "protection",
    "capacityPolicy"];

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

const isFieldDisabled = (policy: DepartmentPolicyKey, fieldKey: string, deliveryAreaMode: unknown) => (
    policy === "deliveryAreaPolicy"
    && fieldKey === "maxDeliveryRadiusKm"
    && deliveryAreaMode !== "RADIUS"
);

const departmentLabel = (department: Department) => [department.departmentCode?.value, department.address?.city]
    .filter(Boolean)
    .join(" · ");

function DepartmentConfigurationPanel() {
    const {user} = useAuthState();
    const operatorId = user?.operatorId?.value;
    const current = useDepartmentConfiguration(operatorId);
    const [draft, setDraft] = useState<DepartmentConfiguration>(current);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [scope, setScope] = useState<string>("");
    const [overrideDraft, setOverrideDraft] = useState<DepartmentConfigurationOverride>({});
    const [loadingOverride, setLoadingOverride] = useState(false);
    const [saving, setSaving] = useState(false);
    const [assigningAreas, setAssigningAreas] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const labels = pl.globalConfiguration.departmentConfiguration;
    const departmentScope = scope !== "";
    const busy = saving || loadingOverride;
    const operatorScopeAllowed = canEditOperatorConfiguration(user?.role);
    const scopeDepartments = operatorScopeAllowed
        ? departments
        : departments.filter((department) => department.departmentCode?.value === user?.departmentCode);
    const ownDepartmentScope = scopeDepartments[0] ? String(scopeDepartments[0].departmentId) : "";

    useEffect(() => {
        if (!operatorScopeAllowed && ownDepartmentScope && scope !== ownDepartmentScope) {
            setScope(ownDepartmentScope);
        }
    }, [operatorScopeAllowed, ownDepartmentScope, scope]);

    useEffect(() => setDraft(current), [current]);

    useEffect(() => {
        departmentService.getAll()
            .then((response) => setDepartments(response.data || []))
            .catch(() => setDepartments([]));
    }, []);

    useEffect(() => {
        setSuccess(null);
        setError(null);
        if (!departmentScope) {
            setOverrideDraft({});
            return;
        }
        let active = true;
        setLoadingOverride(true);
        readDepartmentConfigurationOverride(scope)
            .then((override) => {
                if (active) setOverrideDraft(override);
            })
            .catch((cause) => {
                if (active) setError(getBackendErrorMessage(cause, labels.scope.loadError));
            })
            .finally(() => {
                if (active) setLoadingOverride(false);
            });
        return () => {
            active = false;
        };
    }, [departmentScope, labels.scope.loadError, scope]);

    const overrideValue = (policy: DepartmentPolicyKey, key: string) => (
        (overrideDraft[policy] as Record<string, unknown> | null | undefined)?.[key]
    );

    const isOverridden = (policy: DepartmentPolicyKey | null, key: string) => departmentScope && (policy === null
        ? overrideDraft[key as SettingKey] !== undefined && overrideDraft[key as SettingKey] !== null
        : overrideValue(policy, key) !== undefined && overrideValue(policy, key) !== null);

    const policyValue = (policy: DepartmentPolicyKey, key: string) => {
        if (isOverridden(policy, key)) {
            return overrideValue(policy, key) as string | number | boolean;
        }
        return policyValues(departmentScope ? current : draft, policy)[key];
    };

    const settingValue = (key: SettingKey) => (
        isOverridden(null, key) ? overrideDraft[key] === true : (departmentScope ? current : draft)[key]
    );

    const fieldDisabled = (policy: DepartmentPolicyKey, key: string) => (
        isFieldDisabled(policy, key, policyValue("deliveryAreaPolicy", "deliveryAreaMode"))
    );

    const hasErrors = policyKeys.some((policy) => policyFields[policy].some((field) => (
        !fieldDisabled(policy, field.key) && numberFieldError(field, policyValue(policy, field.key))
    )));

    const updatePolicy = (policy: DepartmentPolicyKey, key: string, value: string | number | boolean | null) => {
        if (departmentScope) {
            setOverrideDraft((currentOverride) => ({
                ...currentOverride,
                [policy]: {...(currentOverride[policy] || {}), [key]: value},
            }));
        } else {
            setDraft((currentDraft) => ({
                ...currentDraft,
                [policy]: {...policyValues(currentDraft, policy), [key]: value} as unknown as DepartmentPolicies[typeof policy],
            }));
        }
        setSuccess(null);
    };

    const updateSetting = (key: SettingKey, value: boolean | null) => {
        if (departmentScope) {
            setOverrideDraft((currentOverride) => ({...currentOverride, [key]: value}));
        } else if (value !== null) {
            setDraft((currentDraft) => ({...currentDraft, [key]: value}));
        }
        setSuccess(null);
    };

    const save = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            if (departmentScope) {
                setOverrideDraft(await writeDepartmentConfigurationOverride(scope, overrideDraft));
                const department = departments.find((item) => String(item.departmentId) === scope);
                setSuccess(labels.scope.saved.replace("{department}", department ? departmentLabel(department) : scope));
            } else {
                await writeDepartmentConfiguration(draft);
                setSuccess(labels.saved);
            }
        } catch (cause) {
            setError(getBackendErrorMessage(cause, labels.saveError));
        } finally {
            setSaving(false);
        }
    };

    const assignDeliveryAreas = async () => {
        setAssigningAreas(true);
        setError(null);
        setSuccess(null);
        try {
            const allDepartments = (await departmentService.getAll()).data || [];
            const result = await applyDepartmentAutomations({...current, autoAssignDeliveryAreas: true}, allDepartments);
            setSuccess(labels.areasAssigned.replace("{areas}", String(result.assignedAreas)));
        } catch (cause) {
            setError(getBackendErrorMessage(cause, labels.areasAssignError));
        } finally {
            setAssigningAreas(false);
        }
    };

    const inheritanceControl = (overridden: boolean, fieldLabel: string, reset: () => void) => {
        if (!departmentScope) {
            return undefined;
        }
        return overridden ? (
            <Button
                aria-label={labels.scope.inheritField.replace("{field}", fieldLabel)}
                className="department-setting-inherit"
                disabled={busy}
                size="small"
                startIcon={<Refresh />}
                variant="text"
                onClick={reset}
            >
                {labels.scope.inherit}
            </Button>
        ) : <span className="department-setting-inherited">{labels.scope.inherited}</span>;
    };

    const rowClassName = (overridden: boolean, disabled = false) => [
        "shipment-setting-row",
        disabled ? "shipment-setting-row--disabled" : "",
        overridden ? "department-setting-row--overridden" : "",
    ].filter(Boolean).join(" ");

    const renderSetting = (key: SettingKey) => {
        const overridden = isOverridden(null, key);
        const value = settingValue(key);
        return (
            <div className={rowClassName(overridden)} key={key}>
                <span className="shipment-setting-copy">
                    <strong>{labels.settings[key].label}</strong>
                    <small>{labels.settings[key].hint}</small>
                    {inheritanceControl(overridden, labels.settings[key].label, () => updateSetting(key, null))}
                </span>
                <FormControlLabel
                    control={(
                        <Switch
                            aria-label={labels.settings[key].label}
                            checked={value}
                            disabled={busy}
                            onChange={(event) => updateSetting(key, event.target.checked)}
                        />
                    )}
                    label={value ? labels.values.enabled : labels.values.disabled}
                />
            </div>
        );
    };

    const sectionCopy = (section: SectionKey) => (
        section === "protection" ? labels.protection : labels.policies[section]
    );

    const renderPolicyField = (policy: DepartmentPolicyKey, field: PolicyField) => {
        const baseLabels = labels.policies[policy].fields[field.key as keyof typeof labels.policies[typeof policy]["fields"]] as
            {label: string; hint: string};
        const fieldLabels = departmentScope && policy === "capacityPolicy" && field.key === "defaultDailyCapacity"
            ? labels.scope.dailyCapacity : baseLabels;
        const value = policyValue(policy, field.key);
        const overridden = isOverridden(policy, field.key);
        const disabled = busy || fieldDisabled(policy, field.key);
        const copy = (
            <span className="shipment-setting-copy">
                <strong>{fieldLabels.label}</strong>
                <small>{fieldLabels.hint}</small>
                {inheritanceControl(overridden, fieldLabels.label, () => updatePolicy(policy, field.key, null))}
            </span>
        );

        if (field.kind === "boolean") {
            return (
                <div className={rowClassName(overridden)} key={field.key}>
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
                <div className={rowClassName(overridden)} key={field.key}>
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
                className={rowClassName(overridden, disabled)}
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
            <Button disabled={busy || hasErrors || (!departmentScope && !operatorScopeAllowed)} startIcon={saving ? <CircularProgress size={18} /> : <Save />}
                    variant="contained" onClick={save}>{saving ? labels.saving : pl.common.saveChanges}</Button>
        </div>
        <Alert severity="info">{labels.serverNote}</Alert>
        <div className="department-configuration-scope">
            <TextField
                className="department-configuration-scope-select"
                disabled={saving}
                label={labels.scope.label}
                select
                size="small"
                value={scope}
                onChange={(event) => setScope(event.target.value)}
            >
                {operatorScopeAllowed ? <MenuItem value="">{labels.scope.defaults}</MenuItem> : null}
                {scopeDepartments.map((department) => (
                    <MenuItem key={department.departmentId} value={String(department.departmentId)}>
                        {departmentLabel(department)}
                    </MenuItem>
                ))}
            </TextField>
            {departmentScope ? (
                <>
                    <span>{labels.scope.departmentNote}</span>
                    <Button disabled={busy} startIcon={<Refresh />} variant="outlined"
                            onClick={() => {
                                setOverrideDraft({});
                                setSuccess(null);
                            }}>
                        {labels.scope.inheritAll}
                    </Button>
                </>
            ) : <span>{labels.scope.defaultsNote}</span>}
        </div>
        {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : null}
        {success ? <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert> : null}
        {loadingOverride ? <CircularProgress size={24} /> : null}
        <div className="shipment-configuration-sections">
            {sectionKeys.map((section) => (
                <section className="shipment-configuration-group" key={section}>
                    <header>
                        <div>
                            <h3>{sectionCopy(section).title}</h3>
                            <p>{sectionCopy(section).description}</p>
                        </div>
                        {section === "deliveryAreaPolicy" ? (
                            <Button
                                disabled={busy || assigningAreas}
                                startIcon={assigningAreas ? <CircularProgress size={18} /> : <MapIcon />}
                                variant="outlined"
                                onClick={assignDeliveryAreas}
                            >
                                {assigningAreas ? labels.assigningAreas : labels.assignAreas}
                            </Button>
                        ) : undefined}
                    </header>
                    <div className="shipment-configuration-grid">
                        {sectionSettings[section].map(renderSetting)}
                        {section === "protection" ? undefined
                            : policyFields[section].map((field) => renderPolicyField(section, field))}
                    </div>
                </section>
            ))}
        </div>
    </section>;
}

export default DepartmentConfigurationPanel;
