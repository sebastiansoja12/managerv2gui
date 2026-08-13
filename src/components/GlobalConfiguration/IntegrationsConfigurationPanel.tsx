import React, {useEffect, useMemo, useState} from "react";
import {
    Add,
    AccountTreeOutlined,
    ArchiveOutlined,
    AutoModeOutlined,
    DataObjectOutlined,
    DeleteOutline,
    EditOutlined,
    FactCheckOutlined,
    Hub,
    MonitorHeartOutlined,
    NotificationsActiveOutlined,
    ReportProblemOutlined,
    RouteOutlined,
    SecurityOutlined,
    SyncOutlined,
    TuneOutlined,
    VpnKey,
    WebhookOutlined,
} from "components/ui/icons";
import {
    Alert,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    FormControlLabel,
    Switch,
    TextField,
} from "components/ui";
import {getBackendErrorMessage} from "../../api/errorMessage";
import TrackingService from "../../hooks/TrackingService";
import pl from "../../i18n/translate";
import {
    TrackingIntegration,
    TrackingIntegrationDefinition,
    TrackingIntegrationRequest,
} from "./model/TrackingIntegration";
import {trackingIntegrationDefinitions} from "./model/TrackingIntegrationRegistry";
import IntegrationConfigurationDialog from "./IntegrationConfigurationDialog";

