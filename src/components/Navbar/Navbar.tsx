import React from 'react';
import {
    AccountBalance,
    Add,
    AdminPanelSettings,
    Analytics,
    AccountTree,
    Dashboard,
    DevicesOther,
    ExpandMore,
    Inventory2,
    Logout,
    LocalOffer,
    LocalShipping,
    Loop,
    Person,
    Radar,
    Settings,
    SettingsSuggest,
    ShoppingCart,
    SupportAgent,
    TaskAlt,
    WarehouseRounded,
} from "components/ui/icons";
import {isPathAllowedForProfile, operationalProfiles, OperationalProfile} from "../../config/operationalProfile";
import {getAppEnvironment} from "../../config/appEnvironment";
import {getAppVersion} from "../../config/appVersion";
import {AppTabDefinition} from "../AppShell/types";
import AppTabs from "../AppShell/AppTabs";
import './styles/main.css';
import {logoutAuthSession} from "../../auth/AuthSession";
import {clearAnnouncementDismissal} from "../Announcements/announcementStorage";
import {useAuthState} from "../../auth/AuthState";
import pl from "../../i18n/translate";
import {Language, translations} from "../../i18n";
import {clearStoredTabs} from "../AppShell/tabStorage";
import {AppTheme, useAppTheme} from "../../theme/ThemeProvider";

type NavbarItem = AppTabDefinition & {
    icon: React.ElementType;
};

type NavbarMenu = {
    label: string;
    icon: React.ElementType;
    items: NavbarItem[];
};

type NavbarProps = {
    activePath: string;
    openTabs: AppTabDefinition[];
    onCloseAllTabs: () => void;
    onCloseTab: (path: string) => void;
    onOpenTab: (tab: AppTabDefinition) => void;
    onLanguageChange: (language: Language) => void;
    onOperationalProfileChange: (profile: OperationalProfile) => void;
    onSelectTab: (path: string) => void;
    language: Language;
    operationalProfile: OperationalProfile;
};

const languages = Object.keys(translations) as Language[];
const NAVIGATION_PANEL = "navigation";

