import React from "react";
import {Close, NotificationsNone} from "components/ui/icons";
import pl from "../../i18n/translate";
import {readGlobalAnnouncement} from "./announcementStorage";
import "./styles/announcements.css";

function AnnouncementBanner() {
    const [announcement, setAnnouncement] = React.useState(readGlobalAnnouncement);
    const [dismissedId, setDismissedId] = React.useState<number | null>(null);

    React.useEffect(() => {
        const update = () => {
            setAnnouncement(readGlobalAnnouncement());
            setDismissedId(null);
        };
        window.addEventListener("manager:announcement-updated", update);
        return () => window.removeEventListener("manager:announcement-updated", update);
    }, []);

    if (!announcement || dismissedId === announcement.id) {
        return null;
    }

    return (
        <aside aria-label={pl.superAdmin.announcements.bannerLabel} className="global-announcement-banner">
            <span className="global-announcement-icon"><NotificationsNone fontSize="small" /></span>
            <p>{announcement.message}</p>
            <button aria-label={pl.common.close} onClick={() => setDismissedId(announcement.id)} type="button">
                <Close fontSize="small" />
            </button>
        </aside>
    );
}

export default AnnouncementBanner;
