import React from "react";
import {Navigate, useLocation, useNavigate} from "react-router-dom";
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography} from "components/ui";
import {initializeAuthSession} from "../../auth/AuthSession";
import {useAuthState} from "../../auth/AuthState";
import Navbar from "../Navbar/Navbar";
import AnnouncementBanner from "../Announcements/AnnouncementBanner";
import ImpersonationBanner from "../Impersonation/ImpersonationBanner";
import ImpersonationConsentBanner from "../Impersonation/ImpersonationConsentBanner";
import AppFooter from "./AppFooter";
import AppRoutes from "./AppRoutes";
import {getTabTitle, normalizePath} from "./tabConfig";
import {AppTabDefinition} from "./types";
import {
    availableOperationalProfiles,
    getOperationalProfile,
    isReturnPath,
    OperationalProfile,
    resolveOperationalProfile,
    setOperationalProfile,
} from "../../config/operationalProfile";
import pl from "../../i18n/translate";
import {Language} from "../../i18n";
import {
    clearCurrentUserLanguageContext,
    getLanguage,
    setCurrentUserLanguageContext,
    setLanguage,
    subscribeLanguage,
} from "../../i18n/languageStore";
import AuthService from "../../hooks/AuthService";
import {clearStoredTabs, OPEN_TABS_STORAGE_KEY} from "./tabStorage";
import {OrganizationChatDockProvider} from "../Chat/ChatDockContext";
import OrganizationChatDock from "../Chat/OrganizationChatDock";
import HomeModuleTiles from "../Home/HomeModuleTiles";
import {useOperatorCapabilities} from "./OperatorCapabilitiesContext";

const homeTab = (): AppTabDefinition => ({
    label: pl.navigation.home,
    path: "/",
});

const buildTab = (path: string): AppTabDefinition => {
    const normalizedPath = normalizePath(path);

    return {
        label: getTabTitle(normalizedPath),
        path: normalizedPath,
    };
};

const normalizeTabs = (tabs: AppTabDefinition[]): AppTabDefinition[] => {
    const visitedPaths = new Set<string>();

    return tabs
        .map((tab) => buildTab(tab.path))
        .filter((tab) => {
            if (tab.path === "/login" || visitedPaths.has(tab.path)) {
                return false;
            }

            visitedPaths.add(tab.path);
            return true;
        });
};

const readStoredTabs = (): AppTabDefinition[] => {
    try {
        const storedTabs = window.localStorage.getItem(OPEN_TABS_STORAGE_KEY);
        if (!storedTabs) {
            return [homeTab()];
        }

        const parsedTabs = JSON.parse(storedTabs) as Array<string | AppTabDefinition>;
        if (!Array.isArray(parsedTabs)) {
            return [homeTab()];
        }

        const tabs = normalizeTabs(parsedTabs
            .map((tab) => typeof tab === "string" ? {label: "", path: tab} : tab)
            .filter((tab): tab is AppTabDefinition => Boolean(tab?.path)));

        return tabs.length ? tabs : [homeTab()];
    } catch {
        return [homeTab()];
    }
};

const persistTabs = (tabs: AppTabDefinition[]) => {
    try {
        window.localStorage.setItem(OPEN_TABS_STORAGE_KEY, JSON.stringify(normalizeTabs(tabs)));
    } catch {
        // Browser storage can be unavailable in private mode; tabs still work for the current session.
    }
};

