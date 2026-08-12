import React, {useEffect, useMemo, useState} from "react";
import {Add, EditOutlined, Hub, VpnKey} from "@mui/icons-material";
import {Alert, Button, Chip, CircularProgress, IconButton, Tooltip} from "@mui/material";
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
            <div className="integrations-configuration-heading">
                <div>
                    <h3>{pl.integrations.title}</h3>
                    <p>{pl.integrations.subtitle}</p>
                </div>
                <Button disabled={loading} startIcon={<Add />} variant="contained" onClick={openCreateDialog}>
                    {pl.integrations.actions.add}
                </Button>
            </div>

            {error && !dialogOpen ? <Alert severity="error">{error}</Alert> : undefined}
            {success ? <Alert severity="success">{success}</Alert> : undefined}

            {loading ? (
                <div className="integrations-configuration-loading">
                    <CircularProgress size={28} />
                    <span>{pl.integrations.loading}</span>
                </div>
            ) : configuredIntegrations.length ? (
                <div className="integration-provider-list">
                    <div className="integration-provider-list-header" aria-hidden="true">
                        <span>{pl.integrations.columns.status}</span>
                        <span>{pl.integrations.columns.integration}</span>
                        <span>{pl.integrations.columns.credentials}</span>
                        <span>{pl.common.actions}</span>
                    </div>
                    {configuredIntegrations.map((configuration) => (
                        <article className="integration-provider-card" key={configuration.provider}>
                            <Chip
                                color={configuration.enabled ? "success" : "default"}
                                label={configuration.enabled
                                    ? pl.integrations.status.enabled
                                    : pl.integrations.status.disabled}
                                size="small"
                                variant={configuration.enabled ? "filled" : "outlined"}
                            />
                            <div className="integration-provider-main">
                                <span className="integration-provider-icon" aria-hidden="true"><Hub /></span>
                                <span>
                                    <strong>{configuration.displayName}</strong>
                                    <small>{configuration.provider}</small>
                                </span>
                            </div>
                            <div className="integration-provider-credentials">
                                <VpnKey fontSize="small" />
                                <span>{configuration.configuredSecretFields.length
                                    ? pl.integrations.credentials.configured
                                    : pl.integrations.credentials.notRequired}</span>
                            </div>
                            <Tooltip title={pl.integrations.actions.edit}>
                                <IconButton
                                    aria-label={pl.integrations.actions.edit}
                                    size="small"
                                    onClick={() => openEditDialog(configuration)}
                                >
                                    <EditOutlined fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="integrations-configuration-empty">
                    <Hub />
                    <h4>{pl.integrations.emptyTitle}</h4>
                    <p>{pl.integrations.emptyDescription}</p>
                    <Button startIcon={<Add />} variant="outlined" onClick={openCreateDialog}>
                        {pl.integrations.actions.addFirst}
                    </Button>
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
