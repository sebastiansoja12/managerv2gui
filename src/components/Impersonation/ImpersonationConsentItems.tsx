import React, {useState} from "react";
import {getBackendErrorMessage} from "../../api/errorMessage";
import pl from "../../i18n/translate";
import {
    approveImpersonationConsent,
    rejectImpersonationConsent,
    revokeImpersonationConsent,
} from "./impersonationConsentStore";
import {
    DEFAULT_IMPERSONATION_ACCESS_DURATION,
    formatConsentTime,
    IMPERSONATION_ACCESS_DURATIONS,
    ImpersonationConsent,
} from "./model/ImpersonationConsent";

type ConsentItemProps = {
    consent: ImpersonationConsent;
    compact?: boolean;
};

const ownerLabel = (consent: ImpersonationConsent) => (
    consent.platformOwnerUsername ? `@${consent.platformOwnerUsername}` : pl.impersonationConsent.unknownOwner
);

export function ImpersonationConsentRequestItem({consent, compact = false}: ConsentItemProps) {
    const texts = pl.impersonationConsent;
    const [duration, setDuration] = useState<number>(DEFAULT_IMPERSONATION_ACCESS_DURATION);
    const [working, setWorking] = useState(false);
    const [error, setError] = useState("");

    const decide = (action: () => Promise<unknown>) => {
        setWorking(true);
        setError("");
        action()
            .catch((requestError) => setError(getBackendErrorMessage(requestError, texts.error)))
            .finally(() => setWorking(false));
    };

    const durationId = `impersonation-consent-duration-${consent.id}${compact ? "-compact" : ""}`;

    return (
        <div className={`impersonation-consent-item${compact ? " is-compact" : ""}`}>
            <div className="impersonation-consent-copy">
                <strong>{texts.requestTitle}</strong>
                <span>{texts.requestDescription.replace("{owner}", ownerLabel(consent))}</span>
                {consent.reason ? <span className="impersonation-consent-reason">{texts.reason.replace("{reason}", consent.reason)}</span> : null}
                <small>{texts.requestExpires.replace("{time}", formatConsentTime(consent.requestExpiresAt, pl.common.locale))}</small>
                {error ? <small className="impersonation-consent-error" role="alert">{error}</small> : null}
            </div>
            <div className="impersonation-consent-actions">
                <label className="impersonation-consent-duration" htmlFor={durationId}>
                    <span>{texts.duration}</span>
                    <select
                        disabled={working}
                        id={durationId}
                        onChange={(event) => setDuration(Number(event.target.value))}
                        value={duration}
                    >
                        {IMPERSONATION_ACCESS_DURATIONS.map((minutes) => (
                            <option key={minutes} value={minutes}>{texts.durations[String(minutes) as keyof typeof texts.durations]}</option>
                        ))}
                    </select>
                </label>
                <button
                    className="impersonation-consent-approve"
                    disabled={working}
                    onClick={() => decide(() => approveImpersonationConsent(consent.id, duration))}
                    type="button"
                >
                    {texts.approve}
                </button>
                <button
                    className="impersonation-consent-reject"
                    disabled={working}
                    onClick={() => decide(() => rejectImpersonationConsent(consent.id))}
                    type="button"
                >
                    {texts.reject}
                </button>
            </div>
        </div>
    );
}

export function ImpersonationConsentActiveItem({consent, compact = false}: ConsentItemProps) {
    const texts = pl.impersonationConsent;
    const [working, setWorking] = useState(false);
    const [error, setError] = useState("");

    const revoke = () => {
        setWorking(true);
        setError("");
        revokeImpersonationConsent(consent.id)
            .catch((requestError) => setError(getBackendErrorMessage(requestError, texts.error)))
            .finally(() => setWorking(false));
    };

    return (
        <div className={`impersonation-consent-item is-active${compact ? " is-compact" : ""}`}>
            <div className="impersonation-consent-copy">
                <strong>{texts.activeTitle}</strong>
                <span>
                    {texts.activeDescription
                        .replace("{owner}", ownerLabel(consent))
                        .replace("{time}", formatConsentTime(consent.accessExpiresAt, pl.common.locale))}
                </span>
                {error ? <small className="impersonation-consent-error" role="alert">{error}</small> : null}
            </div>
            <div className="impersonation-consent-actions">
                <button className="impersonation-consent-reject" disabled={working} onClick={revoke} type="button">
                    {texts.revoke}
                </button>
            </div>
        </div>
    );
}
