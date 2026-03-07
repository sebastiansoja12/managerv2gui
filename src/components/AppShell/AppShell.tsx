import React from "react";
import {Navigate, useLocation, useNavigate} from "react-router-dom";
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography} from "@mui/material";
import {isAuthenticated} from "../../auth/AuthTokenStorage";
import Navbar from "../Navbar/Navbar";
import AppRoutes from "./AppRoutes";
import AppTabs from "./AppTabs";
import {getTabTitle, normalizePath} from "./tabConfig";
import {AppTabDefinition} from "./types";
import {
    getOperationalProfile,
    OperationalProfile,
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

const OPEN_TABS_STORAGE_KEY = "manager.openTabs";

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
    const [operationalProfile, updateOperationalProfile] = React.useState<OperationalProfile>(getOperationalProfile);
    const [pendingOperationalProfile, setPendingOperationalProfile] = React.useState<OperationalProfile | null>(null);
    const [language, updateLanguage] = React.useState<Language>(getLanguage);

    const activePath = normalizePath(location.pathname);
    const loginRoute = location.pathname === "/login";
    const authenticated = isAuthenticated();

    const openTab = (tab: AppTabDefinition) => {
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
        if (profile === operationalProfile) {
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
        if (loginRoute) {
            return;
        }

        const label = getTabTitle(activePath);
        setOpenTabs((currentTabs) => {
            if (currentTabs.some((tab) => tab.path === activePath)) {
                return currentTabs;
            }

            return currentTabs.concat({label, path: activePath});
        });
    }, [activePath, loginRoute]);

    React.useEffect(() => subscribeLanguage(updateLanguage), []);

    React.useEffect(() => {
        if (!authenticated || loginRoute) {
            clearCurrentUserLanguageContext();
            return;
        }

        let active = true;
        AuthService.me()
            .then((response) => {
                if (active) {
                    setCurrentUserLanguageContext(response.data.username || String(response.data.userId?.value), response.data.language);
                }
            })
            .catch((error) => {
                console.error(pl.userProfile.messages.languageChangeError, error);
            });

        return () => {
            active = false;
        };
    }, [authenticated, loginRoute]);

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
        <>
            <Navbar
                activePath={activePath}
                language={language}
                onLanguageChange={changeLanguage}
                onOpenTab={openTab}
                onOperationalProfileChange={changeOperationalProfile}
                operationalProfile={operationalProfile}
            />
            <AppTabs
                activePath={activePath}
                openTabs={openTabs}
                onCloseAllTabs={closeAllTabs}
                onCloseTab={closeTab}
                onSelectTab={navigate}
            />
            <div className="app-main-content">
                <AppRoutes onOpenTab={openTab} operationalProfile={operationalProfile}/>
            </div>
            <Dialog open={Boolean(pendingOperationalProfile)} onClose={() => setPendingOperationalProfile(null)}>
                <DialogTitle>{pl.app.profileChangeDialog.title}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {pl.app.profileChangeDialog.description}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPendingOperationalProfile(null)}>
                        {pl.app.profileChangeDialog.cancel}
                    </Button>
                    <Button variant="contained" onClick={confirmOperationalProfileChange}>
                        {pl.app.profileChangeDialog.confirm}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default AppShell;
