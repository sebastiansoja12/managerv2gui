import React, {useEffect, useMemo, useState} from "react";
import {Alert} from "components/ui";
import {CheckCircle, Close, Search} from "components/ui/icons";
import {getBackendErrorMessage} from "../../../api/errorMessage";
import OperatorService from "../../../hooks/OperatorService";
import pl from "../../../i18n/translate";
import {Operator, operatorToDraft, ShippingCapabilities} from "../../Operators/model/Operator";
import {getCapabilityLabels} from "../operators/capabilityLabels";
import {getOperatorIdValue, toUpdateRequest, withCapability} from "../operators/operatorPanelUtils";

type FeatureMatrixPanelProps = {
    operators?: Operator[];
    onOperatorSaved?: (operator: Operator) => void;
};

const cellKey = (operatorId: string, capability: keyof ShippingCapabilities) => `${operatorId}:${capability}`;

function FeatureMatrixPanel({operators: providedOperators, onOperatorSaved}: FeatureMatrixPanelProps) {
    const texts = pl.superAdmin.featureMatrix;
    const capabilities = getCapabilityLabels();
    const [loadedOperators, setLoadedOperators] = useState<Operator[]>([]);
    const [loading, setLoading] = useState(!providedOperators);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [savingCell, setSavingCell] = useState("");

    useEffect(() => {
        if (providedOperators) {
            return;
        }
        OperatorService.getAll()
            .then((response) => setLoadedOperators(Array.isArray(response.data) ? response.data : []))
            .catch((requestError) => setError(getBackendErrorMessage(requestError, texts.loadError)))
            .finally(() => setLoading(false));
    }, [providedOperators, texts.loadError]);

    const operators = providedOperators || loadedOperators;

    const visibleOperators = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return operators.filter((operator) => !normalizedQuery
            || operator.companyName?.toLowerCase().includes(normalizedQuery)
            || getOperatorIdValue(operator).includes(normalizedQuery));
    }, [operators, query]);

    const adoption = useMemo(() => new Map(capabilities.map((capability) => [
        capability.key,
        operators.filter((operator) => operator.configuration?.shippingCapabilities?.[capability.key]).length,
    ])), [capabilities, operators]);

    const toggle = (operator: Operator, capability: keyof ShippingCapabilities) => {
        const operatorId = getOperatorIdValue(operator);
        const draft = operatorToDraft(operator);
        const nextValue = !draft.configuration.shippingCapabilities[capability];
        setSavingCell(cellKey(operatorId, capability));
        setError("");
        OperatorService.update(operatorId, toUpdateRequest(withCapability(draft, capability, nextValue)))
            .then((response) => {
                const savedOperator = response.data;
                if (!providedOperators) {
                    setLoadedOperators((current) => current.map((currentOperator) => (
                        getOperatorIdValue(currentOperator) === operatorId ? savedOperator : currentOperator
                    )));
                }
                onOperatorSaved?.(savedOperator);
            })
            .catch((requestError) => setError(getBackendErrorMessage(requestError, texts.saveError)))
            .finally(() => setSavingCell(""));
    };

    return (
        <section className="super-admin-module-section">
            <div className="super-admin-module-heading super-admin-module-heading-actions">
                <div>
                    <span className="super-admin-kicker">{pl.superAdmin.layout.kicker}</span>
                    <h2>{texts.title}</h2>
                    <p>{texts.subtitle}</p>
                </div>
                <label className="super-admin-member-search">
                    <Search fontSize="small" />
                    <input aria-label={texts.search} onChange={(event) => setQuery(event.target.value)} placeholder={texts.search} type="search" value={query} />
                </label>
            </div>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <div className="super-admin-feature-matrix-scroll">
                <table className="super-admin-feature-matrix">
                    <thead>
                        <tr>
                            <th scope="col">{texts.operator}</th>
                            {capabilities.map((capability) => (
                                <th key={capability.key} scope="col" title={capability.hint}>
                                    <span>{capability.label}</span>
                                    <small>{texts.adoption.replace("{count}", String(adoption.get(capability.key) || 0)).replace("{total}", String(operators.length))}</small>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visibleOperators.map((operator) => {
                            const operatorId = getOperatorIdValue(operator);
                            return (
                                <tr key={operatorId}>
                                    <th scope="row">
                                        <strong>{operator.companyName}</strong>
                                        <small>#{operatorId}{operator.status !== "ACTIVE" ? ` · ${pl.superAdmin.editor.inactive}` : ""}</small>
                                    </th>
                                    {capabilities.map((capability) => {
                                        const enabled = Boolean(operator.configuration?.shippingCapabilities?.[capability.key]);
                                        const saving = savingCell === cellKey(operatorId, capability.key);
                                        return (
                                            <td key={capability.key}>
                                                <button
                                                    aria-label={`${operator.companyName}: ${capability.label}`}
                                                    aria-pressed={enabled}
                                                    className={`super-admin-matrix-cell${enabled ? " is-enabled" : ""}`}
                                                    disabled={Boolean(savingCell)}
                                                    onClick={() => toggle(operator, capability.key)}
                                                    title={enabled ? pl.superAdmin.workspace.enabled : pl.superAdmin.workspace.disabled}
                                                    type="button"
                                                >
                                                    {saving ? "…" : enabled ? <CheckCircle fontSize="small" /> : <Close fontSize="small" />}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {!loading && !visibleOperators.length ? <div className="super-admin-directory-empty">{texts.empty}</div> : null}
            </div>
        </section>
    );
}

export default FeatureMatrixPanel;
