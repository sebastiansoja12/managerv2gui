import React, {useEffect, useState} from "react";
import {ArrowBack, ChevronRight, Close, PersonAddAlt, Save, ToggleOff, ToggleOn} from "components/ui/icons";
import {Alert, Select, Snackbar} from "components/ui";
import pl from "../../../i18n/translate";
import {
    DeliveryTimeConfiguration,
    FirstDepartmentDraft,
    Operator,
    OperatorDraft,
    OperatorGeocodingConfigurationDraft,
    ShipmentLimits,
    ShippingCapabilities,
} from "../../Operators/model/Operator";
import {
    GeocodingConfigurationField,
    GeocodingProviderDefinition,
} from "../../GlobalConfiguration/model/GeocodingConfiguration";
import {getCapabilityLabels} from "./capabilityLabels";
import OperatorUserDialog from "./OperatorUserDialog";

type OperatorEditorProps = {
    createMode: boolean;
    draft: OperatorDraft;
    error?: string;
    geocodingProviders: GeocodingProviderDefinition[];
    saving: boolean;
    selectedOperator?: Operator;
    onCreate: () => void;
    onSave: () => void;
    onToggleCapability: (key: keyof ShippingCapabilities) => void;
    onToggleStatus: () => void;
    onUpdateDraft: <K extends keyof OperatorDraft>(key: K, value: OperatorDraft[K]) => void;
};

type OperatorCreateStep = "data" | "configuration" | "department";

type OperatorGeocodingCredentialKey = Exclude<
    keyof OperatorGeocodingConfigurationDraft,
    "enabled" | "provider"
>;

const geocodingFieldKeys: Record<GeocodingConfigurationField, OperatorGeocodingCredentialKey> = {
    API_USER_NAME: "apiUserName",
    API_PASSWORD: "apiPassword",
    API_KEY: "apiKey",
    CLIENT_NUMBER: "clientNumber",
    ACCESS_TOKEN: "accessToken",
    REFRESH_TOKEN: "refreshToken",
};

const sensitiveGeocodingFields = new Set<GeocodingConfigurationField>([
    "API_PASSWORD",
    "API_KEY",
    "ACCESS_TOKEN",
    "REFRESH_TOKEN",
]);

const getProviderLabel = (provider: string) => (
    pl.superAdmin.editor.geocodingProviders as Record<string, string>
)[provider] || provider.toLowerCase().split("_").map((part) => (
        part.charAt(0).toUpperCase() + part.slice(1)
    )).join(" ");

