import React from "react";
import {Close, NotificationsNone} from "components/ui/icons";
import {useAuthState} from "../../auth/AuthState";
import pl from "../../i18n/translate";
import {dismissGlobalAnnouncement, readDismissedAnnouncementId, readGlobalAnnouncement} from "./announcementStorage";
import "./styles/announcements.css";

function AnnouncementBanner() {
    const {user} = useAuthState();
    const userSessionKey = user?.userId?.value ?? null;
    const [announcement, setAnnouncement] = React.useState<Awaited<ReturnType<typeof readGlobalAnnouncement>>>(null);
    const [dismissedId, setDismissedId] = React.useState<number | null>(() => userSessionKey === null ? null : readDismissedAnnouncementId(userSessionKey));

    React.useEffect(() => {
        let mounted = true;

        if (userSessionKey === null) {
            setAnnouncement(null);
            setDismissedId(null);
            return () => {
                mounted = false;
            };
        }

        const update = async () => {
            let nextAnnouncement = null;
            try {
                nextAnnouncement = await readGlobalAnnouncement();
            } catch {
                return;
            }
            if (!mounted) {
                return;
            }

            setAnnouncement(nextAnnouncement);
            setDismissedId(readDismissedAnnouncementId(userSessionKey));
        };

        void update();
        window.addEventListener("manager:announcement-updated", update);
        return () => {
            mounted = false;
            window.removeEventListener("manager:announcement-updated", update);
        };
    }, [userSessionKey]);

    if (userSessionKey === null || !announcement || dismissedId === announcement.id) {
        return null;
    }

    return (
        <aside aria-label={pl.superAdmin.announcements.bannerLabel} className="global-announcement-banner">
            <span className="global-announcement-icon"><NotificationsNone fontSize="small" /></span>
            <p>{announcement.message}</p>
            <button aria-label={pl.common.close} onClick={() => { dismissGlobalAnnouncement(announcement.id, userSessionKey); setDismissedId(announcement.id); }} type="button">
                <Close fontSize="small" />
            </button>
        </aside>
    );
}

export default AnnouncementBanner;
