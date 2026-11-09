import http from "../http-common";
import {AcceptConsentsRequest, UserOnboarding} from "../components/Onboarding/model/UserOnboarding";

const get = () => http.get<UserOnboarding>("/auth/me/onboarding");

const acceptConsents = (request: AcceptConsentsRequest) => (
    http.post<UserOnboarding>("/auth/me/onboarding/consents", request)
);

const completeTutorial = () => http.post<UserOnboarding>("/auth/me/onboarding/tutorial/complete");

const skipTutorial = () => http.post<UserOnboarding>("/auth/me/onboarding/tutorial/skip");

const restartTutorial = () => http.post<UserOnboarding>("/auth/me/onboarding/tutorial/restart");

const UserOnboardingService = {
    get,
    acceptConsents,
    completeTutorial,
    skipTutorial,
    restartTutorial,
};

export default UserOnboardingService;
