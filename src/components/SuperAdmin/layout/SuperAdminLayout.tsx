import React from "react";
import {
    Add,
    Business,
    CheckCircle,
    Close,
    LockOpen,
    NotificationsNone,
    Save,
    SettingsSuggest,
    Shield,
} from "components/ui/icons";
import {logoutAuthSession} from "../../../auth/AuthSession";
import pl from "../../../i18n/translate";
import {clearGlobalAnnouncement, readGlobalAnnouncement, saveGlobalAnnouncement} from "../../Announcements/announcementStorage";

type SuperAdminArea = "operators" | "features" | "access" | "announcements";

type SuperAdminLayoutProps = {
    children: React.ReactNode;
    error?: string;
    onCreate: () => void;
};

function SuperAdminLayout({children, error, onCreate}: SuperAdminLayoutProps) {
    const [activeArea, setActiveArea] = React.useState<SuperAdminArea>("operators");
    const [announcement, setAnnouncement] = React.useState(() => readGlobalAnnouncement()?.message || "");
    const [announcementSaved, setAnnouncementSaved] = React.useState(false);
    const logout = async () => {
        try {
            await logoutAuthSession();
        } finally {
            window.location.assign("/super-admin/login");
        }
    };

    return (
        <main className="super-admin-app">
            <aside className="super-admin-sidebar">
                <div className="super-admin-brand">
                    <span><Shield fontSize="small"/></span>
                    <strong>{pl.superAdmin.brand}</strong>
                </div>

                <nav className="super-admin-nav" aria-label={pl.superAdmin.navigationLabel}>
                    <button className={`super-admin-nav-item${activeArea === "operators" ? " super-admin-nav-item-active" : ""}`} onClick={() => setActiveArea("operators")} type="button">
                        <Business fontSize="small"/>
                        <span>{pl.superAdmin.nav.operators}</span>
                    </button>
                    <button className={`super-admin-nav-item${activeArea === "features" ? " super-admin-nav-item-active" : ""}`} onClick={() => setActiveArea("features")} type="button">
                        <SettingsSuggest fontSize="small"/>
                        <span>{pl.superAdmin.nav.features}</span>
                    </button>
                    <button className={`super-admin-nav-item${activeArea === "access" ? " super-admin-nav-item-active" : ""}`} onClick={() => setActiveArea("access")} type="button">
                        <LockOpen fontSize="small"/>
                        <span>{pl.superAdmin.nav.access}</span>
                    </button>
                    <button className={`super-admin-nav-item${activeArea === "announcements" ? " super-admin-nav-item-active" : ""}`} onClick={() => setActiveArea("announcements")} type="button">
                        <NotificationsNone fontSize="small"/>
                        <span>{pl.superAdmin.nav.announcements}</span>
                    </button>
                </nav>
            </aside>

            <section className="super-admin-workspace">
                <header className="super-admin-topbar">
                    <div>
                        <span className="super-admin-kicker">{pl.superAdmin.layout.kicker}</span>
                        <h1>{pl.superAdmin.layout.title}</h1>
                    </div>
                    <div className="super-admin-topbar-actions">
                        {error ? <span className="super-admin-offline">{pl.superAdmin.layout.offline}</span> : null}
                        <button className="super-admin-icon-button" type="button" aria-label={pl.superAdmin.layout.notifications}>
                            <NotificationsNone fontSize="small"/>
                        </button>
                        <button className="super-admin-secondary-button" onClick={logout} type="button">
                            {pl.superAdmin.layout.logout}
                        </button>
                        {activeArea === "operators" ? <button className="super-admin-primary-button" onClick={onCreate} type="button"><Add fontSize="small"/><span>{pl.superAdmin.layout.newOperator}</span></button> : null}
                    </div>
                </header>

                {activeArea === "operators" ? children : (
                    <section className="super-admin-module-panel">
                        {activeArea === "features" ? (
                            <>
                                <div className="super-admin-module-heading"><span className="super-admin-kicker">{pl.superAdmin.layout.kicker}</span><h2>{pl.superAdmin.modules.features.title}</h2><p>{pl.superAdmin.modules.features.subtitle}</p></div>
                                <div className="super-admin-module-grid">{pl.superAdmin.modules.features.items.map((item) => <article className="super-admin-module-card" key={item.name}><span className="super-admin-module-card-icon"><SettingsSuggest fontSize="small"/></span><strong>{item.name}</strong><p>{item.description}</p><span className="super-admin-module-state"><CheckCircle fontSize="small"/>{pl.superAdmin.workspace.enabled}</span></article>)}</div>
                            </>
                        ) : null}
                        {activeArea === "access" ? (
                            <>
                                <div className="super-admin-module-heading"><span className="super-admin-kicker">{pl.superAdmin.layout.kicker}</span><h2>{pl.superAdmin.modules.access.title}</h2><p>{pl.superAdmin.modules.access.subtitle}</p></div>
                                <div className="super-admin-access-grid">{pl.superAdmin.modules.access.items.map((item) => <article className="super-admin-access-card" key={item.name}><LockOpen fontSize="small"/><div><strong>{item.name}</strong><p>{item.description}</p></div><span>{item.state}</span></article>)}</div>
                            </>
                        ) : null}
                        {activeArea === "announcements" ? (
                            <form className="super-admin-announcement-panel" onSubmit={(event) => { event.preventDefault(); if (announcement.trim()) { saveGlobalAnnouncement(announcement); setAnnouncementSaved(true); } }}>
                                <div className="super-admin-module-heading"><span className="super-admin-kicker">{pl.superAdmin.layout.kicker}</span><h2>{pl.superAdmin.announcements.title}</h2><p>{pl.superAdmin.announcements.subtitle}</p></div>
                                <label><span>{pl.superAdmin.announcements.fieldLabel}</span><textarea value={announcement} onChange={(event) => { setAnnouncement(event.target.value); setAnnouncementSaved(false); }} placeholder={pl.superAdmin.announcements.placeholder} rows={5}/></label>
                                <div className="super-admin-announcement-footer"><span>{announcementSaved ? <><CheckCircle fontSize="small" />{pl.superAdmin.announcements.saved}</> : pl.superAdmin.announcements.visibility}</span><div><button className="super-admin-secondary-button" onClick={() => { clearGlobalAnnouncement(); setAnnouncement(""); setAnnouncementSaved(false); }} type="button"><Close fontSize="small" />{pl.superAdmin.announcements.clear}</button><button className="super-admin-primary-button" disabled={!announcement.trim()} type="submit"><Save fontSize="small" />{pl.superAdmin.announcements.save}</button></div></div>
                            </form>
                        ) : null}
                    </section>
                )}
            </section>
        </main>
    );
}

export default SuperAdminLayout;
