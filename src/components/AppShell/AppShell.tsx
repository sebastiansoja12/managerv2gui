import React from "react";
import {Navigate, useLocation, useNavigate} from "react-router-dom";
import {isAuthenticated} from "../../auth/AuthTokenStorage";
import Navbar from "../Navbar/Navbar";
import AppRoutes from "./AppRoutes";
import AppTabs from "./AppTabs";
import {normalizePath, tabTitles} from "./tabConfig";
import {AppTabDefinition} from "./types";

function AppShell() {
    const location = useLocation();
    const navigate = useNavigate();
    const [openTabs, setOpenTabs] = React.useState<AppTabDefinition[]>([
        {label: "Strona startowa", path: "/"},
    ]);

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

    React.useEffect(() => {
        if (loginRoute) {
            return;
        }

        const label = tabTitles[activePath] || "Nowa karta";
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
            <Navbar activePath={activePath} onOpenTab={openTab}/>
            <AppTabs
                activePath={activePath}
                openTabs={openTabs}
                onCloseAllTabs={closeAllTabs}
                onCloseTab={closeTab}
                onSelectTab={navigate}
            />
            <div className="app-main-content">
                <AppRoutes/>
            </div>
        </>
    );
}

export default AppShell;
