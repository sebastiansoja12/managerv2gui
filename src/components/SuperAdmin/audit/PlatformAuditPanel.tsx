import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Alert, Select} from "components/ui";
import {Refresh} from "components/ui/icons";
import {getBackendErrorMessage} from "../../../api/errorMessage";
import OperatorService from "../../../hooks/OperatorService";
import PlatformAuditService from "../../../hooks/PlatformAuditService";
import pl from "../../../i18n/translate";
import {Operator} from "../../Operators/model/Operator";
import {getOperatorIdValue} from "../operators/operatorPanelUtils";
import {PlatformAuditEntry} from "./model/PlatformAuditEntry";

const formatTime = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString(pl.common.locale);
};

function PlatformAuditPanel() {
    const [entries, setEntries] = useState<PlatformAuditEntry[]>([]);
    const [operators, setOperators] = useState<Operator[]>([]);
    const [operatorId, setOperatorId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        OperatorService.getAll()
            .then((response) => setOperators(Array.isArray(response.data) ? response.data : []))
            .catch(() => setOperators([]));
    }, []);

    const loadEntries = useCallback(() => {
        setLoading(true);
        setError("");
        PlatformAuditService.getLatest(operatorId)
            .then(setEntries)
            .catch((requestError) => setError(getBackendErrorMessage(requestError, pl.superAdmin.audit.loadError)))
            .finally(() => setLoading(false));
    }, [operatorId]);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    const operatorNames = useMemo(() => new Map(operators.map((operator) => [getOperatorIdValue(operator), operator.companyName])), [operators]);

    const operatorLabel = (entry: PlatformAuditEntry) => {
        if (entry.operatorId === null || entry.operatorId === undefined) {
            return pl.common.dash;
        }
        const operatorKey = String(entry.operatorId);
        return operatorNames.get(operatorKey) ? `${operatorNames.get(operatorKey)} · #${operatorKey}` : `#${operatorKey}`;
    };

    return (
        <section className="super-admin-module-section">
            <div className="super-admin-module-heading super-admin-module-heading-actions">
                <div>
                    <span className="super-admin-kicker">{pl.superAdmin.layout.kicker}</span>
                    <h2>{pl.superAdmin.audit.title}</h2>
                    <p>{pl.superAdmin.audit.subtitle}</p>
                </div>
                <div className="super-admin-module-heading-buttons">
                    <Select
                        aria-label={pl.superAdmin.audit.operator}
                        value={operatorId}
                        onChange={(event) => setOperatorId(event.target.value)}
                    >
                        <option value="">{pl.superAdmin.audit.allOperators}</option>
                        {operators.map((operator) => (
                            <option key={getOperatorIdValue(operator)} value={getOperatorIdValue(operator)}>
                                {operator.companyName} · #{getOperatorIdValue(operator)}
                            </option>
                        ))}
                    </Select>
                    <button aria-label={pl.superAdmin.audit.refresh} className="super-admin-icon-button" disabled={loading} onClick={loadEntries} type="button">
                        <Refresh fontSize="small" />
                    </button>
                </div>
            </div>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <div className="super-admin-directory-table super-admin-member-table">
                <div className="super-admin-directory-row super-admin-directory-head super-admin-audit-row">
                    <span>{pl.superAdmin.audit.time}</span>
                    <span>{pl.superAdmin.audit.owner}</span>
                    <span>{pl.superAdmin.audit.operator}</span>
                    <span>{pl.superAdmin.audit.action}</span>
                    <span>{pl.superAdmin.audit.result}</span>
                </div>
                {entries.map((entry) => (
                    <div className="super-admin-directory-row super-admin-audit-row" key={entry.id}>
                        <span className="super-admin-audit-time">{formatTime(entry.createdAt)}</span>
                        <span className="super-admin-member-name">
                            <strong>@{entry.platformOwnerUsername}</strong>
                            <small>{entry.impersonation ? pl.superAdmin.audit.impersonation : pl.superAdmin.audit.panel}</small>
                        </span>
                        <span>{operatorLabel(entry)}</span>
                        <span className="super-admin-audit-action">
                            <em className={`super-admin-audit-method super-admin-audit-method-${entry.httpMethod.toLowerCase()}`}>{entry.httpMethod}</em>
                            <code title={entry.path}>{entry.path}</code>
                        </span>
                        <span className={`super-admin-member-role ${entry.success ? "super-admin-member-role-supplier" : "super-admin-member-role-admin"}`}>
                            {entry.success ? pl.superAdmin.audit.success : pl.superAdmin.audit.failure} · {entry.statusCode}
                        </span>
                    </div>
                ))}
                {!loading && !entries.length ? <div className="super-admin-directory-empty">{pl.superAdmin.audit.empty}</div> : null}
            </div>
        </section>
    );
}

export default PlatformAuditPanel;