function OperatorEditor({
    createMode,
    draft,
    error,
    geocodingProviders,
    saving,
    selectedOperator,
    onCreate,
    onSave,
    onToggleCapability,
    onToggleStatus,
    onUpdateDraft,
}: OperatorEditorProps) {
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [userCreated, setUserCreated] = useState(false);
    const [createStep, setCreateStep] = useState<OperatorCreateStep>("data");
    const capabilityLabels = getCapabilityLabels();
    const selectedGeocodingProvider = geocodingProviders.find((definition) => (
        definition.provider === draft.geocodingConfiguration.provider
    ));
    const updateShipmentLimit = (key: keyof ShipmentLimits, value: string) => {
        onUpdateDraft("configuration", {
            ...draft.configuration,
            shipmentLimits: {
                ...draft.configuration.shipmentLimits,
                [key]: Number(value),
            },
        });
    };

    const updateDeliveryTime = (key: keyof DeliveryTimeConfiguration, value: string) => {
        onUpdateDraft("configuration", {
            ...draft.configuration,
            deliveryTimeConfiguration: {
                ...draft.configuration.deliveryTimeConfiguration,
                [key]: Number(value),
            },
        });
    };

    const updateFirstDepartment = (key: keyof FirstDepartmentDraft, value: string) => {
        onUpdateDraft("firstDepartment", {
            ...draft.firstDepartment,
            [key]: value,
        });
    };
    const updateGeocodingConfiguration = (
        key: OperatorGeocodingCredentialKey,
        value: string,
    ) => {
        onUpdateDraft("geocodingConfiguration", {
            ...draft.geocodingConfiguration,
            [key]: value,
        });
    };
    const selectGeocodingProvider = (provider: string) => {
        onUpdateDraft("geocodingConfiguration", {
            apiUserName: "",
            apiPassword: "",
            apiKey: "",
            clientNumber: "",
            accessToken: "",
            refreshToken: "",
            enabled: true,
            provider,
        });
    };
    const geocodingRequirementsMissing = !selectedGeocodingProvider
        || selectedGeocodingProvider.activeFields.some((field) => (
            !String(draft.geocodingConfiguration[geocodingFieldKeys[field]] ?? "").trim()
        ));
    const dataRequirementsMissing = !draft.companyName
        || !draft.taxId
        || !draft.userFirstName
        || !draft.userLastName
        || !draft.username
        || !draft.password
        || !draft.email;
    const departmentRequirementsMissing = !draft.firstDepartment.departmentCode
        || !draft.firstDepartment.city
        || !draft.firstDepartment.street
        || !draft.firstDepartment.postalCode;
    const createRequirementsMissing = createMode && (
        dataRequirementsMissing
        || geocodingRequirementsMissing
        || departmentRequirementsMissing
    );
    const saveDisabled = saving || !draft.companyName || !draft.taxId || createRequirementsMissing;
    const createSteps: Array<{key: OperatorCreateStep; label: string; hint: string; invalid: boolean}> = [
        {
            key: "data",
            label: pl.superAdmin.editor.wizard.data,
            hint: pl.superAdmin.editor.wizard.dataHint,
            invalid: dataRequirementsMissing,
        },
        {
            key: "configuration",
            label: pl.superAdmin.editor.wizard.configuration,
            hint: pl.superAdmin.editor.wizard.configurationHint,
            invalid: geocodingRequirementsMissing,
        },
        {
            key: "department",
            label: pl.superAdmin.editor.wizard.department,
            hint: pl.superAdmin.editor.wizard.departmentHint,
            invalid: departmentRequirementsMissing,
        },
    ];
    const currentStepIndex = createSteps.findIndex((step) => step.key === createStep);
    const currentStepInvalid = createSteps[currentStepIndex]?.invalid ?? false;

    useEffect(() => {
        if (createMode) {
            setCreateStep("data");
        }
    }, [createMode]);

    return (
        <article className="super-admin-panel super-admin-editor">
            <div className="super-admin-panel-header">
                <div>
                    <h2>{createMode ? pl.superAdmin.editor.newOperator : selectedOperator?.companyName || pl.superAdmin.editor.fallbackOperator}</h2>
                    <span>{createMode ? pl.superAdmin.editor.generatedId : `ID #${draft.operatorId}`}</span>
                </div>
                <div className="super-admin-editor-header-actions">
                    {!createMode && selectedOperator ? (
                        <button className="super-admin-primary-button super-admin-compact-button" onClick={() => setUserDialogOpen(true)} type="button">
                            <PersonAddAlt fontSize="small"/>
                            <span>{pl.superAdmin.userDialog.open}</span>
                        </button>
                    ) : null}
                    <button className="super-admin-ghost-button super-admin-compact-button" onClick={onToggleStatus} type="button">
                        {draft.status === "ACTIVE" ? <ToggleOn fontSize="small"/> : <ToggleOff fontSize="small"/>}
                        <span>{draft.status === "ACTIVE" ? pl.superAdmin.editor.active : pl.superAdmin.editor.inactive}</span>
                    </button>
                </div>
            </div>

            {createMode ? (
                <div className="super-admin-editor-wizard-tabs" role="tablist" aria-label={pl.superAdmin.editor.wizard.ariaLabel}>
                    {createSteps.map((step, index) => (
                        <button
                            aria-selected={createStep === step.key}
                            className={`${createStep === step.key ? "is-active" : ""}${!step.invalid ? " is-complete" : ""}`}
                            key={step.key}
                            onClick={() => setCreateStep(step.key)}
                            role="tab"
                            type="button"
                        >
                            <span className="super-admin-editor-wizard-index">{String(index + 1).padStart(2, "0")}</span>
                            <span><strong>{step.label}</strong><small>{step.hint}</small></span>
                        </button>
                    ))}
                </div>
            ) : null}

            <div className={createMode ? "super-admin-editor-wizard-content" : undefined}>
            {error ? <Alert className="super-admin-editor-alert" severity="error">{error}</Alert> : null}

            <div className="super-admin-editor-step-section" hidden={createMode && createStep !== "data"}>
                <div className="super-admin-section-title">
                    <strong>{pl.superAdmin.editor.basicTitle}</strong>
                </div>
                <div className="super-admin-form-grid">
                    <label>
                        <span>{pl.superAdmin.editor.fields.companyName}</span>
                        <input value={draft.companyName} onChange={(event) => onUpdateDraft("companyName", event.target.value)}/>
                    </label>
                    <label>
                        <span>{pl.superAdmin.editor.fields.taxId}</span>
                        <input value={draft.taxId} onChange={(event) => onUpdateDraft("taxId", event.target.value)}/>
                    </label>
                    <label>
                        <span>{pl.superAdmin.editor.fields.contactEmail}</span>
                        <input value={draft.contactEmail} onChange={(event) => onUpdateDraft("contactEmail", event.target.value)}/>
                    </label>
                    <label>
                        <span>{pl.superAdmin.editor.fields.contactPhone}</span>
                        <input value={draft.contactPhone} onChange={(event) => onUpdateDraft("contactPhone", event.target.value)}/>
                    </label>
                </div>
            </div>

            <div className="super-admin-editor-section" hidden={createMode && createStep !== "data"}>
                <div className="super-admin-section-title">
                    <strong>{pl.superAdmin.editor.contractTitle}</strong>
                </div>
                <div className="super-admin-form-grid">
                    <label>
                        <span>{pl.superAdmin.editor.fields.contractStartDate}</span>
                        <input type="date" value={draft.contractStartDate} onChange={(event) => onUpdateDraft("contractStartDate", event.target.value)}/>
                    </label>
                    <label>
                        <span>{pl.superAdmin.editor.fields.contractEndDate}</span>
                        <input type="date" value={draft.contractEndDate} onChange={(event) => onUpdateDraft("contractEndDate", event.target.value)}/>
                    </label>
                    <label>
                        <span>{pl.superAdmin.editor.fields.foundedDate}</span>
                        <input type="date" value={draft.foundedDate} onChange={(event) => onUpdateDraft("foundedDate", event.target.value)}/>
                    </label>
                </div>
            </div>

            {createMode ? (
                <>
                    <div className="super-admin-editor-section" hidden={createStep !== "data"}>
                        <div className="super-admin-section-title">
                            <strong>{pl.superAdmin.editor.adminTitle}</strong>
                        </div>
                        <div className="super-admin-form-grid">
                            <label>
                                <span>{pl.superAdmin.editor.fields.userFirstName}</span>
                                <input value={draft.userFirstName} onChange={(event) => onUpdateDraft("userFirstName", event.target.value)}/>
                            </label>
                            <label>
                                <span>{pl.superAdmin.editor.fields.userLastName}</span>
                                <input value={draft.userLastName} onChange={(event) => onUpdateDraft("userLastName", event.target.value)}/>
                            </label>
                            <label>
                                <span>{pl.superAdmin.editor.fields.username}</span>
                                <input value={draft.username} onChange={(event) => onUpdateDraft("username", event.target.value)}/>
                            </label>
                            <label>
                                <span>{pl.superAdmin.editor.fields.password}</span>
                                <input type="password" value={draft.password} onChange={(event) => onUpdateDraft("password", event.target.value)}/>
                            </label>
                            <label>
                                <span>{pl.superAdmin.editor.fields.language}</span>
                                <input value={draft.language} onChange={(event) => onUpdateDraft("language", event.target.value)}/>
                            </label>
                            <label>
                                <span>{pl.superAdmin.editor.fields.email}</span>
                                <input type="email" value={draft.email} onChange={(event) => onUpdateDraft("email", event.target.value)}/>
                            </label>
                        </div>
                    </div>

                    <div className="super-admin-editor-section" hidden={createStep !== "configuration"}>
                        <div className="super-admin-section-title">
                            <strong>{pl.superAdmin.editor.geocodingTitle}</strong>
                            <span>{pl.superAdmin.editor.geocodingSubtitle}</span>
                        </div>
                        <div className="super-admin-form-grid">
                            <label>
                                <span>{pl.superAdmin.editor.fields.geocodingProvider}</span>
                                <Select
                                    aria-label={pl.superAdmin.editor.fields.geocodingProvider}
                                    value={draft.geocodingConfiguration.provider}
                                    onChange={(event) => selectGeocodingProvider(event.target.value)}
                                >
                                    <option value="">{pl.superAdmin.editor.selectGeocodingProvider}</option>
                                    {geocodingProviders.map((definition) => (
                                        <option key={definition.provider} value={definition.provider}>
                                            {getProviderLabel(definition.provider)}
                                        </option>
                                    ))}
                                </Select>
                            </label>
                            {selectedGeocodingProvider?.activeFields.map((field) => {
                                const key = geocodingFieldKeys[field];
                                return (
                                    <label key={field}>
                                        <span>{pl.superAdmin.editor.geocodingFields[field]}</span>
                                        <input
                                            autoComplete="off"
                                            type={sensitiveGeocodingFields.has(field) ? "password" : "text"}
                                            value={String(draft.geocodingConfiguration[key] ?? "")}
                                            onChange={(event) => updateGeocodingConfiguration(key, event.target.value)}
                                        />
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="super-admin-editor-section" hidden={createStep !== "department"}>
                        <div className="super-admin-section-title">
                            <strong>{pl.superAdmin.editor.firstDepartmentTitle}</strong>
                        </div>
                        <div className="super-admin-form-grid">
                            <label>
                                <span>{pl.superAdmin.editor.fields.departmentCode}</span>
                                <input value={draft.firstDepartment.departmentCode} onChange={(event) => updateFirstDepartment("departmentCode", event.target.value)}/>
                            </label>
                            <label>
                                <span>{pl.superAdmin.editor.fields.city}</span>
                                <input value={draft.firstDepartment.city} onChange={(event) => updateFirstDepartment("city", event.target.value)}/>
                            </label>
                            <label>
                                <span>{pl.superAdmin.editor.fields.street}</span>
                                <input value={draft.firstDepartment.street} onChange={(event) => updateFirstDepartment("street", event.target.value)}/>
                            </label>
                            <label>
                                <span>{pl.superAdmin.editor.fields.postalCode}</span>
                                <input value={draft.firstDepartment.postalCode} onChange={(event) => updateFirstDepartment("postalCode", event.target.value)}/>
                            </label>
                            <label>
                                <span>{pl.superAdmin.editor.fields.countryCode}</span>
                                <input value={draft.firstDepartment.countryCode} onChange={(event) => updateFirstDepartment("countryCode", event.target.value)}/>
                            </label>
                            <label>
                                <span>{pl.superAdmin.editor.fields.openingHours}</span>
                                <input value={draft.firstDepartment.openingHours} onChange={(event) => updateFirstDepartment("openingHours", event.target.value)}/>
                            </label>
                            <label>
                                <span>{pl.superAdmin.editor.fields.departmentType}</span>
                                <Select aria-label={pl.superAdmin.editor.fields.departmentType} value={draft.firstDepartment.departmentType} onChange={(event) => updateFirstDepartment("departmentType", event.target.value)}>
                                    <option value="BRANCH">{pl.superAdmin.editor.departmentTypes.BRANCH}</option>
                                    <option value="HEADQUARTERS">{pl.superAdmin.editor.departmentTypes.HEADQUARTERS}</option>
                                    <option value="WAREHOUSE">{pl.superAdmin.editor.departmentTypes.WAREHOUSE}</option>
                                </Select>
                            </label>
                        </div>
                    </div>
                </>
            ) : undefined}

            <div className="super-admin-editor-section" hidden={createMode && createStep !== "configuration"}>
                <div className="super-admin-section-title">
                    <strong>{pl.superAdmin.editor.featuresTitle}</strong>
                    <span>{pl.superAdmin.editor.featuresSubtitle}</span>
                </div>
                <div className="super-admin-feature-grid">
                    {capabilityLabels.map((capability) => {
                        const enabled = Boolean(draft.configuration.shippingCapabilities[capability.key]);

                        return (
                            <button
                                className={`super-admin-feature${enabled ? " super-admin-feature-enabled" : ""}`}
                                key={capability.key}
                                onClick={() => onToggleCapability(capability.key)}
                                type="button"
                            >
                                <span>
                                    <strong>{capability.label}</strong>
                                    <small>{capability.hint}</small>
                                </span>
                                {enabled ? <ToggleOn fontSize="small"/> : <ToggleOff fontSize="small"/>}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="super-admin-editor-section" hidden={createMode && createStep !== "configuration"}>
                <div className="super-admin-section-title">
                    <strong>{pl.superAdmin.editor.shipmentLimitsTitle}</strong>
                </div>
                <div className="super-admin-form-grid">
                    {Object.entries(pl.superAdmin.editor.limits).map(([key, label]) => (
                        <label key={key}>
                            <span>{label}</span>
                            <input
                                step="0.1"
                                type="number"
                                value={draft.configuration.shipmentLimits[key as keyof ShipmentLimits]}
                                onChange={(event) => updateShipmentLimit(key as keyof ShipmentLimits, event.target.value)}
                            />
                        </label>
                    ))}
                </div>
            </div>

            <div className="super-admin-editor-section" hidden={createMode && createStep !== "configuration"}>
                <div className="super-admin-section-title">
                    <strong>{pl.superAdmin.editor.deliveryTitle}</strong>
                </div>
                <div className="super-admin-form-grid">
                    {Object.entries(pl.superAdmin.editor.delivery).map(([key, label]) => (
                        <label key={key}>
                            <span>{label}</span>
                            <input
                                min="0"
                                type="number"
                                value={draft.configuration.deliveryTimeConfiguration[key as keyof DeliveryTimeConfiguration]}
                                onChange={(event) => updateDeliveryTime(key as keyof DeliveryTimeConfiguration, event.target.value)}
                            />
                        </label>
                    ))}
                </div>
            </div>
            </div>

            {createMode ? (
                <div className="super-admin-editor-footer super-admin-editor-wizard-footer">
                    <button className="super-admin-secondary-button" disabled={saving} onClick={onCreate} type="button">
                        <Close fontSize="small"/>
                        <span>{pl.superAdmin.editor.wizard.cancel}</span>
                    </button>
                    <div className="super-admin-editor-wizard-navigation">
                        {currentStepIndex > 0 ? (
                            <button className="super-admin-secondary-button" disabled={saving} onClick={() => setCreateStep(createSteps[currentStepIndex - 1].key)} type="button">
                                <ArrowBack fontSize="small"/>
                                <span>{pl.superAdmin.editor.wizard.back}</span>
                            </button>
                        ) : null}
                        {currentStepIndex < createSteps.length - 1 ? (
                            <button className="super-admin-primary-button" disabled={saving || currentStepInvalid} onClick={() => setCreateStep(createSteps[currentStepIndex + 1].key)} type="button">
                                <span>{pl.superAdmin.editor.wizard.next}</span>
                                <ChevronRight fontSize="small"/>
                            </button>
                        ) : (
                            <button className="super-admin-primary-button" disabled={saveDisabled} onClick={onSave} type="button">
                                <Save fontSize="small"/>
                                <span>{saving ? pl.superAdmin.editor.saving : pl.superAdmin.editor.create}</span>
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="super-admin-editor-footer">
                    <button className="super-admin-secondary-button" onClick={onCreate} type="button">
                        <Close fontSize="small"/>
                        <span>{pl.superAdmin.editor.clear}</span>
                    </button>
                    <button className="super-admin-primary-button" disabled={saveDisabled} onClick={onSave} type="button">
                        <Save fontSize="small"/>
                        <span>{saving ? pl.superAdmin.editor.saving : pl.superAdmin.editor.save}</span>
                    </button>
                </div>
            )}

            {selectedOperator ? (
                <OperatorUserDialog
                    onClose={() => setUserDialogOpen(false)}
                    onCreated={() => setUserCreated(true)}
                    open={userDialogOpen}
                    operatorId={String(selectedOperator.operatorId.value)}
                    operatorName={selectedOperator.companyName}
                />
            ) : null}
            <Snackbar
                autoHideDuration={4000}
                message={pl.superAdmin.userDialog.success}
                onClose={() => setUserCreated(false)}
                open={userCreated}
            />
        </article>
    );
}

export default OperatorEditor;
