import React, {FormEvent, useEffect, useMemo, useState} from "react";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
} from "@mui/material";
import {Cable} from "@mui/icons-material";
import {getBackendErrorMessage} from "../../api/errorMessage";
import TrackingService from "../../hooks/TrackingService";
import pl from "../../i18n/translate";
import {
    TrackingIntegration,
    TrackingIntegrationDefinition,
    TrackingIntegrationRequest,
    TrackingProviderId,
} from "./model/TrackingIntegration";

type IntegrationConfigurationDialogProps = {
    configurations: TrackingIntegration[];
    definitions: TrackingIntegrationDefinition[];
    editingConfiguration: TrackingIntegration | null;
    open: boolean;
    onClose: () => void;
    onSaved: (
        definition: TrackingIntegrationDefinition,
        request: TrackingIntegrationRequest,
        configuredSecretFields: string[],
    ) => void;
};

const initialValues = (
    definition: TrackingIntegrationDefinition | undefined,
    configuration: TrackingIntegration | null,
) => Object.fromEntries((definition?.fields || []).map((field) => [
    field.key,
    configuration?.values[field.key] ?? field.defaultValue ?? "",
]));

function IntegrationConfigurationDialog({
    configurations,
    definitions,
    editingConfiguration,
    open,
    onClose,
    onSaved,
}: IntegrationConfigurationDialogProps) {
    const [selectedProvider, setSelectedProvider] = useState<TrackingProviderId | "">("");
    const [values, setValues] = useState<Record<string, string>>({});
    const [enabled, setEnabled] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState("");
    const [testSuccess, setTestSuccess] = useState("");

    const configuredProviders = useMemo(
        () => new Set(configurations.filter((configuration) => configuration.configured)
            .map((configuration) => configuration.provider)),
        [configurations],
    );
    const selectedDefinition = definitions.find((definition) => definition.provider === selectedProvider);

    useEffect(() => {
        if (!open) {
            return;
        }
        const provider = editingConfiguration?.provider || "";
        const definition = definitions.find((item) => item.provider === provider);
        setSelectedProvider(provider);
        setValues(initialValues(definition, editingConfiguration));
        setEnabled(editingConfiguration?.enabled ?? true);
        setError("");
        setTestSuccess("");
    }, [definitions, editingConfiguration, open]);

    const hasRequiredValues = Boolean(selectedDefinition) && selectedDefinition!.fields.every((field) => {
        if (!field.required) {
            return true;
        }
        if (values[field.key]?.trim()) {
            return true;
        }
        return field.type === "SECRET"
            && Boolean(editingConfiguration?.configuredSecretFields.includes(field.key));
    });

    const request = (): TrackingIntegrationRequest => ({
        enabled,
        values: Object.fromEntries((selectedDefinition?.fields || []).map((field) => [
            field.key,
            values[field.key] || "",
        ])),
    });

    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedDefinition || !hasRequiredValues) {
            return;
        }

        setSaving(true);
        setError("");
        setTestSuccess("");
        const integrationRequest = request();
        try {
            await TrackingService.saveIntegration(selectedDefinition.provider, integrationRequest);
            const configuredSecrets = selectedDefinition.fields
                .filter((field) => field.type === "SECRET"
                    && (Boolean(integrationRequest.values[field.key]?.trim())
                        || Boolean(editingConfiguration?.configuredSecretFields.includes(field.key))))
                .map((field) => field.key);
            onSaved(selectedDefinition, integrationRequest, configuredSecrets);
        } catch (exception: unknown) {
            setError(getBackendErrorMessage(exception, pl.integrations.messages.saveError));
        } finally {
            setSaving(false);
        }
    };

    const testConnection = async () => {
        if (!selectedDefinition || !hasRequiredValues) {
            return;
        }

        setTesting(true);
        setError("");
        setTestSuccess("");
        try {
            await TrackingService.testIntegration(selectedDefinition.provider, request());
            setTestSuccess(pl.integrations.messages.connectionSuccess);
        } catch (exception: unknown) {
            setError(getBackendErrorMessage(exception, pl.integrations.messages.connectionError));
        } finally {
            setTesting(false);
        }
    };

    const close = () => {
        if (!saving && !testing) {
            onClose();
        }
    };

    return (
        <Dialog className="integration-configuration-dialog" fullWidth maxWidth="sm" open={open} onClose={close}>
            <form onSubmit={save}>
                <DialogTitle>{editingConfiguration
                    ? pl.integrations.dialog.editTitle
                    : pl.integrations.dialog.title}</DialogTitle>
                <DialogContent>
                    <p className="integration-dialog-description">
                        {editingConfiguration
                            ? pl.integrations.dialog.editDescription
                            : pl.integrations.dialog.description}
                    </p>
                    {error ? <Alert severity="error">{error}</Alert> : undefined}
                    {testSuccess ? <Alert severity="success">{testSuccess}</Alert> : undefined}
                    {!editingConfiguration && configuredProviders.size === definitions.length && definitions.length ? (
                        <Alert severity="info">{pl.integrations.dialog.noAvailableProviders}</Alert>
                    ) : undefined}
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="tracking-integration-provider-label">
                            {pl.integrations.dialog.providerLabel}
                        </InputLabel>
                        <Select
                            disabled={Boolean(editingConfiguration)}
                            label={pl.integrations.dialog.providerLabel}
                            labelId="tracking-integration-provider-label"
                            value={selectedProvider}
                            onChange={(event) => {
                                const provider = event.target.value as TrackingProviderId;
                                const definition = definitions.find((item) => item.provider === provider);
                                setSelectedProvider(provider);
                                setValues(initialValues(definition, null));
                                setError("");
                                setTestSuccess("");
                            }}
                        >
                            {definitions.map((definition) => (
                                <MenuItem
                                    disabled={!editingConfiguration && configuredProviders.has(definition.provider)}
                                    key={definition.provider}
                                    value={definition.provider}
                                >
                                    {definition.displayName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {selectedDefinition ? (
                        <div className="integration-dialog-fields">
                            {selectedDefinition.fields.map((field) => {
                                if (field.type === "BOOLEAN") {
                                    return (
                                        <label className="integration-enabled-control" key={field.key}>
                                        <span><strong>{field.label}</strong></span>
                                            <Switch
                                                checked={values[field.key] === "true"}
                                                onChange={(event) => setValues((current) => ({
                                                    ...current,
                                                    [field.key]: String(event.target.checked),
                                                }))}
                                            />
                                        </label>
                                    );
                                }

                                return (
                                    <TextField
                                        autoComplete={field.type === "SECRET" ? "new-password" : "off"}
                                        fullWidth
                                        helperText={field.type === "SECRET"
                                            && editingConfiguration?.configuredSecretFields.includes(field.key)
                                            ? pl.integrations.fields.secretConfigured
                                            : undefined}
                                        inputProps={{maxLength: field.maxLength}}
                                        key={field.key}
                                        label={field.label}
                                        required={field.required
                                            && !(field.type === "SECRET"
                                                && editingConfiguration?.configuredSecretFields.includes(field.key))}
                                        select={field.type === "SELECT"}
                                        type={field.type === "SECRET" ? "password" : "text"}
                                        value={values[field.key] || ""}
                                        onChange={(event) => setValues((current) => ({
                                            ...current,
                                            [field.key]: event.target.value,
                                        }))}
                                    >
                                        {field.type === "SELECT" ? field.options?.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        )) : undefined}
                                    </TextField>
                                );
                            })}
                            <label className="integration-enabled-control">
                                <span>
                                    <strong>{pl.integrations.fields.enabled}</strong>
                                    <small>{pl.integrations.dialog.enabledHint}</small>
                                </span>
                                <Switch checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
                            </label>
                        </div>
                    ) : undefined}
                </DialogContent>
                <DialogActions>
                    <Button disabled={saving || testing} type="button" onClick={close}>
                        {pl.common.cancel}
                    </Button>
                    <Button
                        disabled={saving || testing || !hasRequiredValues}
                        startIcon={<Cable />}
                        type="button"
                        variant="outlined"
                        onClick={testConnection}
                    >
                        {testing ? pl.integrations.actions.testing : pl.integrations.actions.testConnection}
                    </Button>
                    <Button disabled={saving || testing || !hasRequiredValues} type="submit" variant="contained">
                        {saving
                            ? pl.integrations.actions.saving
                            : (editingConfiguration
                                ? pl.integrations.actions.saveChanges
                                : pl.integrations.actions.add)}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default IntegrationConfigurationDialog;
