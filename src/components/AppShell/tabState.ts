import {AppTabDefinition} from "./types";

export const MAX_OPEN_TABS = 15;
export const HOME_TAB_PATH = "/";

export const isHomeTab = (tab: AppTabDefinition) => tab.path === HOME_TAB_PATH;

/** Tabs the user cannot close: the home tab and pinned tabs. */
const isFixedTab = (tab: AppTabDefinition) => isHomeTab(tab) || Boolean(tab.pinned);

/** The home tab always stays first, followed by pinned tabs and then the rest in opening order. */
const orderTabs = (tabs: AppTabDefinition[]) => tabs
    .filter(isHomeTab)
    .concat(tabs.filter((tab) => !isHomeTab(tab) && tab.pinned))
    .concat(tabs.filter((tab) => !isFixedTab(tab)));

const updateTab = (
    tabs: AppTabDefinition[],
    path: string,
    update: (tab: AppTabDefinition) => AppTabDefinition,
) => tabs.map((tab) => tab.path === path ? update(tab) : tab);

/**
 * Removes the least recently used tabs above the limit. Fixed tabs and the tab being opened
 * are never removed; `recentPaths` is ordered from the oldest to the newest visit.
 */
export const trimTabs = (
    tabs: AppTabDefinition[],
    keepPath: string,
    recentPaths: string[],
    maxTabs = MAX_OPEN_TABS,
): AppTabDefinition[] => {
    let nextTabs = tabs;
    while (nextTabs.length > maxTabs) {
        const removable = nextTabs.filter((tab) => !isFixedTab(tab) && tab.path !== keepPath);
        if (!removable.length) {
            return nextTabs;
        }

        const leastRecentTab = removable.reduce((oldest, tab) => (
            recentPaths.indexOf(tab.path) < recentPaths.indexOf(oldest.path) ? tab : oldest
        ));
        nextTabs = nextTabs.filter((tab) => tab !== leastRecentTab);
    }

    return nextTabs;
};

/** Opens a page in its own tab: an already open page is only activated, otherwise a new tab is appended. */
export const addTab = (
    tabs: AppTabDefinition[],
    tab: AppTabDefinition,
    recentPaths: string[] = [],
): AppTabDefinition[] => {
    if (tabs.some((currentTab) => currentTab.path === tab.path)) {
        return tabs;
    }

    return trimTabs(orderTabs(tabs.concat({label: tab.label, path: tab.path})), tab.path, recentPaths);
};

export const togglePinnedTab = (tabs: AppTabDefinition[], path: string) => (
    path === HOME_TAB_PATH ? tabs : orderTabs(updateTab(tabs, path, (tab) => ({...tab, pinned: !tab.pinned})))
);

export const removeTab = (tabs: AppTabDefinition[], path: string) => tabs.filter((tab) => (
    isHomeTab(tab) || tab.path !== path
));

export const closeOtherTabs = (tabs: AppTabDefinition[], path: string) => tabs.filter((tab) => (
    isFixedTab(tab) || tab.path === path
));

export const closeTabsToRight = (tabs: AppTabDefinition[], path: string) => {
    const index = tabs.findIndex((tab) => tab.path === path);
    return tabs.filter((tab, tabIndex) => isFixedTab(tab) || tabIndex <= index);
};

export const closeUnpinnedTabs = (tabs: AppTabDefinition[]) => tabs.filter(isFixedTab);

/** Keeps stored tabs consistent: the home tab first, then pinned tabs, without legacy flags. */
export const normalizeTabFlags = (tabs: AppTabDefinition[]): AppTabDefinition[] => orderTabs(tabs.map((tab) => ({
    label: tab.label,
    path: tab.path,
    ...(tab.pinned && !isHomeTab(tab) ? {pinned: true} : {}),
})));
