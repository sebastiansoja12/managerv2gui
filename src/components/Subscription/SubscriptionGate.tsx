import React, {useCallback, useEffect, useState} from "react";
import {Logout, Refresh, WorkspacePremium} from "components/ui/icons";
import {logoutAuthSession} from "../../auth/AuthSession";
import {useAuthState} from "../../auth/AuthState";
import SubscriptionService from "../../hooks/SubscriptionService";
import pl from "../../i18n/translate";
import {CurrentSubscription, formatSubscriptionDate} from "./model/Subscription";
import {clearInactiveSubscription, reportInactiveSubscription, useSubscriptionState} from "./subscriptionStore";
import "../Maintenance/styles/maintenance.css";
import "./styles/subscription.css";

type SubscriptionGateProps = {
    children: React.ReactNode;
};

const resolveSubscription = async () => {
    const subscription = await SubscriptionService.getCurrent();
    if (subscription.accessAllowed) {
        clearInactiveSubscription();
        return;
    }
    reportInactiveSubscription(subscription);
};

const describeSubscription = (subscription: CurrentSubscription | null) => {
    const texts = pl.subscription;
    const plan = subscription?.plan
        ? (texts.plans as Record<string, string>)[subscription.plan] || subscription.plan : "";
    if (subscription?.status === "EXPIRED" && subscription.endDate) {
        return {
            title: texts.expiredTitle,
            message: texts.expiredMessage.replace("{plan}", plan)
                .replace("{date}", formatSubscriptionDate(subscription.endDate, pl.common.locale)),
        };
    }
    if (subscription?.status === "NOT_STARTED" && subscription.startDate) {
        return {
            title: texts.notStartedTitle,
            message: texts.notStartedMessage.replace("{plan}", plan)
                .replace("{date}", formatSubscriptionDate(subscription.startDate, pl.common.locale)),
        };
    }
    if (subscription?.status === "NOT_ASSIGNED") {
        return {title: texts.notAssignedTitle, message: texts.notAssignedMessage};
    }
    return {title: texts.inactiveTitle, message: texts.inactiveMessage};
};

function SubscriptionGate({children}: SubscriptionGateProps) {
    const {status, user} = useAuthState();
    const subscriptionState = useSubscriptionState();
    const [checking, setChecking] = useState(false);
    const [verifiedIdentity, setVerifiedIdentity] = useState("");
    const identity = status === "authenticated" && user?.operatorId
        ? `${user.operatorId.value}:${user.userId.value}` : "";

    const check = useCallback((checkedIdentity: string) => {
        setChecking(true);
        return resolveSubscription()
            .catch(() => undefined)
            .finally(() => {
                setChecking(false);
                setVerifiedIdentity(checkedIdentity);
            });
    }, []);

    useEffect(() => {
        if (!identity) {
            clearInactiveSubscription();
            return;
        }
        void check(identity);
    }, [check, identity]);

    if (!identity) {
        return <>{children}</>;
    }

    if (!subscriptionState.blocked && verifiedIdentity !== identity) {
        return null;
    }

    if (!subscriptionState.blocked) {
        return <>{children}</>;
    }

    const {title, message} = describeSubscription(subscriptionState.subscription);

    return (
        <main className="maintenance-screen">
            <section aria-live="polite" className="maintenance-card" role="status">
                <span className="maintenance-icon"><WorkspacePremium /></span>
                <span className="maintenance-kicker">{pl.subscription.kicker}</span>
                <h1>{title}</h1>
                <p>{message}</p>
                <div className="subscription-actions">
                    <button className="maintenance-retry" disabled={checking} onClick={() => void check(identity)} type="button">
                        <Refresh fontSize="small" />
                        <span>{checking ? pl.subscription.checking : pl.subscription.retry}</span>
                    </button>
                    <button className="subscription-logout" onClick={() => void logoutAuthSession()} type="button">
                        <Logout fontSize="small" />
                        <span>{pl.subscription.logout}</span>
                    </button>
                </div>
            </section>
        </main>
    );
}

export default SubscriptionGate;
