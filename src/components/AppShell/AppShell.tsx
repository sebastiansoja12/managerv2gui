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
import pl from "../../i18n/pl";

function AppShell() {
    const location = useLocation();
    const navigate = useNavigate();
    const [openTabs, setOpenTabs] = React.useState<AppTabDefinition[]>([
        {label: pl.navigation.home, path: "/"},
    ]);
    const [operationalProfile, updateOperationalProfile] = React.useState<OperationalProfile>(getOperationalProfile);
    const [pendingOperationalProfile, setPendingOperationalProfile] = React.useState<OperationalProfile | null>(null);

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
        setOpenTabs([{label: pl.navigation.home, path: "/"}]);
        navigate("/");
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
