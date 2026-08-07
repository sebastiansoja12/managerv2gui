import React, {useEffect, useState} from "react";
import {SupportAgent} from "components/ui/icons";
import {logoutAuthSession} from "../../auth/AuthSession";
import ImpersonationService from "../../hooks/ImpersonationService";
import pl from "../../i18n/translate";
import {ImpersonationInfo} from "./model/ImpersonationInfo";
import "./styles/impersonation.css";

function ImpersonationBanner() {
    const [impersonation, setImpersonation] = useState<ImpersonationInfo | null>(null);
    const [ending, setEnding] = useState(false);

    useEffect(() => {
        let mounted = true;
        ImpersonationService.getCurrent()
            .then((currentImpersonation) => {
                if (mounted) {
                    setImpersonation(currentImpersonation);
                }
            })
            .catch(() => {
                if (mounted) {
                    setImpersonation(null);
                }
            });
        return () => {
            mounted = false;
        };
    }, []);

    if (!impersonation) {
        return null;
    }

    const endSession = async () => {
        setEnding(true);
        try {
            await logoutAuthSession();
        } finally {
            window.location.assign("/super-admin/operators");
        }
    };

    return (
        <aside aria-live="polite" className="impersonation-banner" role="status">
            <SupportAgent fontSize="small" />
            <div>
                <strong>{pl.superAdmin.impersonation.bannerTitle}</strong>
                <span>{pl.superAdmin.impersonation.bannerDescription.replace("{owner}", `@${impersonation.platformOwnerUsername}`)}</span>
            </div>
            <button disabled={ending} onClick={endSession} type="button">{pl.superAdmin.impersonation.end}</button>
        </aside>
    );
}

export default ImpersonationBanner;
