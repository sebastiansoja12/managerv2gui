import http from "../http-common";
import superAdminHttp from "../http-super-admin";
import {ImpersonationConsent} from "../components/Impersonation/model/ImpersonationConsent";

const asList = (data: unknown): ImpersonationConsent[] => (Array.isArray(data) ? data as ImpersonationConsent[] : []);

const getPending = () => (
    http.get<ImpersonationConsent[]>("/impersonation-consents/pending").then((response) => asList(response.data))
);

const getActive = () => (
    http.get<ImpersonationConsent[]>("/impersonation-consents/active").then((response) => asList(response.data))
);

const approve = (consentId: number | string, durationMinutes: number) => (
    http.post<ImpersonationConsent>(`/impersonation-consents/${consentId}/approve`, {durationMinutes})
        .then((response) => response.data)
);

const reject = (consentId: number | string) => (
    http.post<ImpersonationConsent>(`/impersonation-consents/${consentId}/reject`).then((response) => response.data)
);

const revoke = (consentId: number | string) => (
    http.post<ImpersonationConsent>(`/impersonation-consents/${consentId}/revoke`).then((response) => response.data)
);

const request = (operatorId: number | string, reason: string) => (
    superAdminHttp.post<ImpersonationConsent>(`/operators/${operatorId}/impersonation-consents`, {reason: reason.trim() || null})
        .then((response) => response.data)
);

const getLatest = (operatorId: number | string) => (
    superAdminHttp.get<ImpersonationConsent | "">(`/operators/${operatorId}/impersonation-consents/latest`)
        .then((response) => (response.status === 200 && response.data ? response.data : null))
);

const ImpersonationConsentService = {
    getPending,
    getActive,
    approve,
    reject,
    revoke,
    request,
    getLatest,
};

export default ImpersonationConsentService;
