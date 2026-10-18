import React, {useEffect} from "react";
import {Shield} from "components/ui/icons";
import {useAuthState} from "../../auth/AuthState";
import ImpersonationService from "../../hooks/ImpersonationService";
import pl from "../../i18n/translate";
import {isSuperadministrator} from "../Users/model/UserRoleAccess";
import {ImpersonationConsentActiveItem, ImpersonationConsentRequestItem} from "./ImpersonationConsentItems";
import {
    startImpersonationConsentUpdates,
    stopImpersonationConsentUpdates,
    useImpersonationConsents,
} from "./impersonationConsentStore";
import "./styles/impersonation.css";

function ImpersonationConsentBanner() {
    const {user} = useAuthState();
    const {enabled, pending, active} = useImpersonationConsents();
    const superadministrator = isSuperadministrator(user?.role);

    useEffect(() => {
        if (!superadministrator) {
            return undefined;
        }
        let cancelled = false;
        ImpersonationService.getCurrent()
            .catch(() => null)
            .then((impersonation) => {
                if (!cancelled && !impersonation) {
                    startImpersonationConsentUpdates();
                }
            });
        return () => {
            cancelled = true;
            stopImpersonationConsentUpdates();
        };
    }, [superadministrator]);

    if (!enabled || (!pending.length && !active.length)) {
        return null;
    }

    const [firstPending, ...otherPending] = pending;

    return (
        <aside aria-label={pl.impersonationConsent.bannerLabel} aria-live="polite" className="impersonation-consent-banner" role="region">
            <Shield fontSize="small" />
            <div className="impersonation-consent-banner-body">
                {firstPending ? <ImpersonationConsentRequestItem consent={firstPending} /> : null}
                {otherPending.length ? (
                    <small className="impersonation-consent-more">
                        {pl.impersonationConsent.more.replace("{count}", String(otherPending.length))}
                    </small>
                ) : null}
                {!firstPending ? active.map((consent) => <ImpersonationConsentActiveItem consent={consent} key={consent.id} />) : null}
            </div>
        </aside>
    );
}

export default ImpersonationConsentBanner;
