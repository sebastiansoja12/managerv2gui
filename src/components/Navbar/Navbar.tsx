import React from 'react';
import {
    AccountBalance,
    Add,
    AdminPanelSettings,
    Analytics,
    AccountTree,
    ArchiveOutlined,
    Block,
    ChatBubbleOutline,
    ChevronRight,
    Dashboard,
    DevicesOther,
    ExpandMore,
    InfoOutlined,
    Inventory2,
    Logout,
    LocalOffer,
    LocalShipping,
    LocationOn,
    Loop,
    Person,
    QrCodeScanner,
    ReportProblemOutlined,
    Route,
    Send,
    Settings,
    SettingsSuggest,
    ShoppingCart,
    SupportAgent,
    TaskAlt,
    ViewList,
    Warehouse,
    WarehouseRounded,
} from "components/ui/icons";
import {isPathAllowedForProfile, isReturnPath, operationalProfiles as allOperationalProfiles, OperationalProfile} from "../../config/operationalProfile";
import {getAppEnvironment} from "../../config/appEnvironment";
import {isPathAllowedForRole} from "../../config/roleAccess";
import {AppTabDefinition} from "../AppShell/types";
import './styles/main.css';
import {logoutAuthSession} from "../../auth/AuthSession";
import {clearAnnouncementDismissal} from "../Announcements/announcementStorage";
import {useAuthState} from "../../auth/AuthState";
import ImpersonationConsentNotifications from "../Impersonation/ImpersonationConsentNotifications";
import pl from "../../i18n/translate";
import {Language, translations} from "../../i18n";
import {clearStoredTabs} from "../AppShell/tabStorage";
import {AppTheme, useAppTheme} from "../../theme/ThemeProvider";
import {useOperatorCapabilities} from "../AppShell/OperatorCapabilitiesContext";
import PalletCreateDialog from "../Pallets/PalletCreateDialog";
import HomeModuleTiles from "../Home/HomeModuleTiles";
import {emitOnboardingEvent} from "../Onboarding/onboardingEvents";

type NavbarItem = AppTabDefinition & {
    icon: React.ElementType;
    onSelect?: () => void;
};

type NavbarGroup = {
    key: string;
    label: string;
    icon: React.ElementType;
    items: NavbarItem[];
};

type NavbarMenu = {
    label: string;
    icon: React.ElementType;
    items: NavbarItem[];
    groups?: NavbarGroup[];
};

const SHIPMENTS_GROUP = "shipments";
const PALLETS_GROUP = "pallets";
const TRANSPORT_GROUP = "transport";
const DELIVERIES_GROUP = "deliveries";

const menuItems = (menu: NavbarMenu): NavbarItem[] => [
    ...menu.items,
    ...(menu.groups || []).flatMap((group) => group.items),
];

const submenuId = (groupKey: string) => `top-nav-submenu-${groupKey}`;

type NavbarProps = {
    activePath: string;
    onOpenTab: (tab: AppTabDefinition) => void;
    onLanguageChange: (language: Language) => void;
    onOperationalProfileChange: (profile: OperationalProfile) => void;
    language: Language;
    operationalProfile: OperationalProfile;
    operationalProfiles?: OperationalProfile[];
};

const languages = Object.keys(translations) as Language[];
const NAVIGATION_PANEL = "navigation";

type NavbarTrackingSearchProps = {
    onOpenTab: (tab: AppTabDefinition) => void;
};