function IntegrationsConfigurationPanel() {
    const [configurations, setConfigurations] = useState<TrackingIntegration[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingConfiguration, setEditingConfiguration] = useState<TrackingIntegration | null>(null);
    const [selectedProvider, setSelectedProvider] = useState<string>("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        TrackingService.getIntegrations()
            .then((configurationResponse) => {
                setConfigurations(configurationResponse.data);
            })
            .catch((exception: unknown) => {
                setError(getBackendErrorMessage(exception, pl.integrations.messages.loadError));
            })
            .finally(() => setLoading(false));
    }, []);

    const configuredIntegrations = useMemo(
        () => configurations.filter((configuration) => configuration.configured),
        [configurations],
    );
    const selectedIntegration = useMemo(
        () => configuredIntegrations.find((configuration) => configuration.provider === selectedProvider)
            || configuredIntegrations[0]
            || null,
        [configuredIntegrations, selectedProvider],
    );

    useEffect(() => {
        if (!configuredIntegrations.length) {
            setSelectedProvider("");
            return;
        }

        if (!configuredIntegrations.some((configuration) => configuration.provider === selectedProvider)) {
            setSelectedProvider(configuredIntegrations[0].provider);
        }
    }, [configuredIntegrations, selectedProvider]);

    const openCreateDialog = () => {
        setEditingConfiguration(null);
        setError("");
        setSuccess("");
        setDialogOpen(true);
    };

    const openEditDialog = (configuration: TrackingIntegration) => {
        setEditingConfiguration(configuration);
        setError("");
        setSuccess("");
        setDialogOpen(true);
    };

    const deleteSelectedIntegration = () => {
        if (!selectedIntegration) {
            return;
        }

        setConfigurations((current) => current.filter((configuration) => (
            configuration.provider !== selectedIntegration.provider
        )));
        setError("");
        setSelectedProvider("");
        setSuccess(pl.integrations.messages.deleted);
    };

    const handleSaved = (
        definition: TrackingIntegrationDefinition,
        request: TrackingIntegrationRequest,
        configuredSecretFields: string[],
    ) => {
        const secretKeys = new Set(definition.fields
            .filter((field) => field.type === "SECRET")
            .map((field) => field.key));
        const savedConfiguration: TrackingIntegration = {
            provider: definition.provider,
            displayName: definition.displayName,
            configured: true,
            enabled: request.enabled,
            values: Object.fromEntries(Object.entries(request.values)
                .filter(([key, value]) => !secretKeys.has(key) && Boolean(value))),
            configuredSecretFields,
        };
        setConfigurations((current) => {
            const exists = current.some((configuration) => configuration.provider === definition.provider);
            return exists
                ? current.map((configuration) => configuration.provider === definition.provider
                    ? savedConfiguration
                    : configuration)
                : [...current, savedConfiguration];
        });
        setDialogOpen(false);
        setEditingConfiguration(null);
        setSuccess(pl.integrations.messages.saved);
    };

    return (
        <section className="global-configuration-section integrations-configuration-panel">
            {error && !dialogOpen ? <Alert severity="error">{error}</Alert> : undefined}
            {success ? <Alert severity="success">{success}</Alert> : undefined}

            {loading ? (
                <div className="integrations-configuration-loading">
                    <CircularProgress size={28} />
                    <span>{pl.integrations.loading}</span>
                </div>
            ) : (
                <div className="integrations-workspace">
                    <aside className="integration-left-rail">
                        <section className="integration-provider-panel">
                            <div className="integration-provider-panel-section integration-provider-info-section">
                                <div className="integration-provider-panel-heading">
                                    <div>
                                        <h4>{pl.integrations.providerPanel.title}</h4>
                                        <p>{pl.integrations.providerPanel.subtitle}</p>
                                    </div>
                                    <Chip
                                        label={`${configuredIntegrations.length}/${trackingIntegrationDefinitions.length}`}
                                        size="small"
                                        variant="outlined"
                                    />
                                </div>
                            </div>

                            <div className="integration-provider-panel-section integration-provider-list-section">
                                {configuredIntegrations.length ? (
                                    <div className="integration-provider-menu">
                                        {configuredIntegrations.map((configuration) => (
                                            <button
                                                className={`integration-provider-menu-item ${
                                                    selectedIntegration?.provider === configuration.provider
                                                        ? "integration-provider-menu-item-active"
                                                        : ""
                                                }`}
                                                key={configuration.provider}
                                                type="button"
                                                onClick={() => setSelectedProvider(configuration.provider)}
                                            >
                                                <span className="integration-provider-icon" aria-hidden="true"><Hub /></span>
                                                <span className="integration-provider-menu-copy">
                                                    <strong>{configuration.displayName}</strong>
                                                    <small>{configuration.provider}</small>
                                                </span>
                                                <span
                                                    className={`integration-provider-dot ${
                                                        configuration.enabled ? "integration-provider-dot-active" : ""
                                                    }`}
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="integrations-configuration-empty">
                                        <Hub />
                                        <h4>{pl.integrations.emptyTitle}</h4>
                                        <p>{pl.integrations.emptyDescription}</p>
                                    </div>
                                )}
                            </div>

                            <div className="integration-provider-panel-section integration-provider-status-section">
                                <div className="integration-status-panel">
                                    <div className="integration-status-copy">
                                        <span className="integration-status-icon" aria-hidden="true"><VpnKey /></span>
                                        <div>
                                            <h4>{selectedIntegration?.displayName || pl.integrations.emptyTitle}</h4>
                                            <p>{selectedIntegration
                                                ? (selectedIntegration.configuredSecretFields.length
                                                    ? pl.integrations.credentials.configured
                                                    : pl.integrations.credentials.notRequired)
                                                : pl.integrations.emptyDescription}</p>
                                        </div>
                                    </div>
                                    <Chip
                                        color={selectedIntegration?.enabled ? "success" : "default"}
                                        label={selectedIntegration?.enabled
                                            ? pl.integrations.status.enabled
                                            : pl.integrations.status.disabled}
                                        size="small"
                                        variant={selectedIntegration?.enabled ? "filled" : "outlined"}
                                    />
                                </div>
                            </div>

                            <div className="integration-provider-panel-section integration-provider-actions">
                                <Button
                                    disabled={loading}
                                    startIcon={<Add />}
                                    variant="contained"
                                    onClick={openCreateDialog}
                                >
                                    {pl.integrations.actions.add}
                                </Button>
                                <Button
                                    disabled={!selectedIntegration}
                                    startIcon={<EditOutlined />}
                                    variant="outlined"
                                    onClick={() => selectedIntegration && openEditDialog(selectedIntegration)}
                                >
                                    {pl.integrations.actions.edit}
                                </Button>
                                <Button
                                    color="error"
                                    disabled={!selectedIntegration}
                                    startIcon={<DeleteOutline />}
                                    variant="outlined"
                                    onClick={deleteSelectedIntegration}
                                >
                                    {pl.integrations.actions.delete}
                                </Button>
                            </div>
                        </section>
                    </aside>

                    <section className="integration-main-panel">
                        <section className="integration-option-group integration-option-group-wide">
                            <div className="integration-option-heading">
                                <SyncOutlined />
                                <div>
                                    <h5>{pl.integrations.options.sync.title}</h5>
                                    <p>{pl.integrations.options.sync.subtitle}</p>
                                </div>
                            </div>
                            <div className="integration-checkbox-grid">
                                <FormControlLabel
                                    control={<Checkbox defaultChecked size="small" />}
                                    label={pl.integrations.options.sync.autoImport}
                                />
                                <FormControlLabel
                                    control={<Checkbox defaultChecked size="small" />}
                                    label={pl.integrations.options.sync.statusRefresh}
                                />
                                <FormControlLabel
                                    control={<Checkbox size="small" />}
                                    label={pl.integrations.options.sync.weekendRuns}
                                />
                                <FormControlLabel
                                    control={<Checkbox defaultChecked size="small" />}
                                    label={pl.integrations.options.sync.errorRetry}
                                />
                            </div>
                        </section>

                        <section className="integration-option-group">
                            <div className="integration-option-heading">
                                <NotificationsActiveOutlined />
                                <div>
                                    <h5>{pl.integrations.options.notifications.title}</h5>
                                    <p>{pl.integrations.options.notifications.subtitle}</p>
                                </div>
                            </div>
                            <div className="integration-switch-list">
                                <div className="integration-switch-row">
                                    <span>{pl.integrations.options.notifications.failures}</span>
                                    <Switch defaultChecked size="small" />
                                </div>
                                <div className="integration-switch-row">
                                    <span>{pl.integrations.options.notifications.delays}</span>
                                    <Switch defaultChecked size="small" />
                                </div>
                                <div className="integration-switch-row">
                                    <span>{pl.integrations.options.notifications.dailyReport}</span>
                                    <Switch size="small" />
                                </div>
                            </div>
                        </section>

                        <section className="integration-option-group">
                            <div className="integration-option-heading">
                                <SecurityOutlined />
                                <div>
                                    <h5>{pl.integrations.options.security.title}</h5>
                                    <p>{pl.integrations.options.security.subtitle}</p>
                                </div>
                            </div>
                            <div className="integration-checkbox-stack">
                                <FormControlLabel control={<Checkbox defaultChecked size="small" />}
                                    label={pl.integrations.options.security.maskSecrets} />
                                <FormControlLabel control={<Checkbox defaultChecked size="small" />}
                                    label={pl.integrations.options.security.auditChanges} />
                                <FormControlLabel control={<Checkbox size="small" />}
                                    label={pl.integrations.options.security.ipAllowlist} />
                            </div>
                        </section>

                        <section className="integration-option-group">
                            <div className="integration-option-heading">
                                <FactCheckOutlined />
                                <div>
                                    <h5>{pl.integrations.options.validation.title}</h5>
                                    <p>{pl.integrations.options.validation.subtitle}</p>
                                </div>
                            </div>
                            <div className="integration-checkbox-stack">
                                <FormControlLabel control={<Checkbox defaultChecked size="small" />}
                                    label={pl.integrations.options.validation.requiredCredentials} />
                                <FormControlLabel control={<Checkbox defaultChecked size="small" />}
                                    label={pl.integrations.options.validation.providerHealth} />
                                <FormControlLabel control={<Checkbox size="small" />}
                                    label={pl.integrations.options.validation.strictMapping} />
                            </div>
                        </section>

                        <section className="integration-option-group">
                            <div className="integration-option-heading">
                                <DataObjectOutlined />
                                <div>
                                    <h5>{pl.integrations.options.dataScope.title}</h5>
                                    <p>{pl.integrations.options.dataScope.subtitle}</p>
                                </div>
                            </div>
                            <div className="integration-checkbox-stack">
                                <FormControlLabel control={<Checkbox defaultChecked size="small" />}
                                    label={pl.integrations.options.dataScope.trackingEvents} />
                                <FormControlLabel control={<Checkbox defaultChecked size="small" />}
                                    label={pl.integrations.options.dataScope.recipientDetails} />
                                <FormControlLabel control={<Checkbox size="small" />}
                                    label={pl.integrations.options.dataScope.returnUpdates} />
                            </div>
                        </section>

                        <section className="integration-option-group">
                            <div className="integration-option-heading">
                                <AutoModeOutlined />
                                <div>
                                    <h5>{pl.integrations.options.automation.title}</h5>
                                    <p>{pl.integrations.options.automation.subtitle}</p>
                                </div>
                            </div>
                            <div className="integration-checkbox-stack">
                                <FormControlLabel control={<Checkbox defaultChecked size="small" />}
                                    label={pl.integrations.options.automation.createAlerts} />
                                <FormControlLabel control={<Checkbox defaultChecked size="small" />}
                                    label={pl.integrations.options.automation.deduplicateEvents} />
                                <FormControlLabel control={<Checkbox size="small" />}
                                    label={pl.integrations.options.automation.closeResolved} />
                            </div>
                        </section>

                        <section className="integration-option-group">
                            <div className="integration-option-heading">
                                <ArchiveOutlined />
                                <div>
                                    <h5>{pl.integrations.options.retention.title}</h5>
                                    <p>{pl.integrations.options.retention.subtitle}</p>
                                </div>
                            </div>
                            <div className="integration-checkbox-stack">
                                <FormControlLabel control={<Checkbox defaultChecked size="small" />}
                                    label={pl.integrations.options.retention.savePayloads} />
                                <FormControlLabel control={<Checkbox defaultChecked size="small" />}
                                    label={pl.integrations.options.retention.exportLogs} />
                                <FormControlLabel control={<Checkbox size="small" />}
                                    label={pl.integrations.options.retention.anonymizeData} />
                            </div>
                        </section>

                        <section className="integration-option-group">
                            <div className="integration-option-heading">
                                <AccountTreeOutlined />
                                <div>
                                    <h5>{pl.integrations.options.mapping.title}</h5>
                                    <p>{pl.integrations.options.mapping.subtitle}</p>
                                </div>
                            </div>
                            <div className="integration-checkbox-stack">
                                <FormControlLabel control={<Checkbox defaultChecked size="small" />}
                                    label={pl.integrations.options.mapping.normalizeStatuses} />
                                <FormControlLabel control={<Checkbox defaultChecked size="small" />}
                                    label={pl.integrations.options.mapping.queueUnknown} />
                                <FormControlLabel control={<Checkbox size="small" />}
                                    label={pl.integrations.options.mapping.prioritizeExceptions} />
                            </div>
                        </section>

                        <section className="integration-option-group">
                            <div className="integration-option-heading">
                                <WebhookOutlined />
                                <div>
                                    <h5>{pl.integrations.options.webhooks.title}</h5>
                                    <p>{pl.integrations.options.webhooks.subtitle}</p>
                                </div>
                            </div>
                            <div className="integration-switch-list">
                                <div className="integration-switch-row">
                                    <span>{pl.integrations.options.webhooks.statusChanges}</span>
                                    <Switch defaultChecked size="small" />
                                </div>
                                <div className="integration-switch-row">
                                    <span>{pl.integrations.options.webhooks.deliveryFailures}</span>
                                    <Switch defaultChecked size="small" />
                                </div>
                                <div className="integration-switch-row">
                                    <span>{pl.integrations.options.webhooks.testEvents}</span>
                                    <Switch size="small" />
                                </div>
                            </div>
                        </section>

                        <section className="integration-option-group">
                            <div className="integration-option-heading">
                                <MonitorHeartOutlined />
                                <div>
                                    <h5>{pl.integrations.options.monitoring.title}</h5>
                                    <p>{pl.integrations.options.monitoring.subtitle}</p>
                                </div>
                            </div>
                            <div className="integration-checkbox-stack">
                                <FormControlLabel control={<Checkbox defaultChecked size="small" />}
                                    label={pl.integrations.options.monitoring.connectionHealth} />
                                <FormControlLabel control={<Checkbox defaultChecked size="small" />}
                                    label={pl.integrations.options.monitoring.responseTime} />
                                <FormControlLabel control={<Checkbox size="small" />}
                                    label={pl.integrations.options.monitoring.dailySummary} />
                            </div>
                        </section>

                        <section className="integration-option-group">
                            <div className="integration-option-heading">
                                <ReportProblemOutlined />
                                <div>
                                    <h5>{pl.integrations.options.exceptions.title}</h5>
                                    <p>{pl.integrations.options.exceptions.subtitle}</p>
                                </div>
                            </div>
                            <div className="integration-checkbox-stack">
                                <FormControlLabel control={<Checkbox defaultChecked size="small" />}
                                    label={pl.integrations.options.exceptions.openCase} />
                                <FormControlLabel control={<Checkbox defaultChecked size="small" />}
                                    label={pl.integrations.options.exceptions.keepLastStatus} />
                                <FormControlLabel control={<Checkbox size="small" />}
                                    label={pl.integrations.options.exceptions.blockProcessing} />
                            </div>
                        </section>

                        <section className="integration-option-group">
                            <div className="integration-option-heading">
                                <RouteOutlined />
                                <div>
                                    <h5>{pl.integrations.options.routing.title}</h5>
                                    <p>{pl.integrations.options.routing.subtitle}</p>
                                </div>
                            </div>
                            <div className="integration-checkbox-stack">
                                <FormControlLabel control={<Checkbox defaultChecked size="small" />}
                                    label={pl.integrations.options.routing.preferBackground} />
                                <FormControlLabel control={<Checkbox defaultChecked size="small" />}
                                    label={pl.integrations.options.routing.useFallback} />
                                <FormControlLabel control={<Checkbox size="small" />}
                                    label={pl.integrations.options.routing.processPriority} />
                            </div>
                        </section>

                        <section className="integration-option-group integration-option-group-wide">
                            <div className="integration-option-heading">
                                <TuneOutlined />
                                <div>
                                    <h5>{pl.integrations.options.parameters.title}</h5>
                                    <p>{pl.integrations.options.parameters.subtitle}</p>
                                </div>
                            </div>
                            <div className="integration-field-grid">
                                <TextField defaultValue="15" label={pl.integrations.options.parameters.interval}
                                    size="small" type="number" />
                                <TextField defaultValue="3" label={pl.integrations.options.parameters.retries}
                                    size="small" type="number" />
                                <TextField defaultValue="250" label={pl.integrations.options.parameters.batchSize}
                                    size="small" type="number" />
                                <TextField defaultValue="30" label={pl.integrations.options.parameters.timeout}
                                    size="small" type="number" />
                            </div>
                        </section>
                    </section>
                </div>
            )}

            <IntegrationConfigurationDialog
                configurations={configurations}
                definitions={trackingIntegrationDefinitions}
                editingConfiguration={editingConfiguration}
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSaved={handleSaved}
            />
        </section>
    );
}

export default IntegrationsConfigurationPanel;
