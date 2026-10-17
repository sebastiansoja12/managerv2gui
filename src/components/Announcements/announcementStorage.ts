import http from "../../http-common";

const ANNOUNCEMENT_UPDATED_EVENT = "manager:announcement-updated";
const ANNOUNCEMENT_DISMISSED_SESSION_KEY = "manager:announcement-dismissed";

export type AnnouncementSeverity = "INFO" | "WARNING" | "CRITICAL";

export type VisibleAnnouncement = {
    id: number;
    title?: string | null;
    message: string;
    severity: AnnouncementSeverity | string;
    validFrom?: string | null;
    validTo?: string | null;
    updatedAt?: string;
};

const dismissedAnnouncementKey = (userKey: string | number) => `${ANNOUNCEMENT_DISMISSED_SESSION_KEY}:${userKey}`;

const readStorage = (key: string) => {
    try {
        return window.sessionStorage.getItem(key);
    } catch {
        return null;
    }
};

const writeStorage = (key: string, value: string) => {
    try {
        window.sessionStorage.setItem(key, value);
    } catch {
        // Dismissal is a per-session convenience only.
    }
};

export const isDismissible = (announcement: VisibleAnnouncement) => announcement.severity !== "CRITICAL";

export const readDismissedAnnouncementIds = (userKey: string | number): number[] => {
    const value = readStorage(dismissedAnnouncementKey(userKey));
    if (!value) {
        return [];
    }
    return value.split(",").map(Number).filter(Number.isFinite);
};

export const dismissAnnouncement = (id: number, userKey: string | number): void => {
    const ids = new Set(readDismissedAnnouncementIds(userKey));
    ids.add(id);
    writeStorage(dismissedAnnouncementKey(userKey), Array.from(ids).join(","));
};

export const clearAnnouncementDismissal = (): void => {
    try {
        for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
            const key = window.sessionStorage.key(index);
            if (key?.startsWith(`${ANNOUNCEMENT_DISMISSED_SESSION_KEY}:`)) {
                window.sessionStorage.removeItem(key);
            }
        }
    } catch {
        // Nothing to clear when storage is unavailable.
    }
};

export const notifyAnnouncementsUpdated = () => {
    window.dispatchEvent(new CustomEvent(ANNOUNCEMENT_UPDATED_EVENT));
};

export const ANNOUNCEMENTS_UPDATED_EVENT = ANNOUNCEMENT_UPDATED_EVENT;

export const readVisibleAnnouncements = async (): Promise<VisibleAnnouncement[]> => {
    const response = await http.get<VisibleAnnouncement[]>("/announcements/current");
    return Array.isArray(response.data) ? response.data : [];
};
