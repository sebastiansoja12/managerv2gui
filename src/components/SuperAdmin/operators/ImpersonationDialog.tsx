import React, {useCallback, useEffect, useState} from "react";
import axios from "axios";
import {Alert, Dialog, DialogActions, DialogContent, DialogTitle} from "components/ui";
import {Refresh, Send, SupportAgent} from "components/ui/icons";
import {getBackendErrorMessage} from "../../../api/errorMessage";
import ImpersonationConsentService from "../../../hooks/ImpersonationConsentService";
import SuperAdminAuthService from "../../../hooks/SuperAdminAuthService";
import pl from "../../../i18n/translate";
import {formatConsentTime, ImpersonationConsent} from "../../Impersonation/model/ImpersonationConsent";

type ImpersonationDialogProps = {
    open: boolean;
    operatorId: string;
    operatorName: string;
    onClose: () => void;
};

export const IMPERSONATION_CONSENT_REFRESH_MS = 5_000;

const consentRejectionReason = (requestError: unknown): string | null => {
    if (typeof axios.isAxiosError === "function" && axios.isAxiosError(requestError) && requestError.response?.status === 403) {
        const data = requestError.response?.data as {reason?: unknown} | undefined;
        return typeof data?.reason === "string" && data.reason.startsWith("CONSENT_") ? data.reason : null;
    }
    return null;
};

function ImpersonationDialog({open, operatorId, operatorName, onClose}: ImpersonationDialogProps) {
    const texts = pl.superAdmin.impersonation;
    const [consent, setConsent] = useState<ImpersonationConsent | null>(null);
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("");
    const [requesting, setRequesting] = useState(false);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState("");

    const loadConsent = useCallback((silent = false) => {
        if (!silent) {
            setLoading(true);
        }
        return ImpersonationConsentService.getLatest(operatorId)
            .then((latest) => setConsent(latest))
            .catch((requestError) => {
                if (!silent) {
                    setError(getBackendErrorMessage(requestError, texts.consentLoadError));
                }
            })
            .finally(() => {
                if (!silent) {
                    setLoading(false);
                }
            });
    }, [operatorId, texts.consentLoadError]);

    useEffect(() => {
        if (open) {
            setError("");
            setReason("");
            setConsent(null);
            void loadConsent();
        }
    }, [loadConsent, open]);

    const status = consent?.status;

    useEffect(() => {
        if (!open || status !== "PENDING") {
            return undefined;
        }
        const timer = setInterval(() => void loadConsent(true), IMPERSONATION_CONSENT_REFRESH_MS);
        return () => clearInterval(timer);
    }, [loadConsent, open, status]);

    const requestConsent = () => {
        setRequesting(true);
        setError("");
        ImpersonationConsentService.request(operatorId, reason)
            .then((requested) => setConsent(requested))
            .catch((requestError) => setError(getBackendErrorMessage(requestError, texts.requestError)))
            .finally(() => setRequesting(false));
    };

    const start = () => {
        setStarting(true);
        setError("");
        SuperAdminAuthService.startImpersonation(operatorId)
            .then(() => {
                window.open("/", "_blank", "noopener");
                onClose();
            })
            .catch((requestError) => {
                if (consentRejectionReason(requestError)) {
                    setError(texts.notConsented);
                    void loadConsent(true);
                    return;
                }
                setError(getBackendErrorMessage(requestError, texts.error));
            })
            .finally(() => setStarting(false));
    };

    const busy = starting || requesting;
    const approved = status === "APPROVED";
    const canRequest = !loading && status !== "PENDING" && !approved;
    const locale = pl.common.locale;

    const statusMessage = () => {
        if (!consent) {
            return null;
        }
        const decidedBy = consent.decidedByUsername ? `@${consent.decidedByUsername}` : pl.common.dash;
        switch (consent.status) {
            case "PENDING":
                return (
                    <Alert severity="info">
                        {texts.pending
                            .replace("{time}", formatConsentTime(consent.requestedAt, locale))
                            .replace("{expires}", formatConsentTime(consent.requestExpiresAt, locale))}
                    </Alert>
                );
            case "APPROVED":
                return (
                    <Alert severity="success">
                        {texts.approved.replace("{user}", decidedBy).replace("{time}", formatConsentTime(consent.accessExpiresAt, locale))}
                    </Alert>
                );
            case "REJECTED":
                return <Alert severity="error">{texts.rejected.replace("{user}", decidedBy)}</Alert>;
            case "REVOKED":
                return <Alert severity="warning">{texts.revoked.replace("{user}", decidedBy)}</Alert>;
            default:
                return <Alert severity="warning">{texts.expired}</Alert>;
        }
    };

    return (
        <Dialog className="super-admin-dialog" fullWidth maxWidth="sm" open={open} onClose={busy ? undefined : onClose}>
            <DialogTitle>{texts.confirmTitle}</DialogTitle>
            <DialogContent>
                <div className="super-admin-impersonation-consent">
                    {error ? <Alert severity="error">{error}</Alert> : null}
                    <p className="super-admin-impersonation-description">
                        {texts.confirmDescription.replace("{operator}", `${operatorName} (#${operatorId})`)}
                    </p>
                    <div className="super-admin-impersonation-consent-head">
                        <strong>{texts.consentTitle}</strong>
                        <button aria-label={texts.refresh} className="super-admin-icon-button" disabled={loading || busy} onClick={() => void loadConsent()} type="button">
                            <Refresh fontSize="small" />
                        </button>
                    </div>
                    {loading ? <p className="super-admin-impersonation-consent-hint">{texts.consentLoading}</p> : statusMessage()}
                    {canRequest ? (
                        <>
                            <p className="super-admin-impersonation-consent-hint">{texts.consentRequired}</p>
                            <label className="super-admin-impersonation-consent-reason">
                                <span>{texts.reasonLabel}</span>
                                <textarea
                                    disabled={busy}
                                    maxLength={500}
                                    onChange={(event) => setReason(event.target.value)}
                                    placeholder={texts.reasonPlaceholder}
                                    rows={2}
                                    value={reason}
                                />
                            </label>
                        </>
                    ) : null}
                </div>
            </DialogContent>
            <DialogActions>
                <button className="super-admin-secondary-button" disabled={busy} onClick={onClose} type="button">
                    {texts.cancel}
                </button>
                {canRequest ? (
                    <button className="super-admin-secondary-button" disabled={busy} onClick={requestConsent} type="button">
                        <Send fontSize="small" />
                        <span>{requesting ? texts.requesting : texts.requestConsent}</span>
                    </button>
                ) : null}
                <button className="super-admin-primary-button" disabled={busy || !approved} onClick={start} type="button">
                    <SupportAgent fontSize="small" />
                    <span>{starting ? texts.starting : texts.confirm}</span>
                </button>
            </DialogActions>
        </Dialog>
    );
}

export default ImpersonationDialog;
