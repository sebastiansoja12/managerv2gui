import {AppTabDefinition} from "./types";

export const MAX_OPEN_TABS = 15;

const pinnedFirst = (tabs: AppTabDefinition[]) => tabs
    .filter((tab) => tab.pinned)
    .concat(tabs.filter((tab) => !tab.pinned));

const updateTab = (
    tabs: AppTabDefinition[],
    path: string,
    update: (tab: AppTabDefinition) => AppTabDefinition,
) => tabs.map((tab) => tab.path === path ? update(tab) : tab);

/**
 * Removes the least recently used tabs above the limit. Pinned tabs and the tab being opened
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
        const removable = nextTabs.filter((tab) => !tab.pinned && tab.path !== keepPath);
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

/**
 * Opens a page in the preview tab: an already open page is only activated, otherwise the page
 * replaces the current preview tab or is appended as a new one.
 */
export const openPreviewTab = (
    tabs: AppTabDefinition[],
    tab: AppTabDefinition,
    recentPaths: string[] = [],
): AppTabDefinition[] => {
    if (tabs.some((currentTab) => currentTab.path === tab.path)) {
        return tabs;
    }

    const previewTab: AppTabDefinition = {label: tab.label, path: tab.path, preview: true};
    const previewIndex = tabs.findIndex((currentTab) => currentTab.preview);
    if (previewIndex >= 0) {
        return tabs.map((currentTab, index) => index === previewIndex ? previewTab : currentTab);
    }

    return trimTabs(tabs.concat(previewTab), tab.path, recentPaths);
};

export const keepTab = (tabs: AppTabDefinition[], path: string) => (
    tabs.some((tab) => tab.path === path && tab.preview)
        ? updateTab(tabs, path, (tab) => ({...tab, preview: false}))
        : tabs
);

export const togglePinnedTab = (tabs: AppTabDefinition[], path: string) => pinnedFirst(
    updateTab(tabs, path, (tab) => ({...tab, pinned: !tab.pinned, preview: false})),
);

export const removeTab = (tabs: AppTabDefinition[], path: string) => tabs.filter((tab) => tab.path !== path);

export const closeOtherTabs = (tabs: AppTabDefinition[], path: string) => tabs.filter((tab) => (
    tab.pinned || tab.path === path
));

export const closeTabsToRight = (tabs: AppTabDefinition[], path: string) => {
    const index = tabs.findIndex((tab) => tab.path === path);
    return tabs.filter((tab, tabIndex) => tab.pinned || tabIndex <= index);
};

export const closeUnpinnedTabs = (tabs: AppTabDefinition[]) => tabs.filter((tab) => tab.pinned);

/** Keeps stored tabs consistent: pinned tabs first and at most one preview tab. */
export const normalizeTabFlags = (tabs: AppTabDefinition[]): AppTabDefinition[] => {
    let previewFound = false;

    return pinnedFirst(tabs.map((tab) => {
        const preview = Boolean(tab.preview) && !tab.pinned && !previewFound;
        previewFound = previewFound || preview;
        return {
            label: tab.label,
            path: tab.path,
            ...(tab.pinned ? {pinned: true} : {}),
            ...(preview ? {preview: true} : {}),
        };
    }));
};
