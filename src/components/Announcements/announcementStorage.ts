import http from "../../http-common";

const ANNOUNCEMENT_UPDATED_EVENT = "manager:announcement-updated";
const ANNOUNCEMENT_DISMISSED_SESSION_KEY = "manager:announcement-dismissed";

export type GlobalAnnouncement = {
    id: number;
    message: string;
    createdAt?: string;
    updatedAt?: string;
};

let announcementCache: GlobalAnnouncement | null | undefined;
let announcementRequest: Promise<GlobalAnnouncement | null> | null = null;

const dismissedAnnouncementKey = (userKey: string | number) => `${ANNOUNCEMENT_DISMISSED_SESSION_KEY}:${userKey}`;

const notifyAnnouncementUpdated = () => {
    window.dispatchEvent(new CustomEvent(ANNOUNCEMENT_UPDATED_EVENT));
};

export const readDismissedAnnouncementId = (userKey: string | number): number | null => {
    const value = window.sessionStorage.getItem(dismissedAnnouncementKey(userKey));
    if (!value) {
        return null;
    }

    const id = Number(value);
    return Number.isFinite(id) ? id : null;
};

export const dismissGlobalAnnouncement = (id: number, userKey: string | number): void => {
    window.sessionStorage.setItem(dismissedAnnouncementKey(userKey), String(id));
};

export const clearAnnouncementDismissal = (): void => {
    for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
        const key = window.sessionStorage.key(index);
        if (key?.startsWith(`${ANNOUNCEMENT_DISMISSED_SESSION_KEY}:`)) {
            window.sessionStorage.removeItem(key);
        }
    }
};

export const readGlobalAnnouncement = async (): Promise<GlobalAnnouncement | null> => {
    if (announcementCache !== undefined) {
        return announcementCache;
    }

    if (announcementRequest) {
        return announcementRequest;
    }

    announcementRequest = http.get<GlobalAnnouncement>("/announcements/active", {
        validateStatus: (status) => status === 200 || status === 204,
    }).then((response) => {
        announcementCache = response.status === 204 || !response.data ? null : response.data;
        return announcementCache;
    }).finally(() => {
        announcementRequest = null;
    });

    return announcementRequest;
};

export const saveGlobalAnnouncement = async (message: string): Promise<GlobalAnnouncement> => {
    const response = await http.put<GlobalAnnouncement>("/announcements/active", {message});
    announcementCache = response.data;
    notifyAnnouncementUpdated();
    return response.data;
};

export const clearGlobalAnnouncement = async (): Promise<void> => {
    await http.delete("/announcements/active");
    announcementCache = null;
    notifyAnnouncementUpdated();
};
