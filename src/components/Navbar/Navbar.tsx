import React from 'react';
import {
    AccountBalance,
    Add,
    AdminPanelSettings,
    Analytics,
    Dashboard,
    DevicesOther,
    DirectionsCar,
    ExpandMore,
    Inventory2,
    Logout,
    LocalOffer,
    LocalShipping,
    NotificationsNone,
    Person,
    Settings,
    SettingsSuggest,
    ShoppingCart,
    Storefront,
    SupportAgent,
    TaskAlt,
    Warehouse,
} from '@mui/icons-material';
import {isPathAllowedForProfile, operationalProfiles, OperationalProfile} from "../../config/operationalProfile";
import {getAppEnvironment} from "../../config/appEnvironment";
import {AppTabDefinition} from "../AppShell/types";
import './styles/main.css';
import {clearAuthToken} from "../../auth/AuthTokenStorage";
import pl from "../../i18n/translate";
import {Language} from "../../i18n";

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
    onOpenTab: (tab: AppTabDefinition) => void;
    onLanguageChange: (language: Language) => void;
    onOperationalProfileChange: (profile: OperationalProfile) => void;
    language: Language;
    operationalProfile: OperationalProfile;
};

const languages: Language[] = ["pl", "en"];

function Navbar({activePath, onOpenTab, onLanguageChange, onOperationalProfileChange, language, operationalProfile}: NavbarProps) {
    const [openMenu, setOpenMenu] = React.useState<string | null>(null);
    const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);

    const environment = getAppEnvironment();
    const mainItems: NavbarItem[] = [
        {label: pl.navigation.home, path: '/', icon: Dashboard},
        {label: pl.navigation.tasks, path: '/processes', icon: TaskAlt},
        {label: pl.navigation.analytics, path: '/analytics', icon: Analytics},
    ];

    const menus: NavbarMenu[] = [
        {
            label: pl.navigation.shipments,
            icon: ShoppingCart,
            items: [
                {label: pl.home.tiles.shipmentControlCenter.title, path: '/shipment-control-center', icon: LocalShipping},
                {label: pl.navigation.shipmentList, path: '/shipments/list', icon: ShoppingCart},
                {label: pl.navigation.shipmentCreate, path: '/shipments/create', icon: LocalShipping},
                {label: pl.navigation.shipmentScanner, path: '/shipment-scanner', icon: Warehouse},
                {label: pl.navigation.courierDeliveries, path: '/courier-deliveries', icon: LocalShipping},
            ],
        },
        {
            label: pl.navigation.users,
            icon: Person,
            items: [
                {label: pl.navigation.suppliers, path: '/suppliers', icon: Storefront},
                {label: pl.navigation.couriers, path: '/couriers', icon: Person},
                {label: pl.navigation.vehicles, path: '/vehicles', icon: DirectionsCar},
                {label: pl.navigation.pallets, path: '/pallets', icon: Inventory2},
                {label: pl.navigation.devicePairing, path: '/device-pairing', icon: DevicesOther},
            ],
        },
        {
            label: pl.navigation.management,
            icon: Settings,
            items: [
                {label: pl.navigation.deals, path: '/deals', icon: LocalOffer},
                {label: pl.navigation.billing, path: '/billing', icon: AccountBalance},
                {label: pl.navigation.admins, path: '/users', icon: AdminPanelSettings},
                {label: pl.navigation.systemSettings, path: '/software-configurations', icon: SettingsSuggest},
                {label: pl.navigation.support, path: '/support', icon: SupportAgent},
            ],
        },
    ];

    const logout = () => {
        clearAuthToken();
        setProfileMenuOpen(false);
        window.location.assign("/login");
    };

    const openTab = (tab: AppTabDefinition) => {
        onOpenTab(tab);
        setOpenMenu(null);
        setProfileMenuOpen(false);
    };

    const renderTopItem = (item: NavbarItem) => {
        if (!isPathAllowedForProfile(item.path, operationalProfile)) {
            return null;
        }

        const Icon = item.icon;
        const isActive = activePath === item.path;

        return (
            <button
                className={`top-nav-link${isActive ? ' top-nav-link-active' : ''}`}
                key={item.path}
                onClick={() => openTab(item)}
                type="button"
            >
                <Icon fontSize="small" />
                <span>{item.label}</span>
            </button>
        );
    };

    return (
        <header className="top-nav-shell" data-environment={environment}>
            <div className="top-nav-brand">
                <span className="top-nav-brand-icon">
                    <Inventory2 fontSize="small" />
                </span>
                <span>{pl.common.brand}</span>
            </div>

            <nav className="top-nav-menu" aria-label={pl.navigation.mainAriaLabel}>
                {mainItems.map(renderTopItem)}

                {menus.map((menu) => {
                    const visibleItems = menu.items.filter((item) => isPathAllowedForProfile(item.path, operationalProfile));
                    if (!visibleItems.length) {
                        return null;
                    }

                    const Icon = menu.icon;
                    const isActive = visibleItems.some((item) => activePath === item.path);
                    const isOpen = openMenu === menu.label;

                    return (
                        <div className="top-nav-dropdown" key={menu.label}>
                            <button
                                className={`top-nav-link${isActive ? ' top-nav-link-active' : ''}`}
                                onClick={() => {
                                    setProfileMenuOpen(false);
                                    setOpenMenu(isOpen ? null : menu.label);
                                }}
                                type="button"
                            >
                                <Icon fontSize="small" />
                                <span>{menu.label}</span>
                                <ExpandMore fontSize="small" />
                            </button>

                            {isOpen ? (
                                <div className="top-nav-dropdown-panel">
                                    {visibleItems.map((item) => {
                                        const ItemIcon = item.icon;

                                        return (
                                            <button
                                                className="top-nav-dropdown-item"
                                                key={item.path}
                                                onClick={() => openTab(item)}
                                                type="button"
                                            >
                                                <ItemIcon fontSize="small" />
                                                <span>{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </nav>

            <div className="top-nav-actions">
                <span className="top-nav-env">{environment}</span>

                <div className="top-nav-profile-switch" aria-label={pl.operationalProfiles.label}>
                    {operationalProfiles.map((profile) => (
                        <button
                            className={profile === operationalProfile ? "top-nav-profile-switch-active" : ""}
                            key={profile}
                            onClick={() => onOperationalProfileChange(profile)}
                            type="button"
                        >
                            {profile === "courier" ? pl.operationalProfiles.courierShort : pl.operationalProfiles.warehouseShort}
                        </button>
                    ))}
                </div>

                {operationalProfile === "warehouse" ? (
                    <button
                        className="top-nav-primary-action"
                        onClick={() => openTab({label: pl.navigation.shipmentCreate, path: "/shipments/create"})}
                        type="button"
                    >
                        <Add fontSize="small" />
                        <span>{pl.navigation.add}</span>
                    </button>
                ) : (
                    <button
                        className="top-nav-primary-action"
                        onClick={() => openTab({label: pl.navigation.courierDeliveries, path: "/courier-deliveries"})}
                        type="button"
                    >
                        <LocalShipping fontSize="small" />
                        <span>{pl.navigation.courierDeliveries}</span>
                    </button>
                )}

                <button className="top-nav-icon-button" type="button" aria-label={pl.navigation.notifications}>
                    <NotificationsNone fontSize="small" />
                </button>

                <div className="top-nav-dropdown">
                    <button
                        className="top-nav-user"
                        onClick={() => {
                            setOpenMenu(null);
                            setProfileMenuOpen((prev) => !prev);
                        }}
                        type="button"
                    >
                        <span className="top-nav-user-avatar">
                            <Person fontSize="small" />
                        </span>
                        <span>
                            <strong>{pl.navigation.defaultUserName}</strong>
                            <small>{pl.navigation.defaultUserRole}</small>
                        </span>
                        <ExpandMore fontSize="small" />
                    </button>

                    {profileMenuOpen ? (
                        <div className="top-nav-dropdown-panel top-nav-profile-panel">
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
                                className="top-nav-dropdown-item top-nav-logout-item"
                                onClick={logout}
                                type="button"
                            >
                                <Logout fontSize="small" />
                                <span>{pl.navigation.logout}</span>
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </header>
    );
}

export default Navbar;
