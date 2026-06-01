export const ANNOUNCEMENT_STORAGE_KEY = "manager.global-announcement";

export type GlobalAnnouncement = {
    id: number;
    message: string;
};

export const readGlobalAnnouncement = (): GlobalAnnouncement | null => {
    try {
        const raw = window.localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY);
        if (!raw) {
            return null;
        }
        const value = JSON.parse(raw) as Partial<GlobalAnnouncement>;
        return typeof value.message === "string" && value.message.trim()
            ? {id: Number(value.id) || Date.now(), message: value.message}
            : null;
    } catch {
        return null;
    }
};

export const saveGlobalAnnouncement = (message: string): GlobalAnnouncement => {
    const announcement = {id: Date.now(), message: message.trim()};
    window.localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(announcement));
    window.dispatchEvent(new CustomEvent("manager:announcement-updated"));
    return announcement;
};

export const clearGlobalAnnouncement = () => {
    window.localStorage.removeItem(ANNOUNCEMENT_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("manager:announcement-updated"));
};