const focusShortcutLabel = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K";
const isFocusShortcut = (event: KeyboardEvent) => (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";

// Always-visible scan field: a barcode reader types the code and Enter, Ctrl/Cmd+K focuses it.
export function NavbarTrackingSearch({onOpenTab}: NavbarTrackingSearchProps) {
    const [trackingNumber, setTrackingNumber] = React.useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        const focusOnShortcut = (event: KeyboardEvent) => {
            if (isFocusShortcut(event)) {
                event.preventDefault();
                inputRef.current?.focus();
                inputRef.current?.select();
            }
        };

        document.addEventListener("keydown", focusOnShortcut);
        return () => document.removeEventListener("keydown", focusOnShortcut);
    }, []);

    const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalizedTrackingNumber = trackingNumber.trim();
        if (!normalizedTrackingNumber) {
            return;
        }

        onOpenTab({
            label: pl.home.trackingLookup.detailsTabLabel.replace("{trackingNumber}", normalizedTrackingNumber),
            path: `/shipments/tracking/${encodeURIComponent(normalizedTrackingNumber)}/edit`,
        });
        setTrackingNumber("");
        inputRef.current?.blur();
    };

    return (
        <form
            aria-label={pl.home.trackingLookup.ariaLabel}
            className="top-nav-scan"
            id="top-nav-tracking-search"
            onSubmit={submitSearch}
        >
            <QrCodeScanner aria-hidden="true" fontSize="small" />
            <input
                aria-label={pl.home.trackingLookup.inputLabel}
                className="top-nav-tracking-input"
                onChange={(event) => setTrackingNumber(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === "Escape") {
                        setTrackingNumber("");
                        event.currentTarget.blur();
                    }
                }}
                placeholder={pl.navigation.scanPlaceholder}
                ref={inputRef}
                type="search"
                value={trackingNumber}
            />
            <kbd className="top-nav-scan-shortcut" title={pl.navigation.scanShortcut}>{focusShortcutLabel}</kbd>
        </form>
    );
}

