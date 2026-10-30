import React, {useCallback, useEffect, useState} from "react";
import {getBackendErrorMessage} from "../../api/errorMessage";
import {logoutAuthSession} from "../../auth/AuthSession";
import {useAuthState} from "../../auth/AuthState";
import UserOnboardingService from "../../hooks/UserOnboardingService";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "../AppShell/types";
import ConsentDialog from "./ConsentDialog";
import {ConsentType, UserOnboarding} from "./model/UserOnboarding";
import {subscribeOnboardingEvents} from "./onboardingEvents";
import TutorialGuide from "./TutorialGuide";
import {clearTutorialProgress} from "./tutorialSteps";
import "./styles/onboarding.css";

type UserOnboardingFlowProps = {
    onOpenTab: (tab: AppTabDefinition) => void;
};

function UserOnboardingFlow({onOpenTab}: UserOnboardingFlowProps) {
    const authState = useAuthState();
    const userKey = authState.user ? String(authState.user.userId?.value ?? authState.user.username) : "";
    const [onboarding, setOnboarding] = useState<UserOnboarding | null>(null);
    const [savingConsents, setSavingConsents] = useState(false);
    const [consentError, setConsentError] = useState("");
    const [tutorialSession, setTutorialSession] = useState(0);

    useEffect(() => {
        if (!userKey) {
            setOnboarding(null);
            return;
        }

        let active = true;
        const loadOnboarding = async () => {
            try {
                const response = await UserOnboardingService.get();
                if (active) {
                    setOnboarding(response.data);
                }
            } catch {
                if (active) {
                    setOnboarding(null);
                }
            }
        };
        void loadOnboarding();
        return () => {
            active = false;
        };
    }, [userKey]);

    useEffect(() => subscribeOnboardingEvents((event) => {
        if (event.type !== "tutorialRestartRequested" || !userKey) {
            return;
        }
        UserOnboardingService.restartTutorial()
            .then((response) => {
                clearTutorialProgress(userKey);
                setTutorialSession((session) => session + 1);
                setOnboarding(response.data);
            })
            .catch(() => undefined);
    }), [userKey]);

    const acceptConsents = (acceptedConsents: ConsentType[]) => {
        if (!onboarding) {
            return;
        }
        setSavingConsents(true);
        setConsentError("");
        UserOnboardingService.acceptConsents({acceptedConsents, version: onboarding.consentVersion})
            .then((response) => setOnboarding(response.data))
            .catch((error: unknown) => setConsentError(getBackendErrorMessage(error, pl.onboarding.consents.error)))
            .finally(() => setSavingConsents(false));
    };

    const finishTutorial = useCallback((request: () => ReturnType<typeof UserOnboardingService.completeTutorial>) => {
        clearTutorialProgress(userKey);
        setOnboarding((currentOnboarding) => currentOnboarding
            ? {...currentOnboarding, tutorialStatus: "COMPLETED"}
            : currentOnboarding);
        request()
            .then((response) => setOnboarding(response.data))
            .catch(() => undefined);
    }, [userKey]);

    const completeTutorial = useCallback(
        () => finishTutorial(UserOnboardingService.completeTutorial),
        [finishTutorial],
    );

    if (!onboarding) {
        return null;
    }

    if (onboarding.consentsRequired) {
        return (
            <ConsentDialog
                error={consentError}
                onAccept={acceptConsents}
                onLogout={() => void logoutAuthSession()}
                onboarding={onboarding}
                saving={savingConsents}
            />
        );
    }

    if (onboarding.tutorialStatus !== "PENDING") {
        return null;
    }

    return (
        <TutorialGuide
            key={tutorialSession}
            onComplete={completeTutorial}
            onOpenTab={onOpenTab}
            onSkip={() => finishTutorial(UserOnboardingService.skipTutorial)}
            userKey={userKey}
        />
    );
}

export default UserOnboardingFlow;
