import React, {FormEvent, useCallback, useEffect, useState} from "react";
import axios from "axios";
import {Alert, Dialog, DialogActions, DialogContent, DialogTitle} from "components/ui";
import {DeleteOutline, Download} from "components/ui/icons";
import {getBackendErrorMessage} from "../../../api/errorMessage";
import OperatorOperationsService from "../../../hooks/OperatorOperationsService";
import pl from "../../../i18n/translate";
import {Operator} from "../../Operators/model/Operator";
import {OperatorDataErasure} from "./model/OperatorOperations";
import {getOperatorIdValue} from "./operatorPanelUtils";

type OperatorPrivacyPanelProps = {
    operator: Operator;
    onErased?: () => void;
};

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return pl.common.dash;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString(pl.common.locale);
};

const erasureReason = (requestError: unknown): string | null => {
    if (typeof axios.isAxiosError === "function" && axios.isAxiosError(requestError)) {
        const data = requestError.response?.data as {reason?: unknown} | undefined;
        return typeof data?.reason === "string" ? data.reason : null;
    }
    return null;
};

function OperatorPrivacyPanel({operator, onErased}: OperatorPrivacyPanelProps) {
    const texts = pl.superAdmin.privacy;
    const operatorId = getOperatorIdValue(operator);
    const blocked = operator.status === "INACTIVE";
    const [lastErasure, setLastErasure] = useState<OperatorDataErasure | null>(null);
    const [exporting, setExporting] = useState(false);
    const [erasing, setErasing] = useState(false);
    const [confirmation, setConfirmation] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const loadErasure = useCallback(() => {
        OperatorOperationsService.getLastErasure(operatorId)
            .then(setLastErasure)
            .catch(() => setLastErasure(null));
    }, [operatorId]);

    useEffect(() => {
        setConfirmation("");
        setError("");
        setNotice("");
        loadErasure();
    }, [loadErasure]);

    const exportData = () => {
        setExporting(true);
        setError("");
        setNotice("");
        OperatorOperationsService.downloadExport(operatorId)
            .then((fileName) => setNotice(texts.exported.replace("{file}", fileName)))
            .catch((requestError) => setError(getBackendErrorMessage(requestError, texts.exportError)))
            .finally(() => setExporting(false));
    };

    const confirmationMatches = confirmation.trim() === operator.companyName;

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (blocked && confirmationMatches) {
            setConfirmOpen(true);
        }
    };

    const erase = () => {
        setErasing(true);
        setError("");
        setNotice("");
        OperatorOperationsService.eraseData(operatorId, confirmation.trim())
            .then((erasure) => {
                setLastErasure(erasure);
                setConfirmation("");
                setConfirmOpen(false);
                setNotice(texts.erased);
                onErased?.();
            })
            .catch((requestError) => {
                const reason = erasureReason(requestError);
                setError(reason && (texts.errors as Record<string, string>)[reason]
                    ? (texts.errors as Record<string, string>)[reason]
                    : getBackendErrorMessage(requestError, texts.eraseError));
                setConfirmOpen(false);
            })
            .finally(() => setErasing(false));
    };

    return (
        <div className="super-admin-configuration-workspace super-admin-operator-privacy">
            <div className="super-admin-directory-list-header">
                <div><strong>{texts.title}</strong><span>{texts.subtitle}</span></div>
            </div>

            {error ? <Alert severity="error">{error}</Alert> : null}
            {notice ? <Alert severity="success">{notice}</Alert> : null}

            <article className="super-admin-access-card super-admin-privacy-card">
                <span className="super-admin-access-card-label">{texts.exportTitle}</span>
                <p>{texts.exportScope}</p>
                <button className="super-admin-primary-button super-admin-compact-button" disabled={exporting} onClick={exportData} type="button">
                    <Download fontSize="small" /><span>{exporting ? texts.exporting : texts.export}</span>
                </button>
            </article>

            <form className="super-admin-access-card super-admin-privacy-card is-blocked" onSubmit={submit}>
                <span className="super-admin-access-card-label">{texts.erasureTitle}</span>
                <p>{texts.erasureScope}</p>
                {!blocked ? <Alert severity="warning">{texts.requiresBlocked}</Alert> : null}
                <label className="super-admin-privacy-confirmation">
                    <span>{texts.confirmationLabel.replace("{company}", operator.companyName)}</span>
                    <input
                        autoComplete="off"
                        disabled={!blocked || erasing}
                        onChange={(event) => setConfirmation(event.target.value)}
                        value={confirmation}
                    />
                </label>
                <button className="super-admin-danger-button" disabled={!blocked || !confirmationMatches || erasing} type="submit">
                    <DeleteOutline fontSize="small" /><span>{texts.erase}</span>
                </button>
                {lastErasure ? (
                    <small className="super-admin-privacy-last">
                        {texts.lastErasure.replace("{time}", formatDateTime(lastErasure.executedAt)).replace("{user}", `@${lastErasure.requestedBy}`)}
                        {" · "}
                        {texts.lastErasureCounts
                            .replace("{users}", String(lastErasure.usersAnonymized))
                            .replace("{couriers}", String(lastErasure.couriersAnonymized))
                            .replace("{devices}", String(lastErasure.devicesRetired))}
                    </small>
                ) : null}
            </form>

            <Dialog className="super-admin-dialog" fullWidth maxWidth="sm" open={confirmOpen} onClose={erasing ? undefined : () => setConfirmOpen(false)}>
                <DialogTitle>{texts.eraseTitle}</DialogTitle>
                <DialogContent>
                    <p className="super-admin-impersonation-description">{texts.eraseDescription.replace("{operator}", `${operator.companyName} (#${operatorId})`)}</p>
                </DialogContent>
                <DialogActions>
                    <button className="super-admin-secondary-button" disabled={erasing} onClick={() => setConfirmOpen(false)} type="button">{texts.cancel}</button>
                    <button className="super-admin-danger-button" disabled={erasing} onClick={erase} type="button">
                        {erasing ? texts.erasing : texts.erase}
                    </button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default OperatorPrivacyPanel;