function Navbar({
    activePath,
    onOpenTab,
    onLanguageChange,
    onOperationalProfileChange,
    language,
    operationalProfile,
    operationalProfiles = allOperationalProfiles,
}: NavbarProps) {
    const [expandedPanel, setExpandedPanel] = React.useState<string | null>(null);
    const [activeGroupKey, setActiveGroupKey] = React.useState<string | null>(null);
    const [palletCreateOpen, setPalletCreateOpen] = React.useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
    const [createMenuOpen, setCreateMenuOpen] = React.useState(false);
    const [isScrolled, setIsScrolled] = React.useState(false);
    const [expansionLeft, setExpansionLeft] = React.useState<number | null>(null);
    const navbarRef = React.useRef<HTMLElement>(null);
    const quickNavRef = React.useRef<HTMLElement>(null);
    const islandRef = React.useRef<HTMLDivElement>(null);
    const expansionRef = React.useRef<HTMLDivElement>(null);
    const {user} = useAuthState();
    const {returnsStatus} = useOperatorCapabilities();
    const {theme, setTheme} = useAppTheme();

    const environment = getAppEnvironment();
    const actingOnBehalf = Boolean(user?.homeDepartmentCode && user.homeDepartmentCode !== user.departmentCode);
    const userName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || pl.common.dash;
    const userRole = user?.role
        ? pl.usersManagement.roles[user.role as keyof typeof pl.usersManagement.roles] || user.role
        : pl.common.dash;
    const userInitials = [user?.firstName, user?.lastName]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase() || user?.username.slice(0, 2).toUpperCase() || "?";
    const mainItems: NavbarItem[] = [
        {label: pl.navigation.home, path: '/', icon: Dashboard},
        {label: pl.navigation.processes, path: '/processes', icon: TaskAlt},
        {label: pl.navigation.incidents, path: '/incidents', icon: ReportProblemOutlined},
        {label: pl.navigation.chat, path: '/chat', icon: ChatBubbleOutline},
    ].filter((item) => isPathAllowedForProfile(item.path, operationalProfile));
    const menus: NavbarMenu[] = [
        {
            label: pl.navigation.warehouse,
            icon: Warehouse,
            items: [],
            groups: [
                {
                    key: SHIPMENTS_GROUP,
                    label: pl.navigation.shipments,
                    icon: ShoppingCart,
                    items: [
                        {label: pl.home.tiles.shipmentDetails.title, path: '/shipment-details', icon: LocalShipping},
                        {label: pl.navigation.shipmentList, path: '/shipments/list', icon: ShoppingCart},
                        {label: pl.navigation.returns, path: '/returns', icon: Loop},
                        {label: pl.navigation.shipmentCreate, path: '/shipments/create', icon: LocalShipping},
                        {label: pl.navigation.shipmentScanner, path: '/shipment-scanner', icon: WarehouseRounded},
                        {label: pl.navigation.shipmentRoute, path: '/shipment-route', icon: Route},
                        {label: pl.navigation.courierDeliveries, path: '/courier-deliveries', icon: LocalShipping},
                    ],
                },
                {
                    key: PALLETS_GROUP,
                    label: pl.navigation.pallets,
                    icon: Inventory2,
                    items: [
                        {label: pl.navigation.palletScanner, path: '/pallets/scan', icon: QrCodeScanner},
                        {
                            label: pl.navigation.palletCreate,
                            path: '/pallets/create',
                            icon: Add,
                            onSelect: () => {
                                setExpandedPanel(null);
                                setProfileMenuOpen(false);
                                setPalletCreateOpen(true);
                            },
                        },
                        {label: pl.navigation.palletList, path: '/pallets', icon: ViewList},
                        {label: pl.navigation.palletsCancelled, path: '/pallets/cancelled', icon: Block},
                        {label: pl.navigation.palletsEmpty, path: '/pallets/empty', icon: ArchiveOutlined},
                    ],
                },
                {
                    key: TRANSPORT_GROUP,
                    label: pl.navigation.transport,
                    icon: LocalShipping,
                    items: [
                        {label: pl.navigation.carriers, path: '/carriers', icon: LocalShipping},
                        {label: pl.navigation.drivers, path: '/drivers', icon: Person},
                        {label: pl.navigation.fleetMap, path: '/fleet-map', icon: LocationOn},
                    ],
                },
                {
                    key: DELIVERIES_GROUP,
                    label: pl.navigation.deliveries,
                    icon: Send,
                    items: [
                        {label: pl.navigation.allDeliveries, path: '/deliveries', icon: ViewList},
                        {label: pl.navigation.incompleteDeliveries, path: '/deliveries/incomplete', icon: ReportProblemOutlined},
                    ],
                },
            ],
        },
        {
            label: pl.navigation.organization,
            icon: AccountTree,
            items: [
                {label: pl.navigation.users, path: '/users', icon: AdminPanelSettings},
                {label: pl.navigation.departments, path: '/depots', icon: WarehouseRounded},
                {label: pl.navigation.pickupPoints, path: '/pickup-points', icon: LocationOn},
                {label: pl.navigation.couriers, path: '/couriers', icon: Person},
                {label: pl.navigation.devicePairing, path: '/device-pairing', icon: DevicesOther},
                {label: pl.navigation.mySettings, path: '/my-settings', icon: Settings},
                {label: pl.navigation.analytics, path: '/analytics', icon: Analytics},
            ],
        },
        {
            label: pl.navigation.management,
            icon: Settings,
            items: [
                {label: pl.navigation.deals, path: '/deals', icon: LocalOffer},
                {label: pl.navigation.billing, path: '/billing', icon: AccountBalance},
                {label: pl.navigation.globalConfiguration, path: '/global-configuration', icon: SettingsSuggest},
                {label: pl.navigation.support, path: '/support', icon: SupportAgent},
            ],
        },
    ];
    const createItems: NavbarItem[] = [
        {label: pl.navigation.shipmentCreate, path: '/shipments/create', icon: LocalShipping},
        {
            label: pl.navigation.palletCreate,
            path: '/pallets/create',
            icon: Inventory2,
            onSelect: () => {
                setCreateMenuOpen(false);
                setPalletCreateOpen(true);
            },
        },
        {label: pl.navigation.palletFromShipments, path: '/pallets/create-from-shipments', icon: ViewList},
    ].filter((item) => isPathAllowedForProfile(item.path, operationalProfile));
    const isVisiblePath = (path: string) => isPathAllowedForProfile(path, operationalProfile)
        && isPathAllowedForRole(path, user?.role)
        && (!isReturnPath(path) || returnsStatus === "available");
    const visibleGroups = (menu: NavbarMenu): NavbarGroup[] => (menu.groups || [])
        .map((group) => ({...group, items: group.items.filter((item) => isVisiblePath(item.path))}))
        .filter((group) => group.items.length > 0);

    const updateDockIndicator = React.useCallback(() => {
        const navigation = quickNavRef.current;
        const activeItem = navigation?.querySelector<HTMLButtonElement>('[data-active-dock-item="true"]');

        if (!navigation || !activeItem) {
            navigation?.removeAttribute("data-has-active-indicator");
            return;
        }

        const navigationRect = navigation.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();
        navigation.style.setProperty("--dock-indicator-x", `${itemRect.left - navigationRect.left}px`);
        navigation.style.setProperty("--dock-indicator-width", `${itemRect.width}px`);
        navigation.setAttribute("data-has-active-indicator", "true");
    }, []);

    React.useLayoutEffect(() => {
        const animationFrame = window.requestAnimationFrame(updateDockIndicator);
        const navigation = quickNavRef.current;
        const resizeObserver = navigation && typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(updateDockIndicator)
            : null;
        if (navigation && resizeObserver) {
            resizeObserver.observe(navigation);
        }
        window.addEventListener("resize", updateDockIndicator);

        return () => {
            window.cancelAnimationFrame(animationFrame);
            resizeObserver?.disconnect();
            window.removeEventListener("resize", updateDockIndicator);
        };
    }, [activePath, operationalProfile, updateDockIndicator]);

    // A category panel opens under its own dock button; the last position is kept so the panel closes in place.
    React.useLayoutEffect(() => {
        if (!expandedPanel) {
            return;
        }
        const island = islandRef.current;
        const expansion = expansionRef.current;
        const trigger = island?.querySelector<HTMLButtonElement>('.top-nav-dock-control[aria-expanded="true"]');
        if (expandedPanel === NAVIGATION_PANEL || !island || !expansion || !trigger) {
            setExpansionLeft(null);
            return;
        }

        const islandRect = island.getBoundingClientRect();
        const triggerLeft = trigger.getBoundingClientRect().left - islandRect.left;
        const maxLeft = Math.max(0, islandRect.width - expansion.offsetWidth);
        setExpansionLeft(Math.min(Math.max(0, triggerLeft), maxLeft));
    }, [expandedPanel]);

    React.useEffect(() => {
        const scrollContainer = document.querySelector<HTMLElement>(".app-main-content");
        if (!scrollContainer) {
            return;
        }

        const updateScrollState = () => setIsScrolled(scrollContainer.scrollTop > 12);
        updateScrollState();
        scrollContainer.addEventListener("scroll", updateScrollState, {passive: true});
        return () => scrollContainer.removeEventListener("scroll", updateScrollState);
    }, []);

    React.useEffect(() => {
        const closeOnOutsideInteraction = (event: PointerEvent) => {
            if (event.target instanceof Node && !navbarRef.current?.contains(event.target)) {
                setExpandedPanel(null);
                setProfileMenuOpen(false);
                setCreateMenuOpen(false);
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setExpandedPanel(null);
                setProfileMenuOpen(false);
                setCreateMenuOpen(false);
            }
        };

        document.addEventListener("pointerdown", closeOnOutsideInteraction);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("pointerdown", closeOnOutsideInteraction);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, []);

    const logout = async () => {
        clearStoredTabs();
        clearAnnouncementDismissal();
        setExpandedPanel(null);
        setProfileMenuOpen(false);
        try {
            await logoutAuthSession();
        } finally {
            window.location.assign("/login");
        }
    };

    const openTab = (tab: AppTabDefinition) => {
        onOpenTab(tab);
        setExpandedPanel(null);
        setProfileMenuOpen(false);
        setCreateMenuOpen(false);
    };

    const renderPanelItem = (item: NavbarItem) => {
        if (!isVisiblePath(item.path)) {
            return null;
        }

        const Icon = item.icon;
        return (
            <button
                aria-haspopup={item.onSelect ? "dialog" : undefined}
                className="top-nav-option"
                key={item.path}
                onClick={() => item.onSelect ? item.onSelect() : openTab({label: item.label, path: item.path})}
                type="button"
            >
                <Icon fontSize="small" />
                <span>{item.label}</span>
            </button>
        );
    };

    const renderDockItem = (item: NavbarItem) => {
        if (!isVisiblePath(item.path)) {
            return null;
        }

        const Icon = item.icon;
        return (
            <button
                aria-label={item.label}
                className="top-nav-dock-control"
                key={item.path}
                onClick={() => openTab(item)}
                title={item.label}
                type="button"
            >
                <Icon fontSize="small" />
                <span>{item.label}</span>
            </button>
        );
    };

    const renderNavigationPanel = () => (
        <nav aria-label={pl.navigation.mainAriaLabel} className="top-nav-options-panel" id="main-navigation-options">
            <div className="top-nav-options-context">
                <span className="top-nav-env">{environment}</span>
                {operationalProfiles.length > 1 ? (
                    <div className="top-nav-profile-switch" aria-label={pl.operationalProfiles.label}>
                        {operationalProfiles.map((profile) => (
                            <button
                                className={profile === operationalProfile ? "top-nav-profile-switch-active" : ""}
                                key={profile}
                                onClick={() => {
                                    onOperationalProfileChange(profile);
                                    setExpandedPanel(null);
                                }}
                                type="button"
                            >
                                {profile === "courier" ? pl.operationalProfiles.courierShort : pl.operationalProfiles.warehouseShort}
                            </button>
                        ))}
                    </div>
                ) : undefined}
            </div>

            <section className="top-nav-options-section">
                <span className="top-nav-options-title">{pl.navigation.mainAriaLabel}</span>
                <div className="top-nav-options-grid">{mainItems.map(renderPanelItem)}</div>
            </section>

            {menus.map((menu) => {
                if (!menuItems(menu).some((item) => isVisiblePath(item.path))) {
                    return null;
                }

                const Icon = menu.icon;
                const visibleItems = menu.items.filter((item) => isVisiblePath(item.path));
                return (
                    <section className="top-nav-options-section" key={menu.label}>
                        <span className="top-nav-options-title"><Icon fontSize="small" />{menu.label}</span>
                        {visibleItems.length ? <div className="top-nav-options-grid">{visibleItems.map(renderPanelItem)}</div> : null}
                        {visibleGroups(menu).map((group) => (
                            <div className="top-nav-options-group" key={group.key}>
                                <span className="top-nav-options-subtitle">{group.label}</span>
                                <div className="top-nav-options-grid">{group.items.map(renderPanelItem)}</div>
                            </div>
                        ))}
                    </section>
                );
            })}
        </nav>
    );

    const renderShipmentCreateButton = () => (
        operationalProfile === "warehouse" ? (
            <button
                className="top-nav-menu-primary"
                onClick={() => openTab({label: pl.navigation.shipmentCreate, path: "/shipments/create"})}
                type="button"
            >
                <Add fontSize="small" />
                <span>{pl.navigation.add}</span>
            </button>
        ) : null
    );

    const focusSubmenu = (groupKey: string) => {
        window.requestAnimationFrame(() => {
            document.querySelector<HTMLButtonElement>(`#${submenuId(groupKey)} .top-nav-option`)?.focus();
        });
    };

    const focusSubmenuTrigger = (groupKey: string) => {
        document.querySelector<HTMLButtonElement>(`[aria-controls="${submenuId(groupKey)}"]`)?.focus();
    };

    const renderCascadePanel = (menu: NavbarMenu) => {
        const Icon = menu.icon;
        const groups = visibleGroups(menu);
        const activeGroup = groups.find((group) => group.key === activeGroupKey)
            || groups.find((group) => group.items.some((item) => item.path === activePath))
            || groups[0];

        return (
            <nav aria-label={menu.label} className="top-nav-options-panel top-nav-category-panel top-nav-cascade-panel">
                <span className="top-nav-options-title"><Icon fontSize="small" />{menu.label}</span>
                <div className="top-nav-cascade">
                    <div aria-label={menu.label} className="top-nav-cascade-groups" role="group">
                        {groups.map((group) => {
                            const GroupIcon = group.icon;
                            const isActive = group.key === activeGroup?.key;
                            return (
                                <button
                                    aria-controls={submenuId(group.key)}
                                    aria-expanded={isActive}
                                    aria-haspopup="true"
                                    className={`top-nav-option top-nav-cascade-trigger${isActive ? " top-nav-option-active" : ""}`}
                                    key={group.key}
                                    onClick={() => setActiveGroupKey(group.key)}
                                    onFocus={() => setActiveGroupKey(group.key)}
                                    onKeyDown={(event) => {
                                        if (event.key === "ArrowRight") {
                                            event.preventDefault();
                                            setActiveGroupKey(group.key);
                                            focusSubmenu(group.key);
                                        }
                                    }}
                                    onMouseEnter={() => setActiveGroupKey(group.key)}
                                    title={pl.navigation.openSubmenu.replace("{label}", group.label)}
                                    type="button"
                                >
                                    <GroupIcon fontSize="small" />
                                    <span>{group.label}</span>
                                    <ChevronRight className="top-nav-cascade-chevron" fontSize="small" />
                                </button>
                            );
                        })}
                    </div>
                    {activeGroup ? (
                        <div
                            aria-label={activeGroup.label}
                            className="top-nav-cascade-items"
                            id={submenuId(activeGroup.key)}
                            onKeyDown={(event) => {
                                if (event.key === "ArrowLeft") {
                                    event.preventDefault();
                                    focusSubmenuTrigger(activeGroup.key);
                                }
                            }}
                            role="group"
                        >
                            {activeGroup.items.map(renderPanelItem)}
                            {activeGroup.key === SHIPMENTS_GROUP ? renderShipmentCreateButton() : null}
                        </div>
                    ) : null}
                </div>
            </nav>
        );
    };

    const renderCategoryPanel = (menu: NavbarMenu) => {
        if (menu.groups?.length) {
            return renderCascadePanel(menu);
        }
        const Icon = menu.icon;
        const visibleItems = menu.items.filter((item) => isVisiblePath(item.path));
        return (
            <nav aria-label={menu.label} className="top-nav-options-panel top-nav-category-panel">
                <span className="top-nav-options-title"><Icon fontSize="small" />{menu.label}</span>
                <div className="top-nav-options-grid">{visibleItems.map(renderPanelItem)}</div>
            </nav>
        );
    };

    const renderProfilePanel = () => (
        <section aria-label={pl.navigation.profile} className="top-nav-profile-panel">
            <div className="top-nav-theme-switch">
                <span>Motyw aplikacji</span>
                <div role="group" aria-label="Wybierz motyw aplikacji">
                    {([
                        ["system", pl.common.themes.system],
                        ["logistics-light", pl.common.themes.logisticsLight],
                        ["operations-dark", pl.common.themes.operationsDark],
                        ["warehouse", pl.common.themes.warehouse],
                        ["night-shift", pl.common.themes.nightShift],
                        ["neon-dark", pl.common.themes.neonDark],
                        ["cyberpunk", pl.common.themes.cyberpunk],
                        ["terminal-green", pl.common.themes.terminalGreen],
                        ["arctic-dark", pl.common.themes.arcticDark],
                        ["graphite-red", pl.common.themes.graphiteRed],
                        ["electric-blue", pl.common.themes.electricBlue],
                        ["ultraviolet", pl.common.themes.ultraviolet],
                        ["graphite-deep", pl.common.themes.graphiteDeep],
                        ["acid-lime", pl.common.themes.acidLime],
                        ["deep-ocean", pl.common.themes.deepOcean],
                        ["aubergine", pl.common.themes.aubergine],
                        ["midnight-blue", pl.common.themes.midnightBlue],
                        ["carbon", pl.common.themes.carbon],
                        ["courier-blue", pl.common.themes.courierBlue],
                    ] as Array<[AppTheme, string]>).map(([value, label]) => (
                        <button
                            aria-pressed={theme === value}
                            className={theme === value ? "top-nav-theme-active" : ""}
                            key={value}
                            onClick={() => setTheme(value)}
                            type="button"
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="top-nav-language-switch">
                <span>{pl.common.language}</span>
                <div>
                    {languages.map((currentLanguage) => (
                        <button
                            className={currentLanguage === language ? "top-nav-language-active" : ""}
                            key={currentLanguage}
                            onClick={() => onLanguageChange(currentLanguage)}
                            type="button"
                        >
                            {pl.common.languages[currentLanguage]}
                        </button>
                    ))}
                </div>
            </div>

            <button
                className="top-nav-dropdown-item"
                onClick={() => openTab({label: pl.navigation.profile, path: "/profile"})}
                type="button"
            >
                <Person fontSize="small" />
                <span>{pl.navigation.profile}</span>
            </button>

            <button
                className="top-nav-dropdown-item"
                onClick={() => {
                    setProfileMenuOpen(false);
                    emitOnboardingEvent({type: "tutorialRestartRequested"});
                }}
                type="button"
            >
                <InfoOutlined fontSize="small" />
                <span>{pl.onboarding.tutorial.restart}</span>
            </button>

            <button className="top-nav-dropdown-item top-nav-logout-item" onClick={logout} type="button">
                <Logout fontSize="small" />
                <span>{pl.navigation.logout}</span>
            </button>
        </section>
    );

    const renderExpandedContent = () => {
        if (expandedPanel === NAVIGATION_PANEL) {
            return renderNavigationPanel();
        }
        const menu = menus.find((item) => item.label === expandedPanel);
        return menu ? renderCategoryPanel(menu) : null;
    };

    const islandClassName = [
        "top-nav-island",
        expandedPanel ? "top-nav-island-expanded" : "",
        expandedPanel === NAVIGATION_PANEL ? "top-nav-island-expanded-from-package" : "",
        isScrolled ? "top-nav-island-scrolled" : "",
        expansionLeft !== null ? "top-nav-island-anchored" : "",
    ].filter(Boolean).join(" ");
    const islandStyle = expansionLeft !== null
        ? {"--top-nav-expansion-left": `${expansionLeft}px`} as React.CSSProperties
        : undefined;

    return (
        <header
            className={`top-nav-shell${isScrolled && !expandedPanel ? " top-nav-shell-scrolled" : ""}`}
            data-environment={environment}
            ref={navbarRef}
        >
            <div className={islandClassName} ref={islandRef} style={islandStyle}>
                <div className="top-nav-left" data-tour="main-menu">
                    <button
                        aria-controls="top-nav-island-panel"
                        aria-expanded={expandedPanel === NAVIGATION_PANEL}
                        aria-label={pl.navigation.mainAriaLabel}
                        className={`top-nav-menu-trigger${expandedPanel === NAVIGATION_PANEL ? " top-nav-menu-trigger-active" : ""}`}
                        onClick={() => {
                            setProfileMenuOpen(false);
                            setExpandedPanel((panel) => panel === NAVIGATION_PANEL ? null : NAVIGATION_PANEL);
                        }}
                        type="button"
                    >
                        <span className="top-nav-package-mark" aria-hidden="true">
                            <Inventory2 fontSize="small" />
                        </span>
                        <span className="top-nav-brand">Manager 2.0</span>
                    </button>
                </div>

                <div className="top-nav-dock" data-tour="quick-nav">
                    <nav aria-label={pl.navigation.mainAriaLabel} className="top-nav-quick-nav" ref={quickNavRef}>
                        <span aria-hidden="true" className="top-nav-dock-active-indicator" />
                        {mainItems.map(renderDockItem)}
                        {menus.map((menu) => {
                            if (!menuItems(menu).some((item) => isVisiblePath(item.path))) {
                                return null;
                            }

                            const Icon = menu.icon;
                            return (
                                <button
                                    aria-controls="top-nav-island-panel"
                                    aria-expanded={expandedPanel === menu.label}
                                    className="top-nav-dock-control"
                                    key={menu.label}
                                    onClick={() => {
                                        setProfileMenuOpen(false);
                                        setCreateMenuOpen(false);
                                        setActiveGroupKey(null);
                                        setExpandedPanel((panel) => panel === menu.label ? null : menu.label);
                                    }}
                                    title={menu.label}
                                    type="button"
                                >
                                    <Icon fontSize="small" />
                                    <span>{menu.label}</span>
                                    <ExpandMore className="top-nav-dock-chevron" fontSize="small" />
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="top-nav-island-expansion" id="top-nav-island-panel" ref={expansionRef}>
                    <div className="top-nav-island-expansion-content">
                        {renderExpandedContent()}
                    </div>
                </div>
            </div>

            <div className="top-nav-actions">
                <NavbarTrackingSearch onOpenTab={onOpenTab} />
                {user?.departmentCode ? (
                    <span
                        aria-label={`${actingOnBehalf ? pl.navigation.actingDepartment : pl.navigation.currentDepartment}: ${user.departmentCode}`}
                        className={`top-nav-department${actingOnBehalf ? " top-nav-department-acting" : ""}`}
                        title={actingOnBehalf ? pl.navigation.actingDepartment : pl.navigation.currentDepartment}
                    >
                        <WarehouseRounded aria-hidden="true" fontSize="small" />
                        <span>{user.departmentCode}</span>
                    </span>
                ) : null}
                {operationalProfile === "warehouse" ? (
                    <div className="top-nav-create-control" data-tour="create-menu">
                        <button
                            aria-controls="top-nav-create-menu"
                            aria-expanded={createMenuOpen}
                            aria-label={pl.navigation.createMenu}
                            className="top-nav-create-trigger"
                            onClick={() => {
                                setExpandedPanel(null);
                                setProfileMenuOpen(false);
                                setCreateMenuOpen((isOpen) => !isOpen);
                            }}
                            title={pl.navigation.createMenu}
                            type="button"
                        >
                            <Add fontSize="small" />
                        </button>
                        {createMenuOpen ? (
                            <nav aria-label={pl.navigation.createMenu} className="top-nav-create-menu" id="top-nav-create-menu">
                                <span className="top-nav-create-title">{pl.navigation.createMenu}</span>
                                {createItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            className="top-nav-dropdown-item"
                                            key={item.path}
                                            onClick={() => item.onSelect ? item.onSelect() : openTab({label: item.label, path: item.path})}
                                            type="button"
                                        >
                                            <Icon fontSize="small" />
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        ) : null}
                    </div>
                ) : null}
                <HomeModuleTiles onOpenTab={onOpenTab} operationalProfile={operationalProfile} />
                <ImpersonationConsentNotifications />
                <div className="top-nav-profile-control" data-tour="user-menu">
                    <button
                        aria-controls="top-nav-profile-panel"
                        aria-expanded={profileMenuOpen}
                        aria-label={userName}
                        className={`top-nav-user${profileMenuOpen ? " top-nav-user-active" : ""}`}
                        onClick={() => {
                            setExpandedPanel(null);
                            setCreateMenuOpen(false);
                            setProfileMenuOpen((isOpen) => !isOpen);
                        }}
                        type="button"
                    >
                        <span className="top-nav-user-avatar">{userInitials}</span>
                    </button>

                    {profileMenuOpen ? (
                        <div className="top-nav-profile-popover" id="top-nav-profile-panel">
                            <div className="top-nav-profile-popover-heading">
                                <span className="top-nav-user-avatar">{userInitials}</span>
                                <span><strong>{userName}</strong><small>{userRole}</small></span>
                            </div>
                            {renderProfilePanel()}
                        </div>
                    ) : null}
                </div>
            </div>
            <PalletCreateDialog
                open={palletCreateOpen}
                onClose={() => setPalletCreateOpen(false)}
                onOpenTab={onOpenTab}
            />
        </header>
    );
}

export default Navbar;
