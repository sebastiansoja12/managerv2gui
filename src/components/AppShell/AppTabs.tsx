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
    return (
        <div className="app-tab-strip">
            {openTabs.map((tab) => (
                <button
                    className={`app-tab${tab.path === activePath ? ' app-tab-active' : ''}`}
                    key={tab.path}
                    onClick={() => onSelectTab(tab.path)}
                    type="button"
                >
                    <span>{tab.label}</span>
                    <span
                        className="app-tab-close"
                        aria-label={pl.app.tabs.close}
                        onClick={(event) => {
                            event.stopPropagation();
                            onCloseTab(tab.path);
                        }}
                        role="button"
                        tabIndex={0}
                    >
                        ×
                    </span>
                </button>
            ))}
            <div className="app-tab-actions">
                <button className="app-close-tabs-button" onClick={onCloseAllTabs} type="button">
                    {pl.app.tabs.closeAll}
                </button>
            </div>
        </div>
    );
}

export default AppTabs;
