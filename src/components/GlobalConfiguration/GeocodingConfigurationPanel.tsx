import React, {useEffect, useMemo, useState} from "react";
import {
    Alert,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
    Tooltip,
} from "components/ui";
import {Add, CheckCircleOutline, DeleteOutline, EditOutlined, LocationOn, VpnKey} from "components/ui/icons";
import {getBackendErrorMessage} from "../../api/errorMessage";
import GeocodingConfigurationService from "../../hooks/GeocodingConfigurationService";
import pl from "../../i18n/translate";
import {
    GeocodingConfiguration,
    GeocodingConfigurationField,
    GeocodingConfigurationRequest,
    GeocodingProvider,
    GeocodingProviderApi,
    GeocodingProviderDefinition,
} from "./model/GeocodingConfiguration";

type FieldValues = Partial<Record<GeocodingConfigurationField, string>>;

const providerLabels: Record<string, string> = {
    GEOAPIFY: pl.globalConfiguration.geocoding.providers.geoapify,
    POSITION_STACK: pl.globalConfiguration.geocoding.providers.positionStack,
};

const getProviderLabel = (provider: GeocodingProvider) => providerLabels[provider]
    || provider.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");

const fieldLabels: Record<GeocodingConfigurationField, string> = {
    API_USER_NAME: pl.globalConfiguration.geocoding.fields.apiUserName,
    API_PASSWORD: pl.globalConfiguration.geocoding.fields.apiPassword,
    API_KEY: pl.globalConfiguration.geocoding.fields.apiKey,
    CLIENT_NUMBER: pl.globalConfiguration.geocoding.fields.clientNumber,
    ACCESS_TOKEN: pl.globalConfiguration.geocoding.fields.accessToken,
    REFRESH_TOKEN: pl.globalConfiguration.geocoding.fields.refreshToken,
};

const providerApiLabels: Record<GeocodingProviderApi, string> = {
    GEOCODING_API: pl.globalConfiguration.geocoding.providerApis.geocodingApi,
};

const getProviderApiLabels = (providerApis: GeocodingProviderApi[]) => providerApis
    .map((providerApi) => providerApiLabels[providerApi] || providerApi)
    .join(", ");

const sensitiveFields = new Set<GeocodingConfigurationField>([
    "API_PASSWORD",
    "API_KEY",
    "ACCESS_TOKEN",
    "REFRESH_TOKEN",
]);

const buildRequest = (
    definition: GeocodingProviderDefinition,
    values: FieldValues,
    enabled: boolean,
    defaultProvider: boolean,
): GeocodingConfigurationRequest => {
    const request: GeocodingConfigurationRequest = {
        apiUserName: null,
        apiPassword: null,
        apiKey: null,
        clientNumber: null,
        accessToken: null,
        refreshToken: null,
        enabled,
        defaultProvider,
        provider: definition.provider,
    };

    definition.activeFields.forEach((field) => {
        const value = values[field]?.trim() || null;
        if (field === "API_USER_NAME") request.apiUserName = value;
        if (field === "API_PASSWORD") request.apiPassword = value;
        if (field === "API_KEY") request.apiKey = value;
        if (field === "CLIENT_NUMBER") request.clientNumber = value;
        if (field === "ACCESS_TOKEN") request.accessToken = value;
        if (field === "REFRESH_TOKEN") request.refreshToken = value;
    });

    return request;
};

const getFieldValues = (
    configuration: GeocodingConfiguration,
    definition: GeocodingProviderDefinition,
) => {
    const values: FieldValues = {};
    definition.activeFields.forEach((field) => {
        if (field === "API_USER_NAME") values[field] = configuration.apiUserName || "";
        if (field === "API_PASSWORD") values[field] = configuration.apiPassword || "";
        if (field === "API_KEY") values[field] = configuration.apiKey || "";
        if (field === "CLIENT_NUMBER") values[field] = configuration.clientNumber || "";
        if (field === "ACCESS_TOKEN") values[field] = configuration.accessToken || "";
        if (field === "REFRESH_TOKEN") values[field] = configuration.refreshToken || "";
    });
    return values;
};

