import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Button} from "components/ui";
import {CheckCircle, Close} from "components/ui/icons";
import pl from "../../i18n/translate";
import {getTabTitle} from "../AppShell/tabConfig";
import {AppTabDefinition} from "../AppShell/types";
import {subscribeOnboardingEvents} from "./onboardingEvents";
import {
    nextProgress,
    readTutorialProgress,
    storeTutorialProgress,
    TutorialProgress,
    tutorialStepsFor,
} from "./tutorialSteps";
import {useAuthState} from "../../auth/AuthState";

type TargetRect = {
    top: number;
    left: number;
    width: number;
    height: number;
};

type TutorialGuideProps = {
    userKey: string;
    onOpenTab: (tab: AppTabDefinition) => void;
    onComplete: () => void;
    onSkip: () => void;
};

const TARGET_PADDING = 6;
const TARGET_REFRESH_MS = 400;

const findVisibleTarget = (target: string): TargetRect | null => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`));
    for (const element of elements) {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            return {
                top: rect.top - TARGET_PADDING,
                left: rect.left - TARGET_PADDING,
                width: rect.width + TARGET_PADDING * 2,
                height: rect.height + TARGET_PADDING * 2,
            };
        }
    }
    return null;
};

const sameRect = (first: TargetRect | null, second: TargetRect | null) => (
    first === second || (Boolean(first) && Boolean(second)
        && first!.top === second!.top && first!.left === second!.left
        && first!.width === second!.width && first!.height === second!.height)
);

function TutorialGuide({userKey, onOpenTab, onComplete, onSkip}: TutorialGuideProps) {
    const {user} = useAuthState();
    const tutorialSteps = useMemo(() => tutorialStepsFor(user?.role), [user?.role]);
    const [progress, setProgress] = useState<TutorialProgress>(() => readTutorialProgress(userKey, tutorialSteps));
    const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
    const [lastCompletedStep, setLastCompletedStep] = useState<string | null>(null);
    const progressRef = useRef<TutorialProgress>(progress);
    const finished = progress.stepIndex >= tutorialSteps.length;
    const step = tutorialSteps[Math.min(progress.stepIndex, tutorialSteps.length - 1)];
    const stepTranslations = pl.onboarding.tutorial.steps[step.id];
    const lastStep = progress.stepIndex === tutorialSteps.length - 1;
    const stepPath = step.path?.(progress);

    useEffect(() => {
        storeTutorialProgress(userKey, progress);
    }, [progress, userKey]);

    useEffect(() => {
        if (finished) {
            onComplete();
        }
    }, [finished, onComplete]);

    useEffect(() => {
        progressRef.current = progress;
    }, [progress]);

    useEffect(() => subscribeOnboardingEvents((event) => {
        const currentProgress = progressRef.current;
        const updatedProgress = nextProgress(tutorialSteps, currentProgress, event);
        if (updatedProgress !== currentProgress) {
            progressRef.current = updatedProgress;
            setLastCompletedStep(tutorialSteps[currentProgress.stepIndex].id);
            setProgress(updatedProgress);
        }
    }), [tutorialSteps]);

    useEffect(() => {
        if (!step.target) {
            setTargetRect(null);
            return;
        }

        const target = step.target;
        const refreshTarget = () => {
            const nextRect = findVisibleTarget(target);
            setTargetRect((currentRect) => sameRect(currentRect, nextRect) ? currentRect : nextRect);
        };
        refreshTarget();
        const interval = window.setInterval(refreshTarget, TARGET_REFRESH_MS);
        window.addEventListener("resize", refreshTarget);
        window.addEventListener("scroll", refreshTarget, true);
        return () => {
            window.clearInterval(interval);
            window.removeEventListener("resize", refreshTarget);
            window.removeEventListener("scroll", refreshTarget, true);
        };
    }, [step.target]);

    const openPath = useCallback((path?: string) => {
        if (path) {
            onOpenTab({label: getTabTitle(path), path});
        }
    }, [onOpenTab]);

    const goToStep = (stepIndex: number) => {
        const updatedProgress = {...progress, stepIndex};
        setLastCompletedStep(null);
        setProgress(updatedProgress);
        openPath(tutorialSteps[stepIndex].path?.(updatedProgress));
    };

    const goForward = () => {
        if (lastStep) {
            onComplete();
            return;
        }
        goToStep(progress.stepIndex + 1);
    };

    const completedMessage = lastCompletedStep
        ? pl.onboarding.tutorial.completedSteps[lastCompletedStep as keyof typeof pl.onboarding.tutorial.completedSteps]
        : undefined;

    if (finished) {
        return null;
    }

    return (
        <>
            {targetRect ? (
                <div
                    aria-hidden="true"
                    className="onboarding-spotlight"
                    data-testid="onboarding-spotlight"
                    style={{
                        top: targetRect.top,
                        left: targetRect.left,
                        width: targetRect.width,
                        height: targetRect.height,
                    }}
                />
            ) : null}
            <aside
                aria-label={pl.onboarding.tutorial.ariaLabel}
                aria-live="polite"
                className={`onboarding-guide${step.id === "welcome" ? " onboarding-guide-centered" : ""}`}
                role="dialog"
            >
                <header className="onboarding-guide-header">
                    <span className="onboarding-guide-counter">
                        {pl.onboarding.tutorial.counter
                            .replace("{current}", String(progress.stepIndex + 1))
                            .replace("{total}", String(tutorialSteps.length))}
                    </span>
                    <button
                        aria-label={pl.onboarding.tutorial.skipTutorial}
                        className="onboarding-guide-close"
                        onClick={onSkip}
                        title={pl.onboarding.tutorial.skipTutorial}
                        type="button"
                    >
                        <Close fontSize="small" />
                    </button>
                </header>
                <div className="onboarding-guide-progress" aria-hidden="true">
                    <span style={{width: `${((progress.stepIndex + 1) / tutorialSteps.length) * 100}%`}} />
                </div>
                {completedMessage ? (
                    <p className="onboarding-guide-success">
                        <CheckCircle fontSize="small" />
                        <span>{completedMessage}</span>
                    </p>
                ) : null}
                <h2 className="onboarding-guide-title">{stepTranslations.title}</h2>
                <p className="onboarding-guide-description">{stepTranslations.description}</p>
                {step.completedBy ? (
                    <p className="onboarding-guide-task">
                        <span className="onboarding-guide-task-pulse" aria-hidden="true" />
                        <span>{pl.onboarding.tutorial.waiting}</span>
                    </p>
                ) : null}
                <footer className="onboarding-guide-actions">
                    {progress.stepIndex > 0 && !step.completedBy ? (
                        <Button onClick={() => goToStep(progress.stepIndex - 1)} variant="text">
                            {pl.onboarding.tutorial.back}
                        </Button>
                    ) : null}
                    {stepPath ? (
                        <Button onClick={() => openPath(stepPath)} variant="outlined">
                            {pl.onboarding.tutorial.openScreen}
                        </Button>
                    ) : null}
                    {step.completedBy ? (
                        <Button onClick={goForward} variant="text">{pl.onboarding.tutorial.skipStep}</Button>
                    ) : (
                        <Button onClick={goForward}>
                            {lastStep
                                ? pl.onboarding.tutorial.finish
                                : step.id === "welcome" ? pl.onboarding.tutorial.start : pl.onboarding.tutorial.next}
                        </Button>
                    )}
                </footer>
            </aside>
        </>
    );
}

export default TutorialGuide;
