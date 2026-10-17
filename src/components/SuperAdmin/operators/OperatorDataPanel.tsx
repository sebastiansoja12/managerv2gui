import React, {FormEvent, useMemo} from "react";
import {Alert} from "components/ui";
import {Refresh, Save} from "components/ui/icons";
import pl from "../../../i18n/translate";
import {Operator, OperatorDraft, operatorToDraft} from "../../Operators/model/Operator";
import {toUpdateRequest} from "./operatorPanelUtils";

type OperatorDataPanelProps = {
    operator: Operator;
    draft: OperatorDraft;
    saving: boolean;
    error?: string;
    onUpdateDraft: <K extends keyof OperatorDraft>(key: K, value: OperatorDraft[K]) => void;
    onReset: () => void;
    onSave: () => void;
};

type TextField = "companyName" | "taxId" | "contactEmail" | "contactPhone";
type DateField = "foundedDate" | "contractStartDate" | "contractEndDate";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toDateInput = (value?: string) => (value ? value.slice(0, 10) : "");

export const isOperatorDraftDirty = (operator: Operator, draft: OperatorDraft) => (
    JSON.stringify(toUpdateRequest(draft)) !== JSON.stringify(toUpdateRequest(operatorToDraft(operator)))
);

export const validateOperatorData = (draft: OperatorDraft) => {
    const messages = pl.superAdmin.operatorData.validation;
    const errors: string[] = [];
    if (!draft.companyName.trim()) {
        errors.push(messages.companyName);
    }
    if (!draft.taxId.trim()) {
        errors.push(messages.taxId);
    }
    if (draft.contactEmail.trim() && !EMAIL_PATTERN.test(draft.contactEmail.trim())) {
        errors.push(messages.email);
    }
    const start = toDateInput(draft.contractStartDate);
    const end = toDateInput(draft.contractEndDate);
    if (start && end && end < start) {
        errors.push(messages.contractDates);
    }
    return errors;
};

function OperatorDataPanel({operator, draft, saving, error, onUpdateDraft, onReset, onSave}: OperatorDataPanelProps) {
    const labels = pl.superAdmin.editor.fields;
    const texts = pl.superAdmin.operatorData;
    const dirty = useMemo(() => isOperatorDraftDirty(operator, draft), [draft, operator]);
    const validationErrors = useMemo(() => validateOperatorData(draft), [draft]);

    const textFields: Array<[TextField, string, string]> = [
        ["companyName", labels.companyName, "text"],
        ["taxId", labels.taxId, "text"],
        ["contactEmail", labels.contactEmail, "email"],
        ["contactPhone", labels.contactPhone, "tel"],
    ];

    const dateFields: Array<[DateField, string]> = [
        ["foundedDate", labels.foundedDate],
        ["contractStartDate", labels.contractStartDate],
        ["contractEndDate", labels.contractEndDate],
    ];

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!dirty || validationErrors.length || saving) {
            return;
        }
        onSave();
    };

    return (
        <form className="super-admin-configuration-workspace super-admin-operator-data" onSubmit={submit}>
            <div className="super-admin-directory-list-header">
                <div>
                    <strong>{texts.title}</strong>
                    <span>{dirty ? texts.unsaved : texts.subtitle}</span>
                </div>
                <div className="super-admin-module-heading-buttons">
                    <button className="super-admin-secondary-button super-admin-compact-button" disabled={!dirty || saving} onClick={onReset} type="button">
                        <Refresh fontSize="small" /><span>{texts.reset}</span>
                    </button>
                    <button className="super-admin-primary-button super-admin-compact-button" disabled={!dirty || saving || validationErrors.length > 0} type="submit">
                        <Save fontSize="small" /><span>{saving ? texts.saving : texts.save}</span>
                    </button>
                </div>
            </div>

            {error ? <Alert severity="error">{error}</Alert> : null}
            {dirty && validationErrors.length ? (
                <Alert severity="warning">{validationErrors.join(" ")}</Alert>
            ) : null}

            <fieldset className="super-admin-data-section">
                <legend>{texts.company}</legend>
                <div className="super-admin-form-grid">
                    {textFields.map(([key, label, type]) => (
                        <label key={key}>
                            <span>{label}</span>
                            <input
                                name={key}
                                onChange={(event) => onUpdateDraft(key, event.target.value)}
                                required={key === "companyName" || key === "taxId"}
                                type={type}
                                value={draft[key]}
                            />
                        </label>
                    ))}
                </div>
            </fieldset>

            <fieldset className="super-admin-data-section">
                <legend>{texts.contract}</legend>
                <div className="super-admin-form-grid super-admin-form-grid-3">
                    {dateFields.map(([key, label]) => (
                        <label key={key}>
                            <span>{label}</span>
                            <input
                                name={key}
                                onChange={(event) => onUpdateDraft(key, event.target.value)}
                                type="date"
                                value={toDateInput(draft[key])}
                            />
                        </label>
                    ))}
                </div>
            </fieldset>
        </form>
    );
}

export default OperatorDataPanel;
