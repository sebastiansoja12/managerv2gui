export type ImpersonationConsentStatus = "PENDING" | "APPROVED" | "REJECTED" | "REVOKED" | "EXPIRED";

export type ImpersonationConsent = {
    id: number | string;
    operatorId: number | string;
    platformOwnerId: number | string;
    platformOwnerUsername?: string | null;
    reason?: string | null;
    status: ImpersonationConsentStatus;
    requestedAt: string;
    requestExpiresAt: string;
    decidedByUsername?: string | null;
    decidedAt?: string | null;
    accessExpiresAt?: string | null;
};

export const IMPERSONATION_ACCESS_DURATIONS = [30, 60, 120, 240, 480] as const;

export type ImpersonationAccessDuration = typeof IMPERSONATION_ACCESS_DURATIONS[number];

export const DEFAULT_IMPERSONATION_ACCESS_DURATION: ImpersonationAccessDuration = 60;

export const formatConsentTime = (value?: string | null, locale?: string) => {
    if (!value) {
        return "";
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleTimeString(locale, {hour: "2-digit", minute: "2-digit"});
};
