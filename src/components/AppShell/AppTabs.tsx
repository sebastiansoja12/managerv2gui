import React from "react";
import {ExpandMore} from "components/ui/icons";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "./types";

type AppTabsProps = {
    activePath: string;
    openTabs: AppTabDefinition[];
    onCloseTab: (path: string) => void;
    onSelectTab: (path: string) => void;
};

const TAB_GAP = 5;

export const getVisibleTabIndexes = (
    tabWidths: number[],
    availableWidth: number,
    overflowControlWidth: number,
    activeIndex: number,
): number[] => {
    const allTabsWidth = tabWidths.reduce((total, width) => total + width, 0)
        + Math.max(0, tabWidths.length - 1) * TAB_GAP;
    if (allTabsWidth <= availableWidth) {
        return tabWidths.map((_, index) => index);
    }

    const indexes: number[] = [];
    let occupiedWidth = overflowControlWidth;
    for (let index = 0; index < tabWidths.length; index += 1) {
        const nextWidth = tabWidths[index] + TAB_GAP;
        if (occupiedWidth + nextWidth > availableWidth) {
            break;
        }
        indexes.push(index);
        occupiedWidth += nextWidth;
    }

    if (activeIndex >= 0 && !indexes.includes(activeIndex) && indexes.length) {
        indexes[indexes.length - 1] = activeIndex;
        while (
            indexes.length
            && indexes.reduce((total, index) => total + tabWidths[index], 0)
                + indexes.length * TAB_GAP
                + overflowControlWidth > availableWidth
        ) {
            indexes.shift();
        }
    }

    return indexes;
};

function AppTabs({activePath, openTabs, onCloseTab, onSelectTab}: AppTabsProps) {
    const tabStripRef = React.useRef<HTMLElement>(null);
    const tabDockRef = React.useRef<HTMLDivElement>(null);
    const tabMeasureRef = React.useRef<HTMLDivElement>(null);
    const overflowMeasureRef = React.useRef<HTMLButtonElement>(null);
    const overflowRef = React.useRef<HTMLDivElement>(null);
    const [visibleTabIndexes, setVisibleTabIndexes] = React.useState<number[]>(() => openTabs.map((_, index) => index));
    const [overflowOpen, setOverflowOpen] = React.useState(false);

    const updateVisibleTabs = React.useCallback(() => {
        const strip = tabStripRef.current;
        const measurements = tabMeasureRef.current;
        if (!strip || !measurements) {
            return;
        }

        const tabWidths = Array.from(measurements.children).map((element) => (
            (element as HTMLElement).getBoundingClientRect().width
        ));
        const overflowControlWidth = overflowMeasureRef.current?.getBoundingClientRect().width || 54;
        const activeIndex = openTabs.findIndex((tab) => tab.path === activePath);
        const nextIndexes = getVisibleTabIndexes(
            tabWidths,
            strip.getBoundingClientRect().width,
            overflowControlWidth,
            activeIndex,
        );

        setVisibleTabIndexes((currentIndexes) => (
            currentIndexes.length === nextIndexes.length
            && currentIndexes.every((value, index) => value === nextIndexes[index])
                ? currentIndexes
                : nextIndexes
        ));
    }, [activePath, openTabs]);

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
        const animationFrame = window.requestAnimationFrame(() => {
            updateVisibleTabs();
            updateActiveIndicator();
        });
        const strip = tabStripRef.current;
        const resizeObserver = strip && typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(updateVisibleTabs)
            : null;
        if (strip && resizeObserver) {
            resizeObserver.observe(strip);
        }
        window.addEventListener("resize", updateVisibleTabs);

        return () => {
            window.cancelAnimationFrame(animationFrame);
            resizeObserver?.disconnect();
            window.removeEventListener("resize", updateVisibleTabs);
        };
    }, [updateActiveIndicator, updateVisibleTabs]);

    React.useLayoutEffect(() => {
        const animationFrame = window.requestAnimationFrame(updateActiveIndicator);
        return () => window.cancelAnimationFrame(animationFrame);
    }, [activePath, updateActiveIndicator, visibleTabIndexes]);

    React.useEffect(() => {
        const closeOnOutsideInteraction = (event: PointerEvent) => {
            if (event.target instanceof Node && !overflowRef.current?.contains(event.target)) {
                setOverflowOpen(false);
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOverflowOpen(false);
            }
        };

        document.addEventListener("pointerdown", closeOnOutsideInteraction);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("pointerdown", closeOnOutsideInteraction);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, []);

    const visibleIndexSet = new Set(visibleTabIndexes);
    const visibleTabs = visibleTabIndexes.map((index) => openTabs[index]).filter(Boolean);
    const hiddenTabs = openTabs.filter((_, index) => !visibleIndexSet.has(index));

    React.useEffect(() => {
        if (!hiddenTabs.length) {
            setOverflowOpen(false);
        }
    }, [hiddenTabs.length]);

    const renderTab = (tab: AppTabDefinition, overflow = false) => (
        <div
            className={`${overflow ? "app-overflow-tab" : "app-tab"}${tab.path === activePath ? " app-tab-active" : ""}`}
            key={tab.path}
        >
            <button
                aria-current={tab.path === activePath ? "page" : undefined}
                className={overflow ? "app-overflow-tab-select" : "app-tab-select"}
                onClick={() => {
                    onSelectTab(tab.path);
                    setOverflowOpen(false);
                }}
                type="button"
            >
                <span>{tab.label}</span>
            </button>
            <button
                aria-label={`${pl.app.tabs.close}: ${tab.label}`}
                className={overflow ? "app-overflow-tab-close" : "app-tab-close"}
                onClick={() => onCloseTab(tab.path)}
                title={pl.app.tabs.close}
                type="button"
            >
                ×
            </button>
        </div>
    );

    return (
        <nav className="app-tab-strip" aria-label={pl.app.tabs.openTabs} ref={tabStripRef}>
            <div aria-hidden="true" className="app-tab-measurements" ref={tabMeasureRef}>
                {openTabs.map((tab) => (
                    <div className="app-tab app-tab-measure" key={tab.path}>
                        <span className="app-tab-select"><span>{tab.label}</span></span>
                        <span className="app-tab-close">×</span>
                    </div>
                ))}
            </div>
            <button aria-hidden="true" className="app-tabs-overflow-trigger app-tabs-overflow-measure" ref={overflowMeasureRef} tabIndex={-1} type="button">
                +{openTabs.length}
                <ExpandMore fontSize="small" />
            </button>

            <div className="app-tab-dock" ref={tabDockRef}>
                <span aria-hidden="true" className="app-tab-active-indicator" />
                {visibleTabs.map((tab) => renderTab(tab))}
            </div>

            {hiddenTabs.length ? (
                <div className="app-tabs-overflow" ref={overflowRef}>
                    <button
                        aria-controls="app-tabs-overflow-menu"
                        aria-expanded={overflowOpen}
                        aria-label={pl.app.tabs.more.replace("{count}", String(hiddenTabs.length))}
                        className="app-tabs-overflow-trigger"
                        onClick={() => setOverflowOpen((isOpen) => !isOpen)}
                        type="button"
                    >
                        +{hiddenTabs.length}
                        <ExpandMore fontSize="small" />
                    </button>
                    {overflowOpen ? (
                        <div
                            aria-label={pl.app.tabs.hiddenTabs}
                            className="app-tabs-overflow-menu"
                            id="app-tabs-overflow-menu"
                            role="group"
                        >
                            {hiddenTabs.map((tab) => renderTab(tab, true))}
                        </div>
                    ) : null}
                </div>
            ) : null}
        </nav>
    );
}

export default AppTabs;
