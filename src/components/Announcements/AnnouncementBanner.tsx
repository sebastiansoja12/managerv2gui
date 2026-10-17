import React from "react";
import {Close, ErrorOutline, NotificationsNone, WarningAmberOutlined} from "components/ui/icons";
import {useAuthState} from "../../auth/AuthState";
import pl from "../../i18n/translate";
import {
    ANNOUNCEMENTS_UPDATED_EVENT,
    dismissAnnouncement,
    isDismissible,
    readDismissedAnnouncementIds,
    readVisibleAnnouncements,
    VisibleAnnouncement,
} from "./announcementStorage";
import "./styles/announcements.css";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const severityIcon = (severity: string) => {
    if (severity === "CRITICAL") {
        return <ErrorOutline fontSize="small" />;
    }
    if (severity === "WARNING") {
        return <WarningAmberOutlined fontSize="small" />;
    }
    return <NotificationsNone fontSize="small" />;
};

function AnnouncementBanner() {
    const {user} = useAuthState();
    const userSessionKey = user?.userId?.value ?? null;
    const [announcements, setAnnouncements] = React.useState<VisibleAnnouncement[]>([]);
    const [dismissedIds, setDismissedIds] = React.useState<number[]>([]);

    React.useEffect(() => {
        let mounted = true;

        if (userSessionKey === null) {
            setAnnouncements([]);
            setDismissedIds([]);
            return () => {
                mounted = false;
            };
        }

        const update = async () => {
            try {
                const visible = await readVisibleAnnouncements();
                if (mounted) {
                    setAnnouncements(visible);
                    setDismissedIds(readDismissedAnnouncementIds(userSessionKey));
                }
            } catch {
                // The banner is optional; a failed refresh keeps the previous state.
            }
        };

        void update();
        const interval = window.setInterval(() => void update(), REFRESH_INTERVAL_MS);
        window.addEventListener(ANNOUNCEMENTS_UPDATED_EVENT, update);
        return () => {
            mounted = false;
            window.clearInterval(interval);
            window.removeEventListener(ANNOUNCEMENTS_UPDATED_EVENT, update);
        };
    }, [userSessionKey]);

    if (userSessionKey === null) {
        return null;
    }

    const visible = announcements.filter((announcement) => !isDismissible(announcement) || !dismissedIds.includes(announcement.id));
    if (!visible.length) {
        return null;
    }

    return (
        <div className="global-announcement-stack">
            {visible.map((announcement) => {
                const severity = String(announcement.severity || "INFO").toLowerCase();
                return (
                    <aside
                        aria-label={pl.superAdmin.announcements.bannerLabel}
                        className={`global-announcement-banner global-announcement-${severity}`}
                        key={announcement.id}
                        role={announcement.severity === "CRITICAL" ? "alert" : "status"}
                    >
                        <span className="global-announcement-icon">{severityIcon(announcement.severity)}</span>
                        <p>
                            {announcement.title ? <strong>{announcement.title}</strong> : null}
                            <span>{announcement.message}</span>
                        </p>
                        {isDismissible(announcement) ? (
                            <button
                                aria-label={pl.common.close}
                                onClick={() => {
                                    dismissAnnouncement(announcement.id, userSessionKey);
                                    setDismissedIds((current) => [...current, announcement.id]);
                                }}
                                type="button"
                            >
                                <Close fontSize="small" />
                            </button>
                        ) : null}
                    </aside>
                );
            })}
        </div>
    );
}

export default AnnouncementBanner;
