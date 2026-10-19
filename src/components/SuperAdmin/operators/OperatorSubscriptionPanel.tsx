import React, {FormEvent, useCallback, useEffect, useState} from "react";
import {Alert, Select} from "components/ui";
import {Refresh, Save} from "components/ui/icons";
import {getBackendErrorMessage} from "../../../api/errorMessage";
import OperatorAdministrationService from "../../../hooks/OperatorAdministrationService";
import pl from "../../../i18n/translate";
import {
    formatSubscriptionDate,
    OperatorSubscription,
    SUBSCRIPTION_PLANS,
    SubscriptionPlan,
} from "../../Subscription/model/Subscription";

type OperatorSubscriptionPanelProps = {
    operatorId: string;
};

type SubscriptionDraft = {
    plan: SubscriptionPlan | "";
    startDate: string;
    endDate: string;
};

const emptyDraft: SubscriptionDraft = {plan: "", startDate: "", endDate: ""};

const toDraft = (subscription: OperatorSubscription | null): SubscriptionDraft => (
    subscription
        ? {plan: subscription.plan, startDate: subscription.startDate, endDate: subscription.endDate}
        : emptyDraft
);

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return pl.common.dash;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString(pl.common.locale);
};

function OperatorSubscriptionPanel({operatorId}: OperatorSubscriptionPanelProps) {
    const texts = pl.superAdmin.subscription;
    const [subscription, setSubscription] = useState<OperatorSubscription | null>(null);
    const [draft, setDraft] = useState<SubscriptionDraft>(emptyDraft);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const planLabel = (plan: string) => (pl.subscription.plans as Record<string, string>)[plan] || plan;
    const statusLabel = (status: string) => (texts.statuses as Record<string, string>)[status] || status;

    const loadSubscription = useCallback(() => {
        setLoading(true);
        setError("");
        return OperatorAdministrationService.getSubscription(operatorId)
            .then((loadedSubscription) => {
                setSubscription(loadedSubscription);
                setDraft(toDraft(loadedSubscription));
            })
            .catch((requestError) => setError(getBackendErrorMessage(requestError, texts.loadError)))
            .finally(() => setLoading(false));
    }, [operatorId, texts.loadError]);

    useEffect(() => {
        setNotice("");
        void loadSubscription();
    }, [loadSubscription]);

    const incomplete = !draft.plan || !draft.startDate || !draft.endDate;
    const rangeInvalid = !incomplete && draft.startDate > draft.endDate;

    const save = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!draft.plan || incomplete || rangeInvalid) {
            return;
        }
        setSaving(true);
        setError("");
        setNotice("");
        OperatorAdministrationService.assignSubscription(operatorId, {
            plan: draft.plan,
            startDate: draft.startDate,
            endDate: draft.endDate,
        })
            .then((savedSubscription) => {
                setSubscription(savedSubscription);
                setDraft(toDraft(savedSubscription));
                setNotice(texts.saved);
            })
            .catch((requestError) => setError(getBackendErrorMessage(requestError, texts.saveError)))
            .finally(() => setSaving(false));
    };

    const formHint = incomplete ? texts.required : rangeInvalid ? texts.rangeInvalid : texts.hint;

    return (
        <div className="super-admin-configuration-workspace super-admin-operator-subscription">
            <div className="super-admin-directory-list-header">
                <div><strong>{texts.title}</strong><span>{texts.subtitle}</span></div>
                <button aria-label={texts.refresh} className="super-admin-icon-button" disabled={loading} onClick={() => void loadSubscription()} type="button">
                    <Refresh fontSize="small" />
                </button>
            </div>

            {error ? <Alert severity="error">{error}</Alert> : null}
            {notice ? <Alert severity="success">{notice}</Alert> : null}

            <div className="super-admin-access-grid">
                <article className="super-admin-access-card" data-testid="operator-subscription-current">
                    <span className="super-admin-access-card-label">{texts.current}</span>
                    {subscription ? (
                        <>
                            <strong>{planLabel(subscription.plan)}</strong>
                            <span className={`super-admin-status ${subscription.status === "ACTIVE" ? "is-active" : "is-inactive"}`}>
                                {statusLabel(subscription.status)}
                            </span>
                            <p>
                                {texts.period}: {formatSubscriptionDate(subscription.startDate, pl.common.locale)} → {formatSubscriptionDate(subscription.endDate, pl.common.locale)}
                            </p>
                            {subscription.updatedAt ? (
                                <p>
                                    {texts.updated
                                        .replace("{time}", formatDateTime(subscription.updatedAt))
                                        .replace("{owner}", subscription.updatedBy || pl.common.dash)}
                                </p>
                            ) : null}
                        </>
                    ) : (
                        <p>{loading ? pl.superAdmin.workspace.loading : texts.empty}</p>
                    )}
                </article>
            </div>

            <form className="super-admin-subscription-form" onSubmit={save}>
                <label>
                    <span>{texts.plan}</span>
                    <Select
                        aria-label={texts.plan}
                        onChange={(event) => setDraft((current) => ({...current, plan: event.target.value as SubscriptionPlan | ""}))}
                        value={draft.plan}
                    >
                        <option value="">{pl.common.dash}</option>
                        {SUBSCRIPTION_PLANS.map((plan) => <option key={plan} value={plan}>{planLabel(plan)}</option>)}
                    </Select>
                </label>
                <label>
                    <span>{texts.startDate}</span>
                    <input aria-label={texts.startDate} onChange={(event) => setDraft((current) => ({...current, startDate: event.target.value}))} type="date" value={draft.startDate} />
                </label>
                <label>
                    <span>{texts.endDate}</span>
                    <input aria-label={texts.endDate} min={draft.startDate || undefined} onChange={(event) => setDraft((current) => ({...current, endDate: event.target.value}))} type="date" value={draft.endDate} />
                </label>
                <button className="super-admin-primary-button" disabled={loading || saving || incomplete || rangeInvalid} type="submit">
                    <Save fontSize="small" /><span>{saving ? texts.saving : texts.save}</span>
                </button>
            </form>
            <p className="super-admin-form-hint">{formHint}</p>
        </div>
    );
}

export default OperatorSubscriptionPanel;
