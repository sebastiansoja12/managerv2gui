import React, {useState} from "react";
import {Close, MoreHoriz, PersonAddAlt, ToggleOff, ToggleOn} from "components/ui/icons";
import {Snackbar} from "components/ui";
import pl from "../../../i18n/translate";
import {
    DeliveryTimeConfiguration,
    FirstDepartmentDraft,
    Operator,
    OperatorDraft,
    ShipmentLimits,
    ShippingCapabilities,
} from "../../Operators/model/Operator";
import {getCapabilityLabels} from "./capabilityLabels";
import OperatorUserDialog from "./OperatorUserDialog";

type OperatorEditorProps = {
    createMode: boolean;
    draft: OperatorDraft;
    saving: boolean;
    selectedOperator?: Operator;
    onCreate: () => void;
    onSave: () => void;
    onToggleCapability: (key: keyof ShippingCapabilities) => void;
    onToggleStatus: () => void;
    onUpdateDraft: <K extends keyof OperatorDraft>(key: K, value: OperatorDraft[K]) => void;
};

function OperatorEditor({
    createMode,
    draft,
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
    const capabilityLabels = getCapabilityLabels();
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
    const createRequirementsMissing = createMode && (
        !draft.userFirstName
        || !draft.userLastName
        || !draft.username
        || !draft.password
        || !draft.email
        || !draft.firstDepartment.departmentCode
        || !draft.firstDepartment.city
        || !draft.firstDepartment.street
        || !draft.firstDepartment.postalCode
    );
    const saveDisabled = saving || !draft.companyName || !draft.taxId || createRequirementsMissing;

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

            <div className="super-admin-editor-section">
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
                    <div className="super-admin-editor-section">
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

                    <div className="super-admin-editor-section">
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
                                <select value={draft.firstDepartment.departmentType} onChange={(event) => updateFirstDepartment("departmentType", event.target.value)}>
                                    <option value="BRANCH">{pl.superAdmin.editor.departmentTypes.BRANCH}</option>
                                    <option value="HEADQUARTERS">{pl.superAdmin.editor.departmentTypes.HEADQUARTERS}</option>
                                    <option value="WAREHOUSE">{pl.superAdmin.editor.departmentTypes.WAREHOUSE}</option>
                                </select>
                            </label>
                        </div>
                    </div>
                </>
            ) : undefined}

            <div className="super-admin-editor-section">
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

            <div className="super-admin-editor-section">
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

            <div className="super-admin-editor-section">
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

            <div className="super-admin-editor-footer">
                <button className="super-admin-secondary-button" onClick={onCreate} type="button">
                    <Close fontSize="small"/>
                    <span>{pl.superAdmin.editor.clear}</span>
                </button>
                <button className="super-admin-primary-button" disabled={saveDisabled} onClick={onSave} type="button">
                    <MoreHoriz fontSize="small"/>
                    <span>{saving ? pl.superAdmin.editor.saving : createMode ? pl.superAdmin.editor.create : pl.superAdmin.editor.save}</span>
                </button>
            </div>

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
