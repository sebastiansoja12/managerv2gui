import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Alert, Dialog, DialogActions, DialogContent, DialogTitle} from "components/ui";
import {Block, CheckCircle, Logout, Refresh, Shield, SupportAgent} from "components/ui/icons";
import {getBackendErrorMessage} from "../../../api/errorMessage";
import OperatorAdministrationService from "../../../hooks/OperatorAdministrationService";
import pl from "../../../i18n/translate";
import {Operator} from "../../Operators/model/Operator";
import {User} from "../../Users/model/User";
import {getOperatorIdValue} from "./operatorPanelUtils";

type OperatorAccessPanelProps = {
    operator: Operator;
    users: User[];
    onChangeStatus: (status: "ACTIVE" | "INACTIVE") => Promise<void>;
    onImpersonate: () => void;
};

type PendingAction = "block" | "unblock" | "revoke" | null;

const privilegedRoles: User["role"][] = ["SUPERADMIN", "ADMIN"];

function OperatorAccessPanel({operator, users, onChangeStatus, onImpersonate}: OperatorAccessPanelProps) {
    const texts = pl.superAdmin.operatorAccess;
    const operatorId = getOperatorIdValue(operator);
    const active = operator.status === "ACTIVE";
    const [activeSessions, setActiveSessions] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [working, setWorking] = useState(false);

    const administrators = useMemo(() => users
        .filter((user) => privilegedRoles.includes(user.role) && !user.deleted)
        .sort((left, right) => privilegedRoles.indexOf(left.role) - privilegedRoles.indexOf(right.role)), [users]);

    const loadAccess = useCallback(() => {
        setLoading(true);
        setError("");
        OperatorAdministrationService.getAccess(operatorId)
            .then((access) => setActiveSessions(access.activeSessions))
            .catch((requestError) => setError(getBackendErrorMessage(requestError, texts.loadError)))
            .finally(() => setLoading(false));
    }, [operatorId, texts.loadError]);

    useEffect(() => {
        setNotice("");
        loadAccess();
    }, [loadAccess]);

    const confirm = async () => {
        if (!pendingAction) {
            return;
        }
        setWorking(true);
        setError("");
        try {
            if (pendingAction === "revoke") {
                await OperatorAdministrationService.revokeSessions(operatorId);
                setNotice(texts.revoked);
                loadAccess();
            } else {
                await onChangeStatus(pendingAction === "block" ? "INACTIVE" : "ACTIVE");
                setNotice(pendingAction === "block" ? texts.blocked : texts.unblocked);
            }
            setPendingAction(null);
        } catch (requestError) {
            setError(getBackendErrorMessage(requestError, texts.saveError));
        } finally {
            setWorking(false);
        }
    };

    const dialogTitle = pendingAction === "revoke" ? texts.revokeTitle
        : pendingAction === "block" ? texts.blockTitle : texts.unblockTitle;
    const dialogDescription = pendingAction === "revoke" ? texts.revokeDescription
        : pendingAction === "block" ? texts.blockDescription : texts.unblockDescription;

    return (
        <div className="super-admin-configuration-workspace super-admin-operator-access">
            <div className="super-admin-directory-list-header">
                <div><strong>{texts.title}</strong><span>{texts.subtitle}</span></div>
                <button aria-label={texts.refresh} className="super-admin-icon-button" disabled={loading} onClick={loadAccess} type="button">
                    <Refresh fontSize="small" />
                </button>
            </div>

            {error ? <Alert severity="error">{error}</Alert> : null}
            {notice ? <Alert severity="success">{notice}</Alert> : null}

            <div className="super-admin-access-grid">
                <article className={`super-admin-access-card ${active ? "is-active" : "is-blocked"}`}>
                    <span className="super-admin-access-card-label">{texts.status}</span>
                    <strong>{active ? texts.statusActive : texts.statusBlocked}</strong>
                    <p>{active ? texts.statusActiveHint : texts.statusBlockedHint}</p>
                    <button
                        className={active ? "super-admin-danger-button super-admin-compact-button" : "super-admin-primary-button super-admin-compact-button"}
                        onClick={() => setPendingAction(active ? "block" : "unblock")}
                        type="button"
                    >
                        {active ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                        <span>{active ? texts.block : texts.unblock}</span>
                    </button>
                </article>

                <article className="super-admin-access-card">
                    <span className="super-admin-access-card-label">{texts.sessions}</span>
                    <strong data-testid="operator-active-sessions">{loading || activeSessions === null ? pl.common.dash : activeSessions}</strong>
                    <p>{texts.sessionsHint}</p>
                    <button
                        className="super-admin-secondary-button super-admin-compact-button"
                        disabled={loading || !activeSessions}
                        onClick={() => setPendingAction("revoke")}
                        type="button"
                    >
                        <Logout fontSize="small" /><span>{texts.revoke}</span>
                    </button>
                </article>

                <article className="super-admin-access-card">
                    <span className="super-admin-access-card-label">{texts.support}</span>
                    <strong>{pl.superAdmin.impersonation.action}</strong>
                    <p>{texts.supportHint}</p>
                    <button className="super-admin-secondary-button super-admin-compact-button super-admin-impersonate-button" onClick={onImpersonate} type="button">
                        <SupportAgent fontSize="small" /><span>{pl.superAdmin.impersonation.action}</span>
                    </button>
                </article>
            </div>

            <div className="super-admin-directory-list">
                <div className="super-admin-directory-list-header">
                    <div><strong>{texts.administrators}</strong><span>{administrators.length} · {pl.superAdmin.workspace.records}</span></div>
                </div>
                <div className="super-admin-directory-table super-admin-member-table">
                    {administrators.map((user) => (
                        <div className="super-admin-directory-row super-admin-access-admin-row" key={String(user.userId?.value)}>
                            <span className="super-admin-member-name">
                                <strong><Shield fontSize="small" /> {`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username}</strong>
                                <small>@{user.username}</small>
                            </span>
                            <span className={`super-admin-member-role super-admin-member-role-${user.role.toLowerCase()}`}>{pl.usersManagement.roles[user.role] || user.role}</span>
                            <span className="super-admin-member-email" title={user.email}>{user.email || pl.common.dash}</span>
                        </div>
                    ))}
                    {!administrators.length ? <div className="super-admin-directory-empty">{texts.administratorsEmpty}</div> : null}
                </div>
            </div>

            <Dialog className="super-admin-dialog" fullWidth maxWidth="sm" open={Boolean(pendingAction)} onClose={working ? undefined : () => setPendingAction(null)}>
                <DialogTitle>{dialogTitle}</DialogTitle>
                <DialogContent>
                    <p className="super-admin-impersonation-description">
                        {dialogDescription.replace("{operator}", `${operator.companyName} (#${operatorId})`)}
                    </p>
                </DialogContent>
                <DialogActions>
                    <button className="super-admin-secondary-button" disabled={working} onClick={() => setPendingAction(null)} type="button">{texts.cancel}</button>
                    <button className={pendingAction === "unblock" ? "super-admin-primary-button" : "super-admin-danger-button"} disabled={working} onClick={() => void confirm()} type="button">
                        {working ? texts.working : texts.confirm}
                    </button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default OperatorAccessPanel;
