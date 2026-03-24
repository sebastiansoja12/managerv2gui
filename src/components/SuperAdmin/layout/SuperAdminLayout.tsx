import React from "react";
import {
    Add,
    AdminPanelSettings,
    Business,
    LockOpen,
    NotificationsNone,
    SettingsSuggest,
    Shield,
} from "@mui/icons-material";
import {clearSuperAdminAuthToken} from "../../../auth/SuperAdminAuthTokenStorage";
import pl from "../../../i18n/translate";

type SuperAdminLayoutProps = {
    children: React.ReactNode;
    error?: string;
    onCreate: () => void;
};

function SuperAdminLayout({children, error, onCreate}: SuperAdminLayoutProps) {
    const logout = () => {
        clearSuperAdminAuthToken();
        window.location.assign("/super-admin/login");
    };

    return (
        <main className="super-admin-app">
            <aside className="super-admin-sidebar">
                <div className="super-admin-brand">
                    <span><Shield fontSize="small"/></span>
                    <strong>{pl.superAdmin.brand}</strong>
                </div>

                <nav className="super-admin-nav" aria-label={pl.superAdmin.navigationLabel}>
                    <button className="super-admin-nav-item super-admin-nav-item-active" type="button">
                        <Business fontSize="small"/>
                        <span>{pl.superAdmin.nav.operators}</span>
                    </button>
                    <button className="super-admin-nav-item" type="button">
                        <SettingsSuggest fontSize="small"/>
                        <span>{pl.superAdmin.nav.features}</span>
                    </button>
                    <button className="super-admin-nav-item" type="button">
                        <LockOpen fontSize="small"/>
                        <span>{pl.superAdmin.nav.access}</span>
                    </button>
                </nav>

                <div className="super-admin-sidebar-note">
                    <AdminPanelSettings fontSize="small"/>
                    <span>{pl.superAdmin.layout.note}</span>
                </div>
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
                        <button className="super-admin-primary-button" onClick={onCreate} type="button">
                            <Add fontSize="small"/>
                            <span>{pl.superAdmin.layout.newOperator}</span>
                        </button>
                    </div>
                </header>

                {children}
            </section>
        </main>
    );
}

export default SuperAdminLayout;
