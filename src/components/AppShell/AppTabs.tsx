import React from "react";
import {PushPin, PushPinOff, Search, ViewList} from "components/ui/icons";
import pl from "../../i18n/translate";
import {getTabIcon} from "./tabIcons";
import {AppTabDefinition} from "./types";
import "./styles/app-tabs.css";

type AppTabsProps = {
    activePath: string;
    openTabs: AppTabDefinition[];
    onCloseAllTabs: () => void;
    onCloseOtherTabs: (path: string) => void;
    onCloseTab: (path: string) => void;
    onCloseTabsToRight: (path: string) => void;
    onKeepTab: (path: string) => void;
    onSelectTab: (path: string) => void;
    onTogglePinnedTab: (path: string) => void;
};

type TabContextMenu = {
    path: string;
    x: number;
    y: number;
};

const CONTEXT_MENU_WIDTH = 236;
const CONTEXT_MENU_HEIGHT = 250;
const ACTIVE_TAB_SCROLL_MARGIN = 28;

const isMiddleButton = (event: React.MouseEvent) => event.button === 1;

function AppTabs({
    activePath,
    openTabs,
    onCloseAllTabs,
    onCloseOtherTabs,
    onCloseTab,
    onCloseTabsToRight,
    onKeepTab,
    onSelectTab,
    onTogglePinnedTab,
}: AppTabsProps) {
    const scrollerRef = React.useRef<HTMLDivElement>(null);
    const tabRefs = React.useRef(new Map<string, HTMLDivElement>());
    const allTabsRef = React.useRef<HTMLDivElement>(null);
    const contextMenuRef = React.useRef<HTMLDivElement>(null);
    const [scrollEdges, setScrollEdges] = React.useState({end: false, start: false});
    const [allTabsOpen, setAllTabsOpen] = React.useState(false);
    const [tabFilter, setTabFilter] = React.useState("");
    const [contextMenu, setContextMenu] = React.useState<TabContextMenu | null>(null);

    const updateScrollEdges = React.useCallback(() => {
        const scroller = scrollerRef.current;
        if (!scroller) {
            return;
        }

        const start = scroller.scrollLeft > 1;
        const end = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1;
        setScrollEdges((current) => current.start === start && current.end === end ? current : {end, start});
    }, []);

    React.useLayoutEffect(() => {
        const scroller = scrollerRef.current;
        const activeTab = tabRefs.current.get(activePath);
        if (scroller && activeTab) {
            const tabStart = activeTab.offsetLeft - ACTIVE_TAB_SCROLL_MARGIN;
            const tabEnd = activeTab.offsetLeft + activeTab.offsetWidth + ACTIVE_TAB_SCROLL_MARGIN;
            if (tabStart < scroller.scrollLeft) {
                scroller.scrollLeft = Math.max(0, tabStart);
            } else if (tabEnd > scroller.scrollLeft + scroller.clientWidth) {
                scroller.scrollLeft = tabEnd - scroller.clientWidth;
            }
        }
        updateScrollEdges();
    }, [activePath, openTabs, updateScrollEdges]);

    React.useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) {
            return undefined;
        }

        // A vertical mouse wheel scrolls the tabs sideways instead of the page underneath.
        const scrollTabsWithWheel = (event: WheelEvent) => {
            if (scroller.scrollWidth <= scroller.clientWidth || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
                return;
            }
            event.preventDefault();
            scroller.scrollLeft += event.deltaY;
        };
        const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateScrollEdges) : null;

        resizeObserver?.observe(scroller);
        scroller.addEventListener("wheel", scrollTabsWithWheel, {passive: false});
        return () => {
            resizeObserver?.disconnect();
            scroller.removeEventListener("wheel", scrollTabsWithWheel);
        };
    }, [updateScrollEdges]);

    const closeAllTabsList = () => {
        setAllTabsOpen(false);
        setTabFilter("");
    };

    const closeContextMenu = (restoreFocus = false) => {
        if (restoreFocus && contextMenu) {
            tabRefs.current.get(contextMenu.path)?.querySelector("button")?.focus();
        }
        setContextMenu(null);
    };

    React.useEffect(() => {
        if (!allTabsOpen && !contextMenu) {
            return undefined;
        }

        const closeOnOutsideInteraction = (event: PointerEvent) => {
            if (!(event.target instanceof Node)) {
                return;
            }
            if (!allTabsRef.current?.contains(event.target)) {
                setAllTabsOpen(false);
                setTabFilter("");
            }
            if (!contextMenuRef.current?.contains(event.target)) {
                setContextMenu(null);
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setAllTabsOpen(false);
                setTabFilter("");
                setContextMenu(null);
            }
        };
        const closeContextMenuOnScroll = () => setContextMenu(null);

        document.addEventListener("pointerdown", closeOnOutsideInteraction);
        document.addEventListener("keydown", closeOnEscape);
        window.addEventListener("resize", closeContextMenuOnScroll);
        return () => {
            document.removeEventListener("pointerdown", closeOnOutsideInteraction);
            document.removeEventListener("keydown", closeOnEscape);
            window.removeEventListener("resize", closeContextMenuOnScroll);
        };
    }, [allTabsOpen, contextMenu]);

    React.useEffect(() => {
        contextMenuRef.current?.querySelector<HTMLButtonElement>("[role='menuitem']:not(:disabled)")?.focus();
    }, [contextMenu]);

    const openContextMenu = (event: React.MouseEvent<HTMLElement>, path: string) => {
        event.preventDefault();
        // A context menu opened from the keyboard has no pointer position, so it is placed under the tab.
        const anchor = event.clientX || event.clientY
            ? {x: event.clientX, y: event.clientY}
            : (() => {
                const rect = event.currentTarget.getBoundingClientRect();
                return {x: rect.left, y: rect.bottom};
            })();

        setAllTabsOpen(false);
        setContextMenu({
            path,
            x: Math.max(8, Math.min(anchor.x, window.innerWidth - CONTEXT_MENU_WIDTH - 8)),
            y: Math.max(8, Math.min(anchor.y, window.innerHeight - CONTEXT_MENU_HEIGHT - 8)),
        });
    };

    const moveContextMenuFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape") {
            event.preventDefault();
            closeContextMenu(true);
            return;
        }
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
            return;
        }

        event.preventDefault();
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[role='menuitem']:not(:disabled)"));
        const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
        const step = event.key === "ArrowDown" ? 1 : -1;
        items[(currentIndex + step + items.length) % items.length]?.focus();
    };

    const runContextMenuAction = (action: (path: string) => void) => {
        if (contextMenu) {
            action(contextMenu.path);
        }
        setContextMenu(null);
    };

    const unpinnedTabsCount = openTabs.filter((tab) => !tab.pinned).length;
    const normalizedFilter = tabFilter.trim().toLocaleLowerCase();
    const filteredTabs = normalizedFilter
        ? openTabs.filter((tab) => tab.label.toLocaleLowerCase().includes(normalizedFilter))
        : openTabs;

    const selectFromAllTabs = (path: string) => {
        onSelectTab(path);
        closeAllTabsList();
    };

    const tabClassName = (baseClassName: string, tab: AppTabDefinition) => [
        baseClassName,
        tab.path === activePath ? `${baseClassName}-active` : "",
        tab.preview ? `${baseClassName}-preview` : "",
        tab.pinned ? `${baseClassName}-pinned` : "",
    ].filter(Boolean).join(" ");

    const renderTabIcon = (tab: AppTabDefinition, className: string) => {
        const Icon = tab.pinned ? PushPin : getTabIcon(tab.path);
        return <Icon aria-hidden="true" className={className} fontSize="inherit" />;
    };

    const renderCloseButton = (tab: AppTabDefinition, className: string) => (
        tab.pinned ? null : (
            <button
                aria-label={`${pl.app.tabs.close}: ${tab.label}`}
                className={className}
                onClick={() => onCloseTab(tab.path)}
                title={pl.app.tabs.close}
                type="button"
            >
                ×
            </button>
        )
    );

    const renderTab = (tab: AppTabDefinition) => (
        <div
            className={tabClassName("app-tabbar-tab", tab)}
            key={tab.path}
            onAuxClick={(event) => {
                if (isMiddleButton(event) && !tab.pinned) {
                    event.preventDefault();
                    onCloseTab(tab.path);
                }
            }}
            onContextMenu={(event) => openContextMenu(event, tab.path)}
            onMouseDown={(event) => {
                // Prevents the browser auto-scroll cursor, so the middle button can close the tab.
                if (isMiddleButton(event)) {
                    event.preventDefault();
                }
            }}
            ref={(element) => {
                if (element) {
                    tabRefs.current.set(tab.path, element);
                } else {
                    tabRefs.current.delete(tab.path);
                }
            }}
        >
            <button
                aria-current={tab.path === activePath ? "page" : undefined}
                className="app-tabbar-tab-select"
                onClick={() => onSelectTab(tab.path)}
                onDoubleClick={() => onKeepTab(tab.path)}
                title={tab.preview ? `${tab.label} - ${pl.app.tabs.previewHint}` : tab.label}
                type="button"
            >
                {renderTabIcon(tab, "app-tabbar-tab-icon")}
                <span>{tab.label}</span>
            </button>
            {renderCloseButton(tab, "app-tabbar-tab-close")}
        </div>
    );

    const contextMenuTab = contextMenu ? openTabs.find((tab) => tab.path === contextMenu.path) : undefined;
    const contextMenuTabIndex = contextMenuTab ? openTabs.indexOf(contextMenuTab) : -1;
    const contextMenuItems = contextMenuTab ? [
        ...(contextMenuTab.preview ? [{
            action: onKeepTab,
            disabled: false,
            key: "keep",
            label: pl.app.tabs.keep,
        }] : []),
        {
            action: onTogglePinnedTab,
            disabled: false,
            icon: contextMenuTab.pinned ? PushPinOff : PushPin,
            key: "pin",
            label: contextMenuTab.pinned ? pl.app.tabs.unpin : pl.app.tabs.pin,
        },
        {
            action: onCloseTab,
            disabled: false,
            key: "close",
            label: pl.app.tabs.close,
            separated: true,
        },
        {
            action: onCloseOtherTabs,
            disabled: !openTabs.some((tab) => !tab.pinned && tab.path !== contextMenuTab.path),
            key: "close-others",
            label: pl.app.tabs.closeOthers,
        },
        {
            action: onCloseTabsToRight,
            disabled: !openTabs.slice(contextMenuTabIndex + 1).some((tab) => !tab.pinned),
            key: "close-right",
            label: pl.app.tabs.closeToRight,
        },
        {
            action: onCloseAllTabs,
            disabled: !unpinnedTabsCount,
            key: "close-all",
            label: pl.app.tabs.closeAll,
        },
    ] : [];

    return (
        <nav aria-label={pl.app.tabs.openTabs} className="app-tabbar">
            <div
                className="app-tabbar-scroller"
                data-overflow-end={scrollEdges.end || undefined}
                data-overflow-start={scrollEdges.start || undefined}
                onScroll={updateScrollEdges}
                ref={scrollerRef}
            >
                {openTabs.map(renderTab)}
            </div>

            <div className="app-tabbar-all" ref={allTabsRef}>
                <button
                    aria-controls="app-tabbar-all-panel"
                    aria-expanded={allTabsOpen}
                    aria-label={pl.app.tabs.allTabsCount.replace("{count}", String(openTabs.length))}
                    className="app-tabbar-all-trigger"
                    onClick={() => {
                        setContextMenu(null);
                        if (allTabsOpen) {
                            closeAllTabsList();
                        } else {
                            setAllTabsOpen(true);
                        }
                    }}
                    title={pl.app.tabs.allTabs}
                    type="button"
                >
                    <ViewList aria-hidden="true" fontSize="inherit" />
                    <span>{openTabs.length}</span>
                </button>

                {allTabsOpen ? (
                    <div aria-label={pl.app.tabs.allTabs} className="app-tabbar-all-panel" id="app-tabbar-all-panel" role="dialog">
                        <label className="app-tabbar-all-search">
                            <Search aria-hidden="true" fontSize="inherit" />
                            <input
                                aria-label={pl.app.tabs.filterPlaceholder}
                                autoFocus
                                onChange={(event) => setTabFilter(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" && filteredTabs[0]) {
                                        event.preventDefault();
                                        selectFromAllTabs(filteredTabs[0].path);
                                    }
                                }}
                                placeholder={pl.app.tabs.filterPlaceholder}
                                type="search"
                                value={tabFilter}
                            />
                        </label>

                        <ul aria-label={pl.app.tabs.openTabs} className="app-tabbar-all-list">
                            {filteredTabs.map((tab) => (
                                <li className={tabClassName("app-tabbar-all-item", tab)} key={tab.path}>
                                    <button
                                        aria-current={tab.path === activePath ? "page" : undefined}
                                        className="app-tabbar-all-item-select"
                                        onClick={() => selectFromAllTabs(tab.path)}
                                        type="button"
                                    >
                                        {renderTabIcon(tab, "app-tabbar-all-item-icon")}
                                        <span>{tab.label}</span>
                                        {tab.preview ? <small>{pl.app.tabs.preview}</small> : null}
                                    </button>
                                    {renderCloseButton(tab, "app-tabbar-all-item-close")}
                                </li>
                            ))}
                        </ul>
                        {!filteredTabs.length ? <p className="app-tabbar-all-empty">{pl.app.tabs.noMatches}</p> : null}

                        <div className="app-tabbar-all-footer">
                            <button
                                className="app-tabbar-all-close-all"
                                disabled={!unpinnedTabsCount}
                                onClick={() => {
                                    onCloseAllTabs();
                                    closeAllTabsList();
                                }}
                                type="button"
                            >
                                {pl.app.tabs.closeAll}
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>

            {contextMenu && contextMenuTab ? (
                <div
                    aria-label={`${pl.app.tabs.actions}: ${contextMenuTab.label}`}
                    className="app-tabbar-context-menu"
                    onKeyDown={moveContextMenuFocus}
                    ref={contextMenuRef}
                    role="menu"
                    style={{left: contextMenu.x, top: contextMenu.y}}
                >
                    {contextMenuItems.map((item) => {
                        const Icon = "icon" in item ? item.icon : null;
                        return (
                            <React.Fragment key={item.key}>
                                {"separated" in item ? <hr aria-hidden="true" /> : null}
                                <button
                                    className="app-tabbar-context-menu-item"
                                    disabled={item.disabled}
                                    onClick={() => runContextMenuAction(item.action)}
                                    role="menuitem"
                                    type="button"
                                >
                                    {Icon ? <Icon aria-hidden="true" fontSize="inherit" /> : <span aria-hidden="true" />}
                                    {item.label}
                                </button>
                            </React.Fragment>
                        );
                    })}
                </div>
            ) : null}
        </nav>
    );
}

export default AppTabs;
