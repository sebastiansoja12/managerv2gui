import React, {useCallback, useEffect, useMemo, useState} from "react";
import {
    Alert,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel,
    IconButton,
    MenuItem,
    Switch,
    TextField,
} from "components/ui";
import {Close, History, Refresh, Save, Shield, Undo} from "components/ui/icons";
import CourierConfigurationService from "../../hooks/CourierConfigurationService";
import pl from "../../i18n/translate";
import {
    applyCourierSettingRules,
    courierErrorMessage,
    courierLabelFormats,
    CourierConfigurationDraft,
    CourierConfigurationFieldErrors,
    courierSettingGroups,
    courierShipmentSortOrders,
    isCourierConfigurationConflict,
    isProofOfDeliveryForced,
    settingsInGroup,
    toCourierConfigurationDraft,
    toCourierConfigurationFieldErrors,
    toCourierConfigurationUpdateRequest,
    validateCourierConfigurationDraft,
} from "./courierConfigurationModel";
import {
    CourierConfigurationDto,
    CourierConfigurationParameter,
    CourierConfigurationRevisionDto,
    CourierLabelFormat,
    CourierSetting,
    CourierSettingDefinitionDto,
    CourierSettingGroup,
    CourierShipmentSortOrder,
    SubstituteCourierDto,
} from "./dto/CourierConfigurationDto";

type CourierConfigurationTab = CourierSettingGroup | "SUBSTITUTE" | "HISTORY";

type CourierConfigurationDialogProps = {
    open: boolean;
    supplierCode?: string;
    variant?: "dialog" | "page";
    courierName?: string;
    onClose: () => void;
};

const configurationTabs: CourierConfigurationTab[] = [...courierSettingGroups, "SUBSTITUTE", "HISTORY"];

const courierDisplayName = (firstName?: string | null, lastName?: string | null) => (
    `${firstName || ""} ${lastName || ""}`.trim()
);

