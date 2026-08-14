import React, {useEffect, useRef, useState} from "react";
import {NotificationsNone} from "components/ui/icons";
import pl from "../../i18n/translate";
import {ImpersonationConsentActiveItem, ImpersonationConsentRequestItem} from "./ImpersonationConsentItems";
import {useImpersonationConsents} from "./impersonationConsentStore";
import "./styles/impersonation.css";

function ImpersonationConsentNotifications() {
    const texts = pl.impersonationConsent;
    const {pending, active} = useImpersonationConsents();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const count = pending.length;

    useEffect(() => {
        if (!open) {
            return undefined;
        }
        const closeOnOutsideInteraction = (event: PointerEvent) => {
            if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
                setOpen(false);
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };
        document.addEventListener("pointerdown", closeOnOutsideInteraction);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("pointerdown", closeOnOutsideInteraction);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [open]);

    const label = count ? texts.notificationsCount.replace("{count}", String(count)) : pl.navigation.notifications;

    return (
        <div className="top-nav-notifications-control" ref={containerRef}>
            <button
                aria-controls="top-nav-notifications-panel"
                aria-expanded={open}
                aria-label={label}
                className="top-nav-action-icon top-nav-notifications-icon"
                onClick={() => setOpen((current) => !current)}
                title={label}
                type="button"
            >
                <NotificationsNone fontSize="small" />
                {count ? <span aria-hidden="true" className="top-nav-notification-count">{count > 9 ? "9+" : count}</span> : null}
            </button>
            {open ? (
                <div className="top-nav-notifications-popover" id="top-nav-notifications-panel" role="dialog" aria-label={texts.notificationsTitle}>
                    <strong className="top-nav-notifications-title">{texts.notificationsTitle}</strong>
                    {pending.map((consent) => <ImpersonationConsentRequestItem compact consent={consent} key={`pending-${consent.id}`} />)}
                    {active.map((consent) => <ImpersonationConsentActiveItem compact consent={consent} key={`active-${consent.id}`} />)}
                    {!pending.length && !active.length ? <p className="top-nav-notifications-empty">{texts.notificationsEmpty}</p> : null}
                </div>
            ) : null}
        </div>
    );
}

export default ImpersonationConsentNotifications;