function Navbar({
    activePath,
    openTabs,
    onCloseAllTabs,
    onCloseTab,
    onOpenTab,
    onLanguageChange,
    onOperationalProfileChange,
    onSelectTab,
    language,
    operationalProfile,
}: NavbarProps) {
    const [expandedPanel, setExpandedPanel] = React.useState<string | null>(null);
    const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
    const [isScrolled, setIsScrolled] = React.useState(false);
    const navbarRef = React.useRef<HTMLElement>(null);
    const quickNavRef = React.useRef<HTMLElement>(null);
    const {user} = useAuthState();
    const {theme, setTheme} = useAppTheme();

    const environment = getAppEnvironment();
    const appVersion = getAppVersion();
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
    ];
    const menus: NavbarMenu[] = [
        {
            label: pl.navigation.shipments,
            icon: ShoppingCart,
            items: [
                {label: pl.home.tiles.shipmentDetails.title, path: '/shipment-details', icon: LocalShipping},
                {label: pl.navigation.shipmentList, path: '/shipments/list', icon: ShoppingCart},
                {label: pl.navigation.returns, path: '/returns', icon: Loop},
                {label: pl.navigation.shipmentCreate, path: '/shipments/create', icon: LocalShipping},
                {label: pl.navigation.shipmentScanner, path: '/shipment-scanner', icon: WarehouseRounded},
                {label: pl.navigation.courierDeliveries, path: '/courier-deliveries', icon: LocalShipping},
            ],
        },
        {
            label: pl.navigation.organization,
            icon: AccountTree,
            items: [
                {label: pl.navigation.users, path: '/users', icon: AdminPanelSettings},
                {label: pl.navigation.departments, path: '/depots', icon: WarehouseRounded},
                {label: pl.navigation.couriers, path: '/couriers', icon: Person},
                {label: pl.navigation.devicePairing, path: '/device-pairing', icon: DevicesOther},
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
                {label: pl.navigation.microservices, path: '/microservices', icon: Radar},
                {label: pl.navigation.systemSettings, path: '/software-configurations', icon: SettingsSuggest},
                {label: pl.navigation.support, path: '/support', icon: SupportAgent},
            ],
        },
    ];

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
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setExpandedPanel(null);
                setProfileMenuOpen(false);
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
    };

    const renderPanelItem = (item: NavbarItem) => {
        if (!isPathAllowedForProfile(item.path, operationalProfile)) {
            return null;
        }

        const Icon = item.icon;
        return (
            <button
                className="top-nav-option"
                key={item.path}
                onClick={() => openTab(item)}
                type="button"
            >
                <Icon fontSize="small" />
                <span>{item.label}</span>
            </button>
        );
    };

    const renderDockItem = (item: NavbarItem) => {
        if (!isPathAllowedForProfile(item.path, operationalProfile)) {
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
            </div>

            <section className="top-nav-options-section">
                <span className="top-nav-options-title">{pl.navigation.mainAriaLabel}</span>
                <div className="top-nav-options-grid">{mainItems.map(renderPanelItem)}</div>
            </section>

            {menus.map((menu) => {
                const visibleItems = menu.items.filter((item) => isPathAllowedForProfile(item.path, operationalProfile));
                if (!visibleItems.length) {
                    return null;
                }

                const Icon = menu.icon;
                return (
                    <section className="top-nav-options-section" key={menu.label}>
                        <span className="top-nav-options-title"><Icon fontSize="small" />{menu.label}</span>
                        <div className="top-nav-options-grid">{visibleItems.map(renderPanelItem)}</div>
                    </section>
                );
            })}
        </nav>
    );

    const renderCategoryPanel = (menu: NavbarMenu) => {
        const Icon = menu.icon;
        const visibleItems = menu.items.filter((item) => isPathAllowedForProfile(item.path, operationalProfile));
        return (
            <nav aria-label={menu.label} className="top-nav-options-panel top-nav-category-panel">
                <span className="top-nav-options-title"><Icon fontSize="small" />{menu.label}</span>
                <div className="top-nav-options-grid">{visibleItems.map(renderPanelItem)}</div>
                {operationalProfile === "warehouse" && menu.label === pl.navigation.shipments ? (
                    <button
                        className="top-nav-menu-primary"
                        onClick={() => openTab({label: pl.navigation.shipmentCreate, path: "/shipments/create"})}
                        type="button"
                    >
                        <Add fontSize="small" />
                        <span>{pl.navigation.add}</span>
                    </button>
                ) : null}
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
                        ["courier-blue", pl.common.themes.courierBlue],
                        ["dispatch-teal", pl.common.themes.dispatchTeal],
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

            <div className="top-nav-version"><span>{pl.common.version}</span><strong>{appVersion}</strong></div>

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
    ].filter(Boolean).join(" ");

    return (
        <header
            className={`top-nav-shell${isScrolled && !expandedPanel ? " top-nav-shell-scrolled" : ""}`}
            data-environment={environment}
            ref={navbarRef}
        >
            <div className={islandClassName}>
                <div className="top-nav-left">
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

                <div className="top-nav-dock">
                    <nav aria-label={pl.navigation.mainAriaLabel} className="top-nav-quick-nav" ref={quickNavRef}>
                        <span aria-hidden="true" className="top-nav-dock-active-indicator" />
                        {mainItems.map(renderDockItem)}
                        {menus.map((menu) => {
                            const visibleItems = menu.items.filter((item) => isPathAllowedForProfile(item.path, operationalProfile));
                            if (!visibleItems.length) {
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

                    <AppTabs
                        activePath={activePath}
                        onCloseAllTabs={onCloseAllTabs}
                        onCloseTab={onCloseTab}
                        onSelectTab={onSelectTab}
                        openTabs={openTabs}
                    />
                </div>

                <div className="top-nav-island-expansion" id="top-nav-island-panel">
                    <div className="top-nav-island-expansion-content">
                        {renderExpandedContent()}
                    </div>
                </div>
            </div>

            <div className="top-nav-actions">
                <div className="top-nav-profile-control">
                    <button
                        aria-controls="top-nav-profile-panel"
                        aria-expanded={profileMenuOpen}
                        aria-label={userName}
                        className={`top-nav-user${profileMenuOpen ? " top-nav-user-active" : ""}`}
                        onClick={() => {
                            setExpandedPanel(null);
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
        </header>
    );
}

export default Navbar;