function AppShell() {
    const location = useLocation();
    const navigate = useNavigate();
    const [openTabs, setOpenTabs] = React.useState<AppTabDefinition[]>(readStoredTabs);
    const [selectedOperationalProfile, updateOperationalProfile] = React.useState<OperationalProfile>(getOperationalProfile);
    const [pendingOperationalProfile, setPendingOperationalProfile] = React.useState<OperationalProfile | null>(null);
    const [language, updateLanguage] = React.useState<Language>(getLanguage);
    const authState = useAuthState();
    const userRole = authState.user?.role;
    const allowedOperationalProfiles = availableOperationalProfiles(userRole);
    const operationalProfile = resolveOperationalProfile(userRole, selectedOperationalProfile);
    const {returnsStatus} = useOperatorCapabilities();

    const activePath = normalizePath(location.pathname);
    const loginRoute = location.pathname === "/login";
    const authenticated = authState.status === "authenticated";
    const returnsAvailable = returnsStatus === "available";
    const visibleTabs = returnsAvailable ? openTabs : openTabs.filter((tab) => !isReturnPath(tab.path));

    React.useEffect(() => {
        void initializeAuthSession();
    }, []);

    const openTab = (tab: AppTabDefinition) => {
        if (isReturnPath(tab.path) && !returnsAvailable) {
            return;
        }

        const normalizedTab = {
            ...tab,
            path: normalizePath(tab.path),
        };

        setOpenTabs((currentTabs) => {
            if (currentTabs.some((currentTab) => currentTab.path === normalizedTab.path)) {
                return currentTabs;
            }

            return currentTabs.concat(normalizedTab);
        });
        navigate(normalizedTab.path);
    };

    const applyOperationalProfile = (profile: OperationalProfile) => {
        setOperationalProfile(profile);
        updateOperationalProfile(profile);
        setOpenTabs([homeTab()]);
        navigate("/");
    };

    const changeLanguage = async (nextLanguage: Language) => {
        const previousLanguage = getLanguage();
        setLanguage(nextLanguage);

        try {
            const response = await AuthService.changeLanguage({language: nextLanguage});
            setCurrentUserLanguageContext(response.data.username || String(response.data.userId?.value), response.data.language);
        } catch (error) {
            setLanguage(previousLanguage);
            console.error(pl.userProfile.messages.languageChangeError, error);
        }
    };

    const changeOperationalProfile = (profile: OperationalProfile) => {
        if (profile === operationalProfile || !allowedOperationalProfiles.includes(profile)) {
            return;
        }

        const hasOpenBusinessTabs = openTabs.some((tab) => tab.path !== "/");
        if (hasOpenBusinessTabs) {
            setPendingOperationalProfile(profile);
            return;
        }

        applyOperationalProfile(profile);
    };

    const confirmOperationalProfileChange = () => {
        if (pendingOperationalProfile) {
            applyOperationalProfile(pendingOperationalProfile);
            setPendingOperationalProfile(null);
        }
    };

    React.useEffect(() => {
        if (loginRoute || (isReturnPath(activePath) && !returnsAvailable)) {
            return;
        }

        const label = getTabTitle(activePath);
        setOpenTabs((currentTabs) => {
            if (currentTabs.some((tab) => tab.path === activePath)) {
                return currentTabs;
            }

            return currentTabs.concat({label, path: activePath});
        });
    }, [activePath, loginRoute, returnsAvailable]);

    React.useEffect(() => {
        if (!authenticated || loginRoute || returnsStatus !== "unavailable") {
            return;
        }

        setOpenTabs((currentTabs) => currentTabs.filter((tab) => !isReturnPath(tab.path)));
    }, [authenticated, loginRoute, returnsStatus]);

    React.useEffect(() => subscribeLanguage(updateLanguage), []);

    React.useEffect(() => {
        if (authenticated && operationalProfile !== selectedOperationalProfile) {
            setOperationalProfile(operationalProfile);
            updateOperationalProfile(operationalProfile);
        }
    }, [authenticated, operationalProfile, selectedOperationalProfile]);

    React.useEffect(() => {
        const clearTabsBeforeExit = () => {
            clearStoredTabs();
        };

        window.addEventListener("beforeunload", clearTabsBeforeExit);
        return () => {
            window.removeEventListener("beforeunload", clearTabsBeforeExit);
        };
    }, []);

    React.useEffect(() => {
        if (!authenticated || loginRoute || !authState.user) {
            clearStoredTabs();
            clearCurrentUserLanguageContext();
            return;
        }

        setCurrentUserLanguageContext(
            authState.user.username || String(authState.user.userId?.value),
            authState.user.language,
        );
    }, [authState.user, authenticated, loginRoute]);

    React.useEffect(() => {
        setOpenTabs((currentTabs) => currentTabs.map((tab) => ({
            ...tab,
            label: getTabTitle(tab.path),
        })));
    }, [language]);

    React.useEffect(() => {
        if (!loginRoute) {
            persistTabs(openTabs);
        }
    }, [loginRoute, openTabs]);

    const closeTab = (path: string) => {
        setOpenTabs((currentTabs) => {
            const nextTabs = currentTabs.filter((tab) => tab.path !== path);
            if (path === activePath) {
                const fallbackTab = nextTabs[nextTabs.length - 1];
                navigate(fallbackTab?.path || "/");
            }

            return nextTabs;
        });
    };

    const closeAllTabs = () => {
        setOpenTabs([]);
        navigate("/");
    };

    if (authState.status === "initializing") {
        return null;
    }

    if (!authenticated && !loginRoute) {
        return <Navigate to="/login" replace/>;
    }

    if (authenticated && loginRoute) {
        return <Navigate to="/" replace/>;
    }

    if (loginRoute) {
        return <AppRoutes/>;
    }

    return (
        <OrganizationChatDockProvider>
            <ImpersonationBanner />
            <ImpersonationConsentBanner />
            <AnnouncementBanner />
            <Navbar
                activePath={activePath}
                language={language}
                onCloseAllTabs={closeAllTabs}
                onCloseTab={closeTab}
                onLanguageChange={changeLanguage}
                onOpenTab={openTab}
                onOperationalProfileChange={changeOperationalProfile}
                onSelectTab={navigate}
                operationalProfile={operationalProfile}
                operationalProfiles={allowedOperationalProfiles}
                openTabs={visibleTabs}
            />
            <div className="app-main-content">
                <AppRoutes onOpenTab={openTab} operationalProfile={operationalProfile}/>
            </div>
            <AppFooter />
            <HomeModuleTiles onOpenTab={openTab} operationalProfile={operationalProfile}/>
            <OrganizationChatDock />
            <Dialog
                className="operational-profile-dialog"
                open={Boolean(pendingOperationalProfile)}
                onClose={() => setPendingOperationalProfile(null)}
            >
                <DialogTitle className="operational-profile-dialog-title">
                    <span className="operational-profile-dialog-kicker">
                        {pl.common.brand} / {pl.operationalProfiles.label}
                    </span>
                    <strong>{pl.app.profileChangeDialog.title}</strong>
                </DialogTitle>
                <DialogContent className="operational-profile-dialog-content">
                    <Typography className="operational-profile-dialog-message">
                        <span aria-hidden="true" className="operational-profile-dialog-marker" />
                        {pl.app.profileChangeDialog.description}
                    </Typography>
                </DialogContent>
                <DialogActions className="operational-profile-dialog-actions">
                    <Button
                        className="operational-profile-dialog-cancel"
                        onClick={() => setPendingOperationalProfile(null)}
                        variant="outlined"
                    >
                        {pl.app.profileChangeDialog.cancel}
                    </Button>
                    <Button
                        className="operational-profile-dialog-confirm"
                        variant="contained"
                        onClick={confirmOperationalProfileChange}
                    >
                        {pl.app.profileChangeDialog.confirm}
                    </Button>
                </DialogActions>
            </Dialog>
        </OrganizationChatDockProvider>
    );
}

export default AppShell;