const buildRequestFromConfiguration = (
    configuration: GeocodingConfiguration,
    enabled: boolean,
    defaultProvider: boolean,
): GeocodingConfigurationRequest => ({
    apiUserName: configuration.apiUserName,
    apiPassword: configuration.apiPassword,
    apiKey: configuration.apiKey,
    clientNumber: configuration.clientNumber,
    accessToken: configuration.accessToken,
    refreshToken: configuration.refreshToken,
    enabled,
    defaultProvider,
    provider: configuration.provider,
});

function GeocodingConfigurationPanel() {
    const [configurations, setConfigurations] = useState<GeocodingConfiguration[]>([]);
    const [providers, setProviders] = useState<GeocodingProviderDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [defaultProviderConfigurationId, setDefaultProviderConfigurationId] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingConfiguration, setEditingConfiguration] = useState<GeocodingConfiguration | null>(null);
    const [configurationToDelete, setConfigurationToDelete] = useState<GeocodingConfiguration | null>(null);
    const [selectedProvider, setSelectedProvider] = useState<GeocodingProvider | "">("");
    const [fieldValues, setFieldValues] = useState<FieldValues>({});
    const [enabled, setEnabled] = useState(true);
    const [defaultProvider, setDefaultProvider] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        Promise.all([
            GeocodingConfigurationService.getAll(),
            GeocodingConfigurationService.getProviders(),
        ])
            .then(([configurationResponse, providerResponse]) => {
                setConfigurations(configurationResponse.data);
                setProviders(providerResponse.data);
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.globalConfiguration.geocoding.messages.loadError));
            })
            .finally(() => setLoading(false));
    }, []);

    const configuredProviders = useMemo(
        () => new Set(configurations.map((configuration) => configuration.provider)),
        [configurations],
    );

    const availableProviders = useMemo(
        () => providers.filter((provider) => !configuredProviders.has(provider.provider)),
        [configuredProviders, providers],
    );

    const selectedDefinition = providers.find((provider) => provider.provider === selectedProvider);

    const getDefinition = (provider: GeocodingProvider) => providers.find((definition) => definition.provider === provider);

    const hasEnabledDefaultProvider = (nextConfigurations: GeocodingConfiguration[]) => (
        nextConfigurations.some((configuration) => configuration.enabled && configuration.defaultProvider)
    );

    const getConfigurationsAfterSave = (request: GeocodingConfigurationRequest) => {
        if (editingConfiguration) {
            return configurations.map((configuration) => {
                if (configuration.geocodingConfigurationId.value === editingConfiguration.geocodingConfigurationId.value) {
                    return {...configuration, ...request, apiUrl: selectedDefinition?.url || configuration.apiUrl};
                }

                return request.defaultProvider ? {...configuration, defaultProvider: false} : configuration;
            });
        }

        return [
            ...configurations.map((configuration) => (
                request.defaultProvider ? {...configuration, defaultProvider: false} : configuration
            )),
            {
                ...request,
                apiUrl: selectedDefinition?.url || null,
                geocodingConfigurationId: {value: "pending"},
            },
        ];
    };

    const openCreateDialog = () => {
        const firstAvailableProvider = availableProviders[0];
        setEditingConfiguration(null);
        setSelectedProvider(firstAvailableProvider?.provider || "");
        setFieldValues({});
        setEnabled(true);
        setDefaultProvider(!configurations.some((configuration) => configuration.defaultProvider));
        setError("");
        setSuccess("");
        setDialogOpen(true);
    };

    const openEditDialog = (configuration: GeocodingConfiguration) => {
        const definition = providers.find((provider) => provider.provider === configuration.provider);
        if (!definition) {
            return;
        }

        setEditingConfiguration(configuration);
        setSelectedProvider(configuration.provider);
        setFieldValues(getFieldValues(configuration, definition));
        setEnabled(configuration.enabled);
        setDefaultProvider(configuration.defaultProvider);
        setError("");
        setSuccess("");
        setDialogOpen(true);
    };

    const closeDialog = () => {
        if (!saving) {
            setDialogOpen(false);
        }
    };

    const saveConfiguration = async () => {
        if (!selectedDefinition) {
            return;
        }

        setSaving(true);
        setError("");
        const request = buildRequest(selectedDefinition, fieldValues, enabled, defaultProvider);
        const nextConfigurations = getConfigurationsAfterSave(request);
        if (!hasEnabledDefaultProvider(nextConfigurations)) {
            setError(pl.globalConfiguration.geocoding.messages.defaultProviderRequired);
            setSaving(false);
            return;
        }

        try {
            if (editingConfiguration) {
                await GeocodingConfigurationService.update(
                    editingConfiguration.geocodingConfigurationId.value,
                    request,
                );
                setConfigurations((currentConfigurations) => currentConfigurations.map((configuration) => (
                    configuration.geocodingConfigurationId.value
                    === editingConfiguration.geocodingConfigurationId.value
                        ? {...configuration, ...request, apiUrl: selectedDefinition.url}
                        : (request.defaultProvider ? {...configuration, defaultProvider: false} : configuration)
                )));
                setSuccess(pl.globalConfiguration.geocoding.messages.updateSuccess);
            } else {
                await GeocodingConfigurationService.create(request);
                const response = await GeocodingConfigurationService.getAll();
                setConfigurations(response.data);
                setSuccess(pl.globalConfiguration.geocoding.messages.createSuccess);
            }
            setDialogOpen(false);
        } catch (exception: unknown) {
            setError(getBackendErrorMessage(
                exception,
                editingConfiguration
                    ? pl.globalConfiguration.geocoding.messages.updateError
                    : pl.globalConfiguration.geocoding.messages.createError,
            ));
        } finally {
            setSaving(false);
        }
    };

    const setConfigurationAsDefault = async (configuration: GeocodingConfiguration) => {
        const request = buildRequestFromConfiguration(configuration, true, true);

        setDefaultProviderConfigurationId(configuration.geocodingConfigurationId.value);
        setError("");
        setSuccess("");
        try {
            await GeocodingConfigurationService.update(
                configuration.geocodingConfigurationId.value,
                request,
            );
            setConfigurations((currentConfigurations) => currentConfigurations.map((currentConfiguration) => (
                currentConfiguration.geocodingConfigurationId.value === configuration.geocodingConfigurationId.value
                    ? {...currentConfiguration, enabled: true, defaultProvider: true}
                    : {...currentConfiguration, defaultProvider: false}
            )));
            setSuccess(pl.globalConfiguration.geocoding.messages.defaultProviderSuccess);
        } catch (exception: unknown) {
            setError(getBackendErrorMessage(exception, pl.globalConfiguration.geocoding.messages.defaultProviderError));
        } finally {
            setDefaultProviderConfigurationId("");
        }
    };

    const deleteConfiguration = async () => {
        if (!configurationToDelete) {
            return;
        }

        const nextConfigurations = configurations.filter((configuration) => (
            configuration.geocodingConfigurationId.value !== configurationToDelete.geocodingConfigurationId.value
        ));
        if (nextConfigurations.length && !hasEnabledDefaultProvider(nextConfigurations)) {
            setError(pl.globalConfiguration.geocoding.messages.defaultProviderRequiredBeforeDelete);
            return;
        }

        setDeleting(true);
        setError("");
        try {
            await GeocodingConfigurationService.remove(configurationToDelete.geocodingConfigurationId.value);
            setConfigurations((currentConfigurations) => currentConfigurations.filter((configuration) => (
                configuration.geocodingConfigurationId.value
                !== configurationToDelete.geocodingConfigurationId.value
            )));
            setConfigurationToDelete(null);
            setSuccess(pl.globalConfiguration.geocoding.messages.deleteSuccess);
        } catch (exception: unknown) {
            setError(getBackendErrorMessage(exception, pl.globalConfiguration.geocoding.messages.deleteError));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <section className="global-configuration-section geocoding-configuration-panel">
            <div className="geocoding-configuration-heading">
                <div>
                    <h3>{pl.globalConfiguration.geocoding.title}</h3>
                    <p>{pl.globalConfiguration.geocoding.description}</p>
                </div>
                {!loading && configurations.length ? (
                    <Button
                        disabled={!availableProviders.length}
                        startIcon={<Add />}
                        variant="outlined"
                        onClick={openCreateDialog}
                    >
                        {pl.globalConfiguration.geocoding.add}
                    </Button>
                ) : undefined}
            </div>

            {error && !dialogOpen && !configurationToDelete ? <Alert severity="error">{error}</Alert> : undefined}
            {success ? <Alert severity="success">{success}</Alert> : undefined}

            {loading ? (
                <div className="geocoding-configuration-loading">
                    <CircularProgress size={28} />
                    <span>{pl.globalConfiguration.geocoding.loading}</span>
                </div>
            ) : configurations.length ? (
                <div className="geocoding-provider-list">
                    <div className="geocoding-provider-list-header" aria-hidden="true">
                        <span>{pl.globalConfiguration.geocoding.columns.integration}</span>
                        <span>{pl.globalConfiguration.geocoding.columns.provider}</span>
                        <span>{pl.globalConfiguration.geocoding.columns.apiAddress}</span>
                        <span>{pl.common.actions}</span>
                    </div>
                    {configurations.map((configuration) => {
                        const definition = getDefinition(configuration.provider);
                        return (
                            <article
                                className="geocoding-provider-card"
                                key={configuration.geocodingConfigurationId.value}
                            >
                                <div className="geocoding-provider-status">
                                    <Chip
                                        color={configuration.enabled ? "success" : "default"}
                                        label={configuration.enabled
                                            ? pl.globalConfiguration.geocoding.status.enabled
                                            : pl.globalConfiguration.geocoding.status.disabled}
                                        size="small"
                                        variant={configuration.enabled ? "filled" : "outlined"}
                                    />
                                    {configuration.defaultProvider ? (
                                        <Chip
                                            color="primary"
                                            label={pl.globalConfiguration.geocoding.status.defaultProvider}
                                            size="small"
                                            variant="outlined"
                                        />
                                    ) : undefined}
                                </div>
                            <div className="geocoding-provider-main">
                                <div className="geocoding-provider-icon" aria-hidden="true">
                                    <LocationOn />
                                </div>
                                <div>
                                    <h4>{getProviderLabel(configuration.provider)}</h4>
                                    <span className="geocoding-provider-code">{configuration.provider}</span>
                                    {definition?.providerApis?.length ? (
                                        <span className="geocoding-provider-api">
                                            {getProviderApiLabels(definition.providerApis)}
                                        </span>
                                    ) : undefined}
                                </div>
                            </div>
                            <div className="geocoding-provider-endpoint">
                                <a href={configuration.apiUrl || undefined} rel="noreferrer" target="_blank">
                                    {configuration.apiUrl}
                                </a>
                                <span className="geocoding-provider-credential">
                                    <VpnKey fontSize="small" />
                                    {configuration.apiKey
                                        ? pl.globalConfiguration.geocoding.apiKeyConfigured
                                        : pl.globalConfiguration.geocoding.apiKeyMissing}
                                </span>
                            </div>
                            <div className="geocoding-provider-actions">
                                <Tooltip title={configuration.defaultProvider
                                    ? pl.globalConfiguration.geocoding.defaultAlreadySelected
                                    : pl.globalConfiguration.geocoding.setDefault}
                                >
                                    <IconButton
                                        aria-label={configuration.defaultProvider
                                            ? pl.globalConfiguration.geocoding.defaultAlreadySelected
                                            : pl.globalConfiguration.geocoding.setDefault}
                                        color={configuration.defaultProvider ? "primary" : undefined}
                                        disabled={configuration.defaultProvider
                                            || Boolean(defaultProviderConfigurationId)
                                            || deleting
                                            || saving}
                                        size="small"
                                        onClick={() => setConfigurationAsDefault(configuration)}
                                    >
                                        {defaultProviderConfigurationId === configuration.geocodingConfigurationId.value
                                            ? <CircularProgress size={16} />
                                            : <CheckCircleOutline fontSize="small" />}
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={pl.globalConfiguration.geocoding.edit}>
                                    <IconButton
                                        aria-label={pl.globalConfiguration.geocoding.edit}
                                        size="small"
                                        onClick={() => openEditDialog(configuration)}
                                    >
                                        <EditOutlined fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={pl.globalConfiguration.geocoding.delete}>
                                    <IconButton
                                        aria-label={pl.globalConfiguration.geocoding.delete}
                                        color="error"
                                        size="small"
                                        onClick={() => {
                                            setError("");
                                            setSuccess("");
                                            setConfigurationToDelete(configuration);
                                        }}
                                    >
                                        <DeleteOutline fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </div>
                        </article>
                        );
                    })}
                </div>
            ) : (
                <div className="geocoding-configuration-empty">
                    <LocationOn />
                    <h4>{pl.globalConfiguration.geocoding.emptyTitle}</h4>
                    <p>{pl.globalConfiguration.geocoding.emptyDescription}</p>
                    <Button disabled={loading || !availableProviders.length} startIcon={<Add />} variant="outlined" onClick={openCreateDialog}>
                        {pl.globalConfiguration.geocoding.addFirst}
                    </Button>
                </div>
            )}

            <Dialog
                className="geocoding-configuration-dialog"
                fullWidth
                maxWidth="sm"
                open={dialogOpen}
                onClose={closeDialog}
            >
                <DialogTitle>{editingConfiguration
                    ? pl.globalConfiguration.geocoding.dialog.editTitle
                    : pl.globalConfiguration.geocoding.dialog.title}</DialogTitle>
                <DialogContent>
                    <p className="geocoding-dialog-description">
                        {editingConfiguration
                            ? pl.globalConfiguration.geocoding.dialog.editDescription
                            : pl.globalConfiguration.geocoding.dialog.description}
                    </p>
                    {error ? <Alert severity="error">{error}</Alert> : undefined}
                    {!editingConfiguration && !availableProviders.length ? (
                        <Alert severity="info">{pl.globalConfiguration.geocoding.dialog.noAvailableProviders}</Alert>
                    ) : undefined}
                    <FormControl fullWidth margin="normal">
                            <InputLabel id="geocoding-provider-label">
                                {pl.globalConfiguration.geocoding.dialog.providerLabel}
                            </InputLabel>
                            <Select
                                disabled={Boolean(editingConfiguration)}
                                fullWidth
                                label={pl.globalConfiguration.geocoding.dialog.providerLabel}
                                labelId="geocoding-provider-label"
                                value={selectedProvider}
                                onChange={(event) => {
                                    setSelectedProvider(event.target.value as GeocodingProvider);
                                    setFieldValues({});
                                }}
                            >
                                {providers.map((provider) => (
                                    <MenuItem
                                        disabled={!editingConfiguration && configuredProviders.has(provider.provider)}
                                        key={provider.provider}
                                        value={provider.provider}
                                    >
                                        {getProviderLabel(provider.provider)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                    {selectedDefinition ? (
                        <div className="geocoding-dialog-fields">
                            <TextField
                                fullWidth
                                label={pl.globalConfiguration.geocoding.dialog.urlLabel}
                                value={selectedDefinition.url}
                                InputProps={{readOnly: true}}
                            />
                            {selectedDefinition.activeFields.map((field) => (
                                <TextField
                                    autoComplete="new-password"
                                    fullWidth
                                    key={field}
                                    label={fieldLabels[field]}
                                    required
                                    type={sensitiveFields.has(field) ? "password" : "text"}
                                    value={fieldValues[field] || ""}
                                    onChange={(event) => setFieldValues((currentValues) => ({
                                        ...currentValues,
                                        [field]: event.target.value,
                                    }))}
                                />
                            ))}
                            <label className="geocoding-enabled-control">
                                <span>
                                    <strong>{pl.globalConfiguration.geocoding.dialog.enabledLabel}</strong>
                                    <small>{pl.globalConfiguration.geocoding.dialog.enabledHint}</small>
                                </span>
                                <Switch
                                    checked={enabled}
                                    onChange={(event) => {
                                        setEnabled(event.target.checked);
                                        if (!event.target.checked) {
                                            setDefaultProvider(false);
                                        }
                                    }}
                                />
                            </label>
                            <label className="geocoding-enabled-control">
                                <span>
                                    <strong>{pl.globalConfiguration.geocoding.dialog.defaultLabel}</strong>
                                    <small>{pl.globalConfiguration.geocoding.dialog.defaultHint}</small>
                                </span>
                                <Switch
                                    checked={defaultProvider}
                                    disabled={!enabled}
                                    onChange={(event) => {
                                        setDefaultProvider(event.target.checked);
                                        if (event.target.checked) {
                                            setEnabled(true);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    ) : undefined}
                </DialogContent>
                <DialogActions>
                    <Button disabled={saving} variant="outlined" onClick={closeDialog}>
                        {pl.common.cancel}
                    </Button>
                    <Button
                        className="geocoding-dialog-primary-action"
                        disabled={saving || !selectedDefinition
                            || selectedDefinition.activeFields.some((field) => !fieldValues[field]?.trim())}
                        variant="outlined"
                        onClick={saveConfiguration}
                    >
                        {saving
                            ? (editingConfiguration
                                ? pl.globalConfiguration.geocoding.dialog.updating
                                : pl.globalConfiguration.geocoding.dialog.saving)
                            : (editingConfiguration
                                ? pl.globalConfiguration.geocoding.dialog.update
                                : pl.globalConfiguration.geocoding.dialog.save)}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                className="geocoding-configuration-dialog"
                fullWidth
                maxWidth="xs"
                open={Boolean(configurationToDelete)}
                onClose={() => !deleting && setConfigurationToDelete(null)}
            >
                <DialogTitle>{pl.globalConfiguration.geocoding.deleteDialog.title}</DialogTitle>
                <DialogContent>
                    {error ? <Alert severity="error">{error}</Alert> : undefined}
                    <p className="geocoding-dialog-description">
                        {pl.globalConfiguration.geocoding.deleteDialog.description}
                    </p>
                    {configurationToDelete ? (
                        <strong>{getProviderLabel(configurationToDelete.provider)}</strong>
                    ) : undefined}
                </DialogContent>
                <DialogActions>
                    <Button disabled={deleting} variant="outlined" onClick={() => setConfigurationToDelete(null)}>
                        {pl.common.cancel}
                    </Button>
                    <Button color="error" disabled={deleting} variant="contained" onClick={deleteConfiguration}>
                        {deleting
                            ? pl.globalConfiguration.geocoding.deleteDialog.deleting
                            : pl.globalConfiguration.geocoding.deleteDialog.confirm}
                    </Button>
                </DialogActions>
            </Dialog>
        </section>
    );
}

export default GeocodingConfigurationPanel;
