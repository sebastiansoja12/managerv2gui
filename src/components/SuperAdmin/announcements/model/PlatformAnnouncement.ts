export type PlatformAnnouncementSeverity = "INFO" | "WARNING" | "CRITICAL";

export type PlatformAnnouncementStatus = "SCHEDULED" | "ACTIVE" | "EXPIRED";

export type PlatformAnnouncement = {
    id: number;
    title?: string | null;
    message: string;
    severity: PlatformAnnouncementSeverity;
    status: PlatformAnnouncementStatus;
    validFrom?: string | null;
    validTo?: string | null;
    targetOperatorIds: number[];
    targetRoles: string[];
    createdBy?: string | null;
    createdAt?: string;
    updatedAt?: string;
};

export type PlatformAnnouncementRequest = {
    title: string;
    message: string;
    severity: PlatformAnnouncementSeverity;
    validFrom: string | null;
    validTo: string | null;
    targetOperatorIds: number[];
    targetRoles: string[];
};

export type PlatformAnnouncementDraft = {
    title: string;
    message: string;
    severity: PlatformAnnouncementSeverity;
    validFrom: string;
    validTo: string;
    targetOperatorIds: number[];
    targetRoles: string[];
};

export const announcementSeverities: PlatformAnnouncementSeverity[] = ["INFO", "WARNING", "CRITICAL"];

export const announcementRoles = ["SUPERADMIN", "ADMIN", "MANAGER", "USER", "SUPPLIER"];

export const emptyAnnouncementDraft = (): PlatformAnnouncementDraft => ({
    title: "",
    message: "",
    severity: "INFO",
    validFrom: "",
    validTo: "",
    targetOperatorIds: [],
    targetRoles: [],
});

const pad = (value: number) => String(value).padStart(2, "0");

export const toDateTimeLocal = (value?: string | null) => {
    if (!value) {
        return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const fromDateTimeLocal = (value: string) => {
    if (!value) {
        return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const announcementToDraft = (announcement: PlatformAnnouncement): PlatformAnnouncementDraft => ({
    title: announcement.title || "",
    message: announcement.message,
    severity: announcement.severity,
    validFrom: toDateTimeLocal(announcement.validFrom),
    validTo: toDateTimeLocal(announcement.validTo),
    targetOperatorIds: [...(announcement.targetOperatorIds || [])],
    targetRoles: [...(announcement.targetRoles || [])],
});

export const draftToRequest = (draft: PlatformAnnouncementDraft): PlatformAnnouncementRequest => ({
    title: draft.title.trim(),
    message: draft.message.trim(),
    severity: draft.severity,
    validFrom: fromDateTimeLocal(draft.validFrom),
    validTo: fromDateTimeLocal(draft.validTo),
    targetOperatorIds: draft.targetOperatorIds,
    targetRoles: draft.targetRoles,
});

export const isDraftRangeInvalid = (draft: PlatformAnnouncementDraft) => {
    const from = fromDateTimeLocal(draft.validFrom);
    const to = fromDateTimeLocal(draft.validTo);
    return Boolean(from && to && to <= from);
};
