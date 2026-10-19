import React, {useEffect, useState} from "react";
import {Typography} from "components/ui";
import {WorkspacePremium} from "components/ui/icons";
import SubscriptionService from "../../hooks/SubscriptionService";
import pl from "../../i18n/translate";
import {CurrentSubscription, formatSubscriptionDate} from "./model/Subscription";
import "./styles/subscription.css";

function OperatorPlanSection() {
    const texts = pl.subscription.profile;
    const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;
        SubscriptionService.getCurrent()
            .then((currentSubscription) => {
                if (active) {
                    setSubscription(currentSubscription);
                }
            })
            .catch(() => {
                if (active) {
                    setError(true);
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });
        return () => {
            active = false;
        };
    }, []);

    const renderContent = () => {
        if (loading) {
            return <p className="operator-plan-message">{texts.loading}</p>;
        }
        if (error || !subscription) {
            return <p className="operator-plan-message" role="alert">{texts.loadError}</p>;
        }
        if (subscription.status === "NOT_ASSIGNED" || !subscription.plan) {
            return <p className="operator-plan-message">{texts.notAssigned}</p>;
        }
        return (
            <>
                <div className="user-profile-details">
                    <div className="user-profile-detail">
                        <span>{texts.plan}</span>
                        <strong>{(pl.subscription.plans as Record<string, string>)[subscription.plan] || subscription.plan}</strong>
                    </div>
                    <div className="user-profile-detail">
                        <span>{texts.status}</span>
                        <strong className={`operator-plan-status operator-plan-status-${subscription.status.toLowerCase()}`}>
                            {(texts.statuses as Record<string, string>)[subscription.status] || subscription.status}
                        </strong>
                    </div>
                    <div className="user-profile-detail">
                        <span>{texts.validFrom}</span>
                        <strong>{formatSubscriptionDate(subscription.startDate, pl.common.locale) || pl.common.dash}</strong>
                    </div>
                    <div className="user-profile-detail">
                        <span>{texts.validTo}</span>
                        <strong>{formatSubscriptionDate(subscription.endDate, pl.common.locale) || pl.common.dash}</strong>
                    </div>
                </div>
                <p className="operator-plan-message">{texts.renewHint}</p>
            </>
        );
    };

    return (
        <section aria-label={texts.title} className="user-profile-panel operator-plan-panel">
            <div className="user-profile-panel-header">
                <span><WorkspacePremium fontSize="small" /> {texts.kicker}</span>
                <Typography variant="h5">{texts.title}</Typography>
            </div>
            {renderContent()}
        </section>
    );
}

export default OperatorPlanSection;
