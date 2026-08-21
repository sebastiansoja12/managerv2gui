export const SUBSCRIPTION_PLANS = ["MINI", "BASIC", "ENTERPRISE"] as const;

export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[number];

export type SubscriptionStatus = "NOT_STARTED" | "ACTIVE" | "EXPIRED";

export type OperatorSubscription = {
    operatorId: {value: number | string};
    plan: SubscriptionPlan;
    startDate: string;
    endDate: string;
    status: SubscriptionStatus;
    updatedBy?: string | null;
    updatedAt?: string | null;
};

export type AssignSubscriptionRequest = {
    plan: SubscriptionPlan;
    startDate: string;
    endDate: string;
};

export type CurrentSubscription = {
    plan?: SubscriptionPlan | null;
    startDate?: string | null;
    endDate?: string | null;
    status: SubscriptionStatus | "NOT_ASSIGNED";
    accessAllowed: boolean;
};

export const formatSubscriptionDate = (isoDate: string | null | undefined, locale: string) => {
    if (!isoDate) {
        return "";
    }
    const [year, month, day] = isoDate.split("-").map(Number);
    if (!year || !month || !day) {
        return isoDate;
    }
    return new Date(year, month - 1, day).toLocaleDateString(locale);
};
