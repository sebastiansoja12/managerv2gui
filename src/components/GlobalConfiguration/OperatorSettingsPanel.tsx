import React, {useEffect, useState} from "react";
import {Alert, Button, CircularProgress, FormControlLabel, MenuItem, Snackbar, Switch, TextField} from "components/ui";
import {CheckCircle, InfoOutlined, Save} from "components/ui/icons";
import {getBackendErrorMessage} from "../../api/errorMessage";
import pl from "../../i18n/translate";

type SettingValues = Record<string, string | number | boolean>;

type DraftValues = Record<string, string | boolean>;

type FieldCondition = {disabledWhen?: (values: DraftValues) => boolean};

export type OperatorSettingField = FieldCondition & (
    | {key: string; kind: "boolean"}
    | {key: string; kind: "number"; min: number; max?: number; step?: number; unit?: string; integer?: boolean}
    | {key: string; kind: "text"; inputType?: "email" | "url"; maxLength: number; multiline?: boolean}
    | {key: string; kind: "select"; options: string[]}
    | {key: string; kind: "time"}
    | {key: string; kind: "color"}
);

export type OperatorSettingGroup = {
    key: string;
    fields: OperatorSettingField[];
};

export type OperatorSettingLabels = {
    groups: Record<string, {title: string; description: string}>;
    fields: Record<string, {label: string; hint: string}>;
    options?: Record<string, Record<string, string>>;
};

type OperatorSettingsPanelProps<Configuration extends object> = {
    groups: OperatorSettingGroup[];
    labels: OperatorSettingLabels;
    defaults: Configuration;
    load: () => Promise<Configuration>;
    save: (configuration: Configuration) => Promise<Configuration>;
    validate?: (configuration: Configuration) => string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^https?:\/\/\S+$/i;
const COLOR_PATTERN = /^#[0-9A-F]{6}$/i;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const toDraft = (configuration: object): DraftValues => Object.fromEntries(
    Object.entries(configuration as SettingValues).map(([key, value]) => [
        key,
        typeof value === "number" ? String(value) : value,
    ]),
);

const allFields = (groups: OperatorSettingGroup[]) => groups.flatMap((group) => group.fields);

const toConfiguration = <Configuration extends object>(
    draft: DraftValues,
    groups: OperatorSettingGroup[],
): Configuration => Object.fromEntries(allFields(groups).map((field) => [
    field.key,
    field.kind === "number" ? Number(draft[field.key]) : draft[field.key],
])) as Configuration;

const fieldError = (field: OperatorSettingField, value: string | boolean) => {
    const messages = pl.globalConfiguration.operatorSettings.validation;
    if (field.kind === "number") {
        const numberValue = Number(value);
        if (value === "" || !Number.isFinite(numberValue)) return messages.number;
        if (field.integer !== false && !Number.isInteger(numberValue)) return messages.integer;
        if (numberValue < field.min) return messages.min.replace("{min}", String(field.min));
        if (field.max !== undefined && numberValue > field.max) {
            return messages.max.replace("{max}", String(field.max));
        }
    }
    if (field.kind === "text" && typeof value === "string" && value.trim()) {
        if (field.inputType === "email" && !EMAIL_PATTERN.test(value.trim())) return messages.email;
        if (field.inputType === "url" && !URL_PATTERN.test(value.trim())) return messages.url;
    }
    if (field.kind === "color" && !COLOR_PATTERN.test(String(value))) return messages.color;
    if (field.kind === "time" && !TIME_PATTERN.test(String(value))) return messages.time;
    return null;
};