function CourierConfigurationDialog({
    open,
    supplierCode,
    courierName,
    variant = "dialog",
    onClose,
}: CourierConfigurationDialogProps) {
    const configurationTarget = supplierCode ?? null;
    const translation = pl.globalConfiguration.courierConfiguration;
    const [configuration, setConfiguration] = useState<CourierConfigurationDto | null>(null);
    const [draft, setDraft] = useState<CourierConfigurationDraft | null>(null);
    const [substituteCandidates, setSubstituteCandidates] = useState<SubstituteCourierDto[]>([]);
    const [history, setHistory] = useState<CourierConfigurationRevisionDto[]>([]);
    const [activeTab, setActiveTab] = useState<CourierConfigurationTab>("SHIPMENTS");
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [saveError, setSaveError] = useState("");
    const [historyError, setHistoryError] = useState("");
    const [conflict, setConflict] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<CourierConfigurationFieldErrors>({});
    const [successMessage, setSuccessMessage] = useState("");
    const [resetConfirmationOpen, setResetConfirmationOpen] = useState(false);

    const applyConfiguration = (loadedConfiguration: CourierConfigurationDto) => {
        setConfiguration(loadedConfiguration);
        setDraft(toCourierConfigurationDraft(loadedConfiguration));
        setFieldErrors({});
    };

    const loadConfiguration = useCallback(() => {
        setLoading(true);
        setLoadError("");
        setSaveError("");
        setConflict(false);
        setHistory([]);
        Promise.all([
            CourierConfigurationService.get(configurationTarget),
            CourierConfigurationService.getSubstituteCandidates(configurationTarget),
        ])
            .then(([configurationResponse, candidatesResponse]) => {
                applyConfiguration(configurationResponse.data);
                setSubstituteCandidates(candidatesResponse.data);
            })
            .catch((exception: unknown) => {
                setConfiguration(null);
                setDraft(null);
                setLoadError(courierErrorMessage(exception, translation.messages.loadError));
            })
            .finally(() => setLoading(false));
    }, [configurationTarget, translation]);

    const loadHistory = useCallback(() => {
        setHistoryLoading(true);
        setHistoryError("");
        CourierConfigurationService.getHistory(configurationTarget)
            .then((response) => setHistory(response.data))
            .catch((exception: unknown) => {
                setHistoryError(courierErrorMessage(exception, translation.messages.historyLoadError));
            })
            .finally(() => setHistoryLoading(false));
    }, [configurationTarget, translation]);

    useEffect(() => {
        if (open) {
            setActiveTab("SHIPMENTS");
            setSuccessMessage("");
            loadConfiguration();
        }
    }, [open, loadConfiguration]);

    useEffect(() => {
        if (open && activeTab === "HISTORY") {
            loadHistory();
        }
    }, [open, activeTab, loadHistory]);

    const dirty = useMemo(() => (
        Boolean(configuration && draft)
        && JSON.stringify(draft) !== JSON.stringify(toCourierConfigurationDraft(configuration as CourierConfigurationDto))
    ), [configuration, draft]);

    const enforcedValue = (setting: CourierSetting): boolean | undefined => configuration?.enforcedSettings[setting];

    const updateDraft = (changeDraft: (currentDraft: CourierConfigurationDraft) => CourierConfigurationDraft) => {
        setDraft((currentDraft) => (currentDraft ? changeDraft(currentDraft) : currentDraft));
        setSuccessMessage("");
        setSaveError("");
    };

    const toggleSetting = (setting: CourierSetting, enabled: boolean) => {
        if (enforcedValue(setting) !== undefined) {
            return;
        }
        updateDraft((currentDraft) => ({
            ...currentDraft,
            settings: applyCourierSettingRules({...currentDraft.settings, [setting]: enabled}),
        }));
        setFieldErrors((currentErrors) => ({...currentErrors, [setting]: undefined}));
    };

    const updateParameter = <Field extends keyof Omit<CourierConfigurationDraft, "settings">>(
        field: Field,
        parameter: CourierConfigurationParameter,
        value: CourierConfigurationDraft[Field],
    ) => {
        updateDraft((currentDraft) => ({...currentDraft, [field]: value}));
        setFieldErrors((currentErrors) => ({...currentErrors, [parameter]: undefined}));
    };

    const handleSaveError = (exception: unknown, fallback: string) => {
        if (isCourierConfigurationConflict(exception)) {
            setConflict(true);
            return;
        }
        const backendFieldErrors = toCourierConfigurationFieldErrors(exception);
        if (Object.keys(backendFieldErrors).length) {
            setFieldErrors(backendFieldErrors);
            setSaveError(translation.messages.validationError);
            return;
        }
        setSaveError(courierErrorMessage(exception, fallback));
    };

    const saveConfiguration = () => {
        if (!configuration || !draft) {
            return;
        }
        const validationErrors = validateCourierConfigurationDraft(draft);
        if (Object.keys(validationErrors).length) {
            setFieldErrors(validationErrors);
            setSaveError(translation.messages.validationError);
            return;
        }
        setSaving(true);
        setSaveError("");
        CourierConfigurationService.update(configurationTarget, toCourierConfigurationUpdateRequest(draft, configuration.version))
            .then((response) => {
                applyConfiguration(response.data);
                setSuccessMessage(translation.messages.saved);
                if (activeTab === "HISTORY") {
                    loadHistory();
                }
            })
            .catch((exception: unknown) => handleSaveError(exception, translation.messages.saveError))
            .finally(() => setSaving(false));
    };

    const resetToDefaults = () => {
        if (!configuration) {
            return;
        }
        setResetConfirmationOpen(false);
        setSaving(true);
        setSaveError("");
        CourierConfigurationService.resetToDefaults(configurationTarget, {version: configuration.version})
            .then((response) => {
                applyConfiguration(response.data);
                setSuccessMessage(translation.messages.reset);
                if (activeTab === "HISTORY") {
                    loadHistory();
                }
            })
            .catch((exception: unknown) => handleSaveError(exception, translation.messages.saveError))
            .finally(() => setSaving(false));
    };

    const cancel = () => {
        if (configuration) {
            setDraft(toCourierConfigurationDraft(configuration));
        }
        setFieldErrors({});
        setSaveError("");
        if (variant === "dialog") {
            onClose();
        }
    };

    const fieldErrorMessage = (field: CourierSetting | CourierConfigurationParameter) => {
        const code = fieldErrors[field];
        return code ? translation.validation[code] : undefined;
    };

    const renderSetting = (definition: CourierSettingDefinitionDto) => {
        if (!draft) {
            return undefined;
        }
        const setting = definition.setting;
        const enabled = draft.settings[setting];
        const lockedByPolicy = enforcedValue(setting) !== undefined;
        const forcedByProofRule = setting === "REQUIRE_PROOF_OF_DELIVERY" && isProofOfDeliveryForced(draft.settings);
        const label = translation.settings[setting].label;
        const description = translation.settings[setting].description;
        const errorMessage = fieldErrorMessage(setting);
        return (
            <div className="courier-setting-row" data-locked={lockedByPolicy} key={setting}>
                <div className="courier-setting-copy">
                    <div className="courier-setting-title">
                        <strong>{label}</strong>
                        <span className="courier-setting-category" data-category={definition.category}>
                            {translation.categories[definition.category]}
                        </span>
                    </div>
                    {description ? <small>{description}</small> : undefined}
                    {lockedByPolicy ? (
                        <small className="courier-setting-note">
                            <Shield fontSize="small" aria-hidden="true" />
                            <span>{translation.lockedByPolicy}</span>
                        </small>
                    ) : undefined}
                    {!lockedByPolicy && forcedByProofRule ? (
                        <small className="courier-setting-note">{translation.forcedByProofRule}</small>
                    ) : undefined}
                    {errorMessage ? <small className="courier-setting-error" role="alert">{errorMessage}</small> : undefined}
                </div>
                <FormControlLabel
                    className="courier-setting-control"
                    control={(
                        <Switch
                            aria-label={label}
                            checked={enabled}
                            disabled={lockedByPolicy || forcedByProofRule || saving}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => toggleSetting(setting, event.target.checked)}
                        />
                    )}
                    label={enabled ? translation.stateOn : translation.stateOff}
                />
            </div>
        );
    };

    const renderParameterRow = (parameter: CourierConfigurationParameter, control: React.ReactNode) => {
        const description = translation.parameters[parameter].description;
        const errorMessage = fieldErrorMessage(parameter);
        return (
            <div className="courier-setting-row" key={parameter}>
                <div className="courier-setting-copy">
                    <div className="courier-setting-title">
                        <strong>{translation.parameters[parameter].label}</strong>
                    </div>
                    {description ? <small>{description}</small> : undefined}
                    {errorMessage ? <small className="courier-setting-error" role="alert">{errorMessage}</small> : undefined}
                </div>
                <div className="courier-setting-input">{control}</div>
            </div>
        );
    };

    const renderParameters = (group: CourierSettingGroup) => {
        if (!draft) {
            return [];
        }
        if (group === "DELIVERIES") {
            return [
                renderParameterRow("MAX_DELIVERY_ATTEMPTS", (
                    <TextField
                        aria-label={translation.parameters.MAX_DELIVERY_ATTEMPTS.label}
                        error={Boolean(fieldErrors.MAX_DELIVERY_ATTEMPTS)}
                        fullWidth
                        inputProps={{min: 1, inputMode: "numeric"}}
                        size="small"
                        type="number"
                        value={draft.maxDeliveryAttempts}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateParameter("maxDeliveryAttempts", "MAX_DELIVERY_ATTEMPTS", event.target.value)}
                    />
                )),
            ];
        }
        if (group === "ROUTES") {
            return [
                renderParameterRow("MAX_SHIPMENTS_PER_ROUTE", (
                    <TextField
                        aria-label={translation.parameters.MAX_SHIPMENTS_PER_ROUTE.label}
                        error={Boolean(fieldErrors.MAX_SHIPMENTS_PER_ROUTE)}
                        fullWidth
                        inputProps={{min: 1, inputMode: "numeric"}}
                        placeholder={translation.noLimit}
                        size="small"
                        type="number"
                        value={draft.maxShipmentsPerRoute}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateParameter("maxShipmentsPerRoute", "MAX_SHIPMENTS_PER_ROUTE", event.target.value)}
                    />
                )),
            ];
        }
        if (group === "PREFERENCES") {
            return [
                renderParameterRow("PREFERRED_LABEL_FORMAT", (
                    <TextField
                        aria-label={translation.parameters.PREFERRED_LABEL_FORMAT.label}
                        fullWidth
                        select
                        size="small"
                        value={draft.preferredLabelFormat}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateParameter("preferredLabelFormat", "PREFERRED_LABEL_FORMAT", event.target.value as CourierLabelFormat)}
                    >
                        {courierLabelFormats.map((labelFormat) => (
                            <MenuItem key={labelFormat} value={labelFormat}>{translation.labelFormats[labelFormat]}</MenuItem>
                        ))}
                    </TextField>
                )),
                renderParameterRow("DEFAULT_SHIPMENT_SORT_ORDER", (
                    <TextField
                        aria-label={translation.parameters.DEFAULT_SHIPMENT_SORT_ORDER.label}
                        fullWidth
                        select
                        size="small"
                        value={draft.defaultShipmentSortOrder}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateParameter("defaultShipmentSortOrder", "DEFAULT_SHIPMENT_SORT_ORDER", event.target.value as CourierShipmentSortOrder)}
                    >
                        {courierShipmentSortOrders.map((sortOrder) => (
                            <MenuItem key={sortOrder} value={sortOrder}>{translation.sortOrders[sortOrder]}</MenuItem>
                        ))}
                    </TextField>
                )),
            ];
        }
        return [];
    };

    const renderSubstitute = () => {
        if (!draft) {
            return undefined;
        }
        const selectedCode = draft.substituteSupplierCode.trim();
        const errorMessage = fieldErrorMessage("SUBSTITUTE_SUPPLIER_ID");
        return (
            <div className="courier-substitute" role="tabpanel">
                <div className="courier-setting-list courier-substitute-list">
                    {renderParameterRow("SUBSTITUTE_SUPPLIER_ID", (
                        <TextField
                            aria-label={translation.parameters.SUBSTITUTE_SUPPLIER_ID.label}
                            error={Boolean(errorMessage)}
                            fullWidth
                            placeholder={translation.substitute.placeholder}
                            size="small"
                            value={draft.substituteSupplierCode}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateParameter("substituteSupplierCode", "SUBSTITUTE_SUPPLIER_ID", event.target.value)}
                        />
                    ))}
                </div>
                <div className="courier-substitute-candidates">
                    <div className="courier-substitute-candidates-head">
                        <strong>{translation.substitute.candidatesTitle}</strong>
                        {selectedCode ? (
                            <Button size="small" variant="outlined" onClick={() => updateParameter("substituteSupplierCode", "SUBSTITUTE_SUPPLIER_ID", "")}>
                                {translation.substitute.clear}
                            </Button>
                        ) : undefined}
                    </div>
                    {substituteCandidates.length ? (
                        <ul>
                            {substituteCandidates.map((candidate) => {
                                const name = courierDisplayName(candidate.firstName, candidate.lastName);
                                const selected = candidate.supplierCode === selectedCode;
                                return (
                                    <li key={candidate.supplierCode}>
                                        <button
                                            aria-pressed={selected}
                                            className="courier-substitute-candidate"
                                            data-selected={selected}
                                            type="button"
                                            onClick={() => updateParameter("substituteSupplierCode", "SUBSTITUTE_SUPPLIER_ID", candidate.supplierCode)}
                                        >
                                            <span>{name || candidate.supplierCode}</span>
                                            <code>{candidate.supplierCode}</code>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="courier-configuration-empty">{translation.substitute.noCandidates}</p>
                    )}
                </div>
            </div>
        );
    };

    const fieldLabel = (field: CourierSetting | CourierConfigurationParameter) => {
        const settingTranslation = (translation.settings as Record<string, {label: string}>)[field];
        const parameterTranslation = (translation.parameters as Record<string, {label: string}>)[field];
        return settingTranslation?.label || parameterTranslation?.label || field;
    };

    const historyValue = (value: string | null) => {
        if (value === null) {
            return translation.history.emptyValue;
        }
        if (value === "true") {
            return translation.history.enabledValue;
        }
        if (value === "false") {
            return translation.history.disabledValue;
        }
        return value;
    };

    const renderHistory = () => {
        if (historyLoading) {
            return (
                <div className="courier-configuration-loading">
                    <CircularProgress size={18} />
                    <span>{pl.common.loading}</span>
                </div>
            );
        }
        if (historyError) {
            return <Alert severity="error">{historyError}</Alert>;
        }
        if (!history.length) {
            return <p className="courier-configuration-empty">{translation.history.empty}</p>;
        }
        return (
            <ol className="courier-configuration-history">
                {history.map((revision) => (
                    <li key={revision.revisionId}>
                        <div className="courier-configuration-history-head">
                            <strong>{translation.history.changeTypes[revision.changeType]}</strong>
                            <span>{new Date(revision.changedAt).toLocaleString(pl.common.locale)}</span>
                            <span>
                                {translation.history.changedBy}: {revision.changedBy ?? translation.history.unknownUser}
                            </span>
                        </div>
                        <ul>
                            {revision.changes.map((change) => (
                                <li key={change.field}>
                                    <span>{fieldLabel(change.field)}</span>
                                    <span className="courier-configuration-history-values">
                                        {historyValue(change.previousValue)} → {historyValue(change.newValue)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ol>
        );
    };

    const displayedName = courierName || courierDisplayName(configuration?.firstName, configuration?.lastName);
    const displayedCode = supplierCode || configuration?.supplierCode || "";

    const configurationContent = (
        <>
            <div className="courier-configuration-tabs" role="tablist" aria-label={translation.title}>
                {configurationTabs.map((tab) => (
                    <button
                        aria-selected={activeTab === tab}
                        className="courier-configuration-tab"
                        data-active={activeTab === tab}
                        key={tab}
                        role="tab"
                        type="button"
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === "HISTORY" ? <History fontSize="small" aria-hidden="true" /> : undefined}
                        {translation.tabs[tab]}
                    </button>
                ))}
            </div>
            {successMessage ? <Alert severity="success">{successMessage}</Alert> : undefined}
            {conflict ? (
                <Alert
                    severity="warning"
                    action={(
                        <Button startIcon={<Refresh />} variant="outlined" onClick={loadConfiguration}>
                            {translation.actions.reload}
                        </Button>
                    )}
                >
                    {translation.messages.conflict}
                </Alert>
            ) : undefined}
            {saveError ? <Alert severity="error">{saveError}</Alert> : undefined}
            {loadError ? (
                <Alert
                    severity="error"
                    action={<Button variant="outlined" onClick={loadConfiguration}>{translation.actions.reload}</Button>}
                >
                    {loadError}
                </Alert>
            ) : undefined}
            {loading ? (
                <div className="courier-configuration-loading">
                    <CircularProgress size={18} />
                    <span>{translation.messages.loading}</span>
                </div>
            ) : undefined}
            {!loading && configuration && draft && activeTab !== "HISTORY" && activeTab !== "SUBSTITUTE" ? (
                <div className="courier-setting-list" role="tabpanel">
                    {settingsInGroup(configuration.definitions, activeTab).map(renderSetting)}
                    {renderParameters(activeTab)}
                </div>
            ) : undefined}
            {!loading && configuration && draft && activeTab === "SUBSTITUTE" ? renderSubstitute() : undefined}
            {activeTab === "HISTORY" ? (
                <div className="courier-configuration-panel" role="tabpanel">{renderHistory()}</div>
            ) : undefined}
        </>
    );

    const configurationActions = (
        <>
            {dirty ? <span className="courier-configuration-dirty">{translation.messages.unsavedChanges}</span> : undefined}
            <Button
                disabled={!configuration || saving || conflict}
                startIcon={<Undo />}
                variant="outlined"
                onClick={() => setResetConfirmationOpen(true)}
            >
                {translation.actions.resetDefaults}
            </Button>
            <Button disabled={saving} variant="outlined" onClick={cancel}>{translation.actions.cancel}</Button>
            <Button
                disabled={!dirty || saving || conflict}
                startIcon={<Save />}
                variant="contained"
                onClick={saveConfiguration}
            >
                {pl.common.saveChanges}
            </Button>
        </>
    );

    const resetConfirmationDialog = (
        <Dialog open={resetConfirmationOpen} onClose={() => setResetConfirmationOpen(false)}>
            <DialogTitle>{translation.confirmReset.title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{translation.confirmReset.description}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" onClick={() => setResetConfirmationOpen(false)}>
                    {translation.actions.cancel}
                </Button>
                <Button variant="contained" onClick={resetToDefaults}>{translation.actions.confirmReset}</Button>
            </DialogActions>
        </Dialog>
    );

    if (variant === "page") {
        return (
            <main className="couriers-page courier-settings-page">
                <section className="courier-settings-card">
                    <header className="courier-settings-header">
                        <h1>{translation.mySettings.title}</h1>
                        <p>{displayedName ? `${displayedName} (${displayedCode})` : translation.mySettings.description}</p>
                    </header>
                    <div className="courier-configuration-dialog-content">{configurationContent}</div>
                    <footer className="courier-configuration-dialog-actions">{configurationActions}</footer>
                </section>
                {resetConfirmationDialog}
            </main>
        );
    }

    return (
        <>
            <Dialog
                className="courier-configuration-dialog"
                fullWidth
                maxWidth="lg"
                open={open}
                PaperProps={{className: "courier-configuration-dialog-paper"}}
                onClose={cancel}
            >
                <DialogTitle className="courier-configuration-dialog-title">
                    <span className="courier-configuration-dialog-heading">
                        <span>{translation.title}</span>
                        <small>
                            {translation.editingFor}: {displayedName ? `${displayedName} (${displayedCode})` : displayedCode}
                        </small>
                    </span>
                    <IconButton aria-label={pl.common.close} onClick={cancel}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent className="courier-configuration-dialog-content">{configurationContent}</DialogContent>
                <DialogActions className="courier-configuration-dialog-actions">{configurationActions}</DialogActions>
            </Dialog>
            {resetConfirmationDialog}
        </>
    );
}

export default CourierConfigurationDialog;
