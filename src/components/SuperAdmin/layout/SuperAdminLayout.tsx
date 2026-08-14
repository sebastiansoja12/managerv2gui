import React from "react";
import {
    Add,
    Business,
    History,
    LockOpen,
    NotificationsNone,
    SettingsSuggest,
    Shield,
} from "components/ui/icons";
import pl from "../../../i18n/translate";
import PlatformOwnersPanel from "../accounts/PlatformOwnersPanel";
import PlatformAuditPanel from "../audit/PlatformAuditPanel";
import SystemPanel from "../system/SystemPanel";
import {Operator} from "../../Operators/model/Operator";
import {logoutPlatformOwner} from "../auth/PlatformOwnerSession";
import {clearAnnouncementDismissal} from "../../Announcements/announcementStorage";
import AnnouncementsPanel from "../announcements/AnnouncementsPanel";

type SuperAdminArea = "operators" | "features" | "access" | "audit" | "announcements";

type SuperAdminLayoutProps = {
    children: React.ReactNode;
    error?: string;
    onCreate: () => void;
    operators?: Operator[];
    onOperatorSaved?: (operator: Operator) => void;
};

function SuperAdminLayout({children, error, onCreate, operators, onOperatorSaved}: SuperAdminLayoutProps) {
    const [activeArea, setActiveArea] = React.useState<SuperAdminArea>("operators");
    const logout = async () => {
        clearAnnouncementDismissal();
        try {
            await logoutPlatformOwner();
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
                    <button className={`super-admin-nav-item${activeArea === "audit" ? " super-admin-nav-item-active" : ""}`} onClick={() => setActiveArea("audit")} type="button">
                        <History fontSize="small"/>
                        <span>{pl.superAdmin.nav.audit}</span>
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
                        {activeArea === "features" ? <SystemPanel onOperatorSaved={onOperatorSaved} operators={operators}/> : null}
                        {activeArea === "access" ? <PlatformOwnersPanel/> : null}
                        {activeArea === "audit" ? <PlatformAuditPanel/> : null}
                        {activeArea === "announcements" ? <AnnouncementsPanel operators={operators}/> : null}
                    </section>
                )}
            </section>
        </main>
    );
}

export default SuperAdminLayout;