function OperatorSettingsPanel<Configuration extends object>({
    groups,
    labels,
    defaults,
    load,
    save,
    validate,
}: OperatorSettingsPanelProps<Configuration>) {
    const messages = pl.globalConfiguration.operatorSettings;
    const [draft, setDraft] = useState<DraftValues>(() => toDraft(defaults));
    const [persisted, setPersisted] = useState<DraftValues | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const loadConfiguration = async () => {
            try {
                setLoading(true);
                setError(null);
                const loaded = toDraft({...defaults, ...(await load())});
                if (active) {
                    setDraft(loaded);
                    setPersisted(loaded);
                }
            } catch (exception) {
                if (active) setError(getBackendErrorMessage(exception, messages.loadError));
            } finally {
                if (active) setLoading(false);
            }
        };
        loadConfiguration();
        return () => {
            active = false;
        };
    }, [defaults, load, messages.loadError]);

    const isDisabled = (field: OperatorSettingField) => Boolean(field.disabledWhen?.(draft));
    const errors = Object.fromEntries(
        allFields(groups).map((field) => [field.key, isDisabled(field) ? null : fieldError(field, draft[field.key])]),
    );
    const hasFieldErrors = Object.values(errors).some(Boolean);
    const formError = hasFieldErrors || !validate ? null : validate(toConfiguration<Configuration>(draft, groups));
    const changed = persisted === null || JSON.stringify(draft) !== JSON.stringify(persisted);

    const updateValue = (key: string, value: string | boolean) => {
        setDraft((current) => ({...current, [key]: value}));
        setSaved(false);
    };

    const saveConfiguration = async () => {
        try {
            setSaving(true);
            setError(null);
            const savedDraft = toDraft(await save(toConfiguration<Configuration>(draft, groups)));
            setDraft(savedDraft);
            setPersisted(savedDraft);
            setSaved(true);
        } catch (exception) {
            setError(getBackendErrorMessage(exception, messages.saveError));
        } finally {
            setSaving(false);
        }
    };

    const renderCopy = (key: string) => (
        <span className="shipment-setting-copy">
            <strong>{labels.fields[key].label}</strong>
            <small>{labels.fields[key].hint}</small>
        </span>
    );

    const renderField = (field: OperatorSettingField) => {
        const label = labels.fields[field.key].label;
        const value = draft[field.key];
        const fieldErrorMessage = errors[field.key] || undefined;

        if (field.kind === "boolean") {
            return (
                <div className="shipment-setting-row" key={field.key}>
                    {renderCopy(field.key)}
                    <FormControlLabel
                        control={(
                            <Switch
                                aria-label={label}
                                checked={value === true}
                                disabled={isDisabled(field)}
                                onChange={(event) => updateValue(field.key, event.target.checked)}
                            />
                        )}
                        label={value ? messages.values.enabled : messages.values.disabled}
                    />
                </div>
            );
        }

        if (field.kind === "select") {
            return (
                <div className="shipment-setting-row" key={field.key}>
                    {renderCopy(field.key)}
                    <TextField
                        aria-label={label}
                        className="shipment-setting-select"
                        disabled={isDisabled(field)}
                        fullWidth
                        select
                        size="small"
                        value={value}
                        onChange={(event) => updateValue(field.key, event.target.value)}
                    >
                        {field.options.map((option) => (
                            <MenuItem key={option} value={option}>
                                {labels.options?.[field.key]?.[option] ?? option}
                            </MenuItem>
                        ))}
                    </TextField>
                </div>
            );
        }

        const inputType = field.kind === "number" ? "number"
            : field.kind === "time" ? "time"
                : field.kind === "text" ? field.inputType || "text" : "text";
        const disabled = isDisabled(field);
        return (
            <div
                aria-disabled={disabled || undefined}
                className={disabled ? "shipment-setting-row shipment-setting-row--disabled" : "shipment-setting-row"}
                key={field.key}
            >
                {renderCopy(field.key)}
                <div className="shipment-setting-input">
                    {field.kind === "color" ? (
                        <input
                            aria-label={`${label}: ${messages.colorPicker}`}
                            className="operator-settings-color-swatch"
                            disabled={disabled}
                            type="color"
                            value={COLOR_PATTERN.test(String(value)) ? String(value) : "#000000"}
                            onChange={(event) => updateValue(field.key, event.target.value.toUpperCase())}
                        />
                    ) : undefined}
                    <TextField
                        aria-label={label}
                        disabled={disabled}
                        error={Boolean(fieldErrorMessage)}
                        fullWidth
                        helperText={fieldErrorMessage}
                        inputProps={field.kind === "number"
                            ? {min: field.min, max: field.max, step: field.step ?? 1}
                            : {maxLength: field.kind === "text" ? field.maxLength : field.kind === "color" ? 7 : undefined}}
                        minRows={field.kind === "text" && field.multiline ? 3 : undefined}
                        multiline={field.kind === "text" && field.multiline}
                        size="small"
                        type={inputType}
                        value={value}
                        onChange={(event) => updateValue(field.key, event.target.value)}
                    />
                    {field.kind === "number" && field.unit ? <span>{field.unit}</span> : undefined}
                </div>
            </div>
        );
    };

    return (
        <section className="global-configuration-section global-configuration-shipment-panel">
            <div className="shipment-configuration-topbar">
                <div className="global-configuration-preview-note">
                    <InfoOutlined fontSize="small" />
                    <span>{messages.previewNote}</span>
                </div>
                <Button
                    disabled={loading || saving || !changed || hasFieldErrors || Boolean(formError)}
                    startIcon={saving ? <CircularProgress size={18} /> : <Save />}
                    variant="outlined"
                    onClick={saveConfiguration}
                >
                    {saving ? messages.saving : pl.common.saveChanges}
                </Button>
            </div>

            {loading ? (
                <Alert severity="info">
                    <span className="shipment-configuration-loading">
                        <CircularProgress size={18} />
                        {messages.loading}
                    </span>
                </Alert>
            ) : undefined}
            {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : undefined}
            {formError ? <Alert severity="warning">{formError}</Alert> : undefined}

            <div className="shipment-configuration-sections">
                {groups.map((group) => (
                    <section className="shipment-configuration-group" key={group.key}>
                        <header>
                            <div>
                                <h3>{labels.groups[group.key].title}</h3>
                                <p>{labels.groups[group.key].description}</p>
                            </div>
                        </header>
                        <div className="shipment-configuration-grid">
                            {group.fields.map(renderField)}
                        </div>
                    </section>
                ))}
            </div>

            <Snackbar
                anchorOrigin={{vertical: "bottom", horizontal: "right"}}
                className="shipment-configuration-toast"
                open={saved}
                autoHideDuration={4500}
                onClose={() => setSaved(false)}
            >
                <Alert className="shipment-configuration-toast-alert" severity="success" onClose={() => setSaved(false)}>
                    <span className="shipment-configuration-toast-icon">
                        <CheckCircle fontSize="small" />
                    </span>
                    <span className="shipment-configuration-toast-copy">
                        <strong>{messages.saved}</strong>
                    </span>
                </Alert>
            </Snackbar>
        </section>
    );
}

export default OperatorSettingsPanel;
