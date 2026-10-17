import React, {useCallback, useEffect, useState} from "react";
import {CheckCircle, ExpandMore, KeyboardArrowUp} from "components/ui/icons";
import OperatorOperationsService from "../../../hooks/OperatorOperationsService";
import pl from "../../../i18n/translate";
import {OnboardingStepType, OperatorOnboarding} from "./model/OperatorOperations";

type OperatorOnboardingCardProps = {
    operatorId: string;
    refreshKey?: number;
    onAddDepartment: () => void;
    onAddUser: () => void;
    onAddCourier: () => void;
    onImpersonate: () => void;
};

function OperatorOnboardingCard({
    operatorId,
    refreshKey = 0,
    onAddDepartment,
    onAddUser,
    onAddCourier,
    onImpersonate,
}: OperatorOnboardingCardProps) {
    const texts = pl.superAdmin.onboarding;
    const [onboarding, setOnboarding] = useState<OperatorOnboarding | null>(null);
    const [error, setError] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const load = useCallback(() => {
        setError(false);
        OperatorOperationsService.getOnboarding(operatorId)
            .then((loaded) => {
                setOnboarding(loaded);
                setExpanded(!loaded.complete);
            })
            .catch(() => setError(true));
    }, [operatorId]);

    useEffect(() => {
        load();
    }, [load, refreshKey]);

    if (error) {
        return <div className="super-admin-onboarding super-admin-onboarding-error">{texts.loadError}</div>;
    }
    if (!onboarding) {
        return null;
    }

    const actions: Record<OnboardingStepType, () => void> = {
        DEPARTMENT: onAddDepartment,
        SUPERADMIN: onAddUser,
        GEOCODING: onImpersonate,
        COURIER: onAddCourier,
        TEST_SHIPMENT: onImpersonate,
    };
    const percent = onboarding.totalSteps ? Math.round((onboarding.completedSteps / onboarding.totalSteps) * 100) : 0;

    return (
        <section aria-label={texts.title} className={`super-admin-onboarding${onboarding.complete ? " is-complete" : ""}`}>
            <button aria-expanded={expanded} className="super-admin-onboarding-head" onClick={() => setExpanded((current) => !current)} type="button">
                <span>
                    <strong>{onboarding.complete ? texts.complete : texts.title}</strong>
                    <small>{texts.progress.replace("{done}", String(onboarding.completedSteps)).replace("{total}", String(onboarding.totalSteps))}</small>
                </span>
                <span aria-hidden="true" className="super-admin-onboarding-meter"><span style={{width: `${percent}%`}} /></span>
                {expanded ? <KeyboardArrowUp fontSize="small" /> : <ExpandMore fontSize="small" />}
            </button>
            {expanded ? (
                <ol className="super-admin-onboarding-steps">
                    {onboarding.steps.map((step) => {
                        const stepTexts = texts.steps[step.type];
                        return (
                            <li className={step.completed ? "is-done" : ""} key={step.type}>
                                {step.completed ? <CheckCircle fontSize="small" /> : <span aria-hidden="true" className="super-admin-onboarding-dot" />}
                                <span>
                                    <strong>{stepTexts.label}</strong>
                                    <small>{step.completed && step.count > 1 ? texts.count.replace("{count}", String(step.count)) : stepTexts.hint}</small>
                                </span>
                                {!step.completed ? (
                                    <button className="super-admin-secondary-button super-admin-compact-button" onClick={actions[step.type]} type="button">
                                        {stepTexts.action}
                                    </button>
                                ) : null}
                            </li>
                        );
                    })}
                </ol>
            ) : null}
        </section>
    );
}

export default OperatorOnboardingCard;
