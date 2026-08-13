import React from "react";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "./types";

type AppTabsProps = {
    activePath: string;
    openTabs: AppTabDefinition[];
    onCloseAllTabs: () => void;
    onCloseTab: (path: string) => void;
    onSelectTab: (path: string) => void;
};

function AppTabs({activePath, openTabs, onCloseAllTabs, onCloseTab, onSelectTab}: AppTabsProps) {
    const tabDockRef = React.useRef<HTMLDivElement>(null);
    const updateActiveIndicator = React.useCallback(() => {
        const dock = tabDockRef.current;
        const activeTab = dock?.querySelector<HTMLElement>(".app-tab-active");

        if (!dock || !activeTab) {
            dock?.removeAttribute("data-has-active-indicator");
            return;
        }

        dock.style.setProperty("--tab-indicator-x", `${activeTab.offsetLeft}px`);
        dock.style.setProperty("--tab-indicator-width", `${activeTab.offsetWidth}px`);
        dock.setAttribute("data-has-active-indicator", "true");
    }, []);

    React.useLayoutEffect(() => {
        const animationFrame = window.requestAnimationFrame(updateActiveIndicator);
        const dock = tabDockRef.current;
        const resizeObserver = dock && typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(updateActiveIndicator)
            : null;
        if (dock && resizeObserver) {
            resizeObserver.observe(dock);
        }
        window.addEventListener("resize", updateActiveIndicator);

        return () => {
            window.cancelAnimationFrame(animationFrame);
            resizeObserver?.disconnect();
            window.removeEventListener("resize", updateActiveIndicator);
        };
    }, [activePath, openTabs, updateActiveIndicator]);

    React.useEffect(() => {
        const activeTab = tabDockRef.current?.querySelector<HTMLElement>(".app-tab-active");
        if (activeTab && typeof activeTab.scrollIntoView === "function") {
            activeTab.scrollIntoView({behavior: "smooth", block: "nearest", inline: "nearest"});
        }
    }, [activePath, openTabs.length]);

    const handleTabWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        const dock = tabDockRef.current;
        if (!dock || dock.scrollWidth <= dock.clientWidth || event.deltaY === 0) {
            return;
        }

        event.preventDefault();
        dock.scrollLeft += event.deltaY;
    };

    return (
        <nav className="app-tab-strip" aria-label={pl.navigation.mainAriaLabel}>
            <div className="app-tab-dock" onWheel={handleTabWheel} ref={tabDockRef}>
                <span aria-hidden="true" className="app-tab-active-indicator" />
                {openTabs.map((tab) => (
                    <div className={`app-tab${tab.path === activePath ? ' app-tab-active' : ''}`} key={tab.path}>
                        <button
                            aria-current={tab.path === activePath ? "page" : undefined}
                            className="app-tab-select"
                            onClick={() => onSelectTab(tab.path)}
                            type="button"
                        >
                            <span>{tab.label}</span>
                        </button>
                        <button
                            aria-label={`${pl.app.tabs.close}: ${tab.label}`}
                            className="app-tab-close"
                            onClick={() => onCloseTab(tab.path)}
                            title={pl.app.tabs.close}
                            type="button"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
            {openTabs.length > 1 ? (
                <button className="app-close-tabs-button" onClick={onCloseAllTabs} type="button">
                    {pl.app.tabs.closeAll}
                </button>
            ) : null}
        </nav>
    );
}

export default AppTabs;
