import React from 'react';
import {
    AccountBalance,
    Add,
    AdminPanelSettings,
    Analytics,
    Dashboard,
    DirectionsCar,
    ExpandMore,
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
} from '@mui/icons-material';
import {getAppEnvironment} from "../../config/appEnvironment";
import {AppTabDefinition} from "../AppShell/types";
import './styles/main.css';

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
};

const mainItems: NavbarItem[] = [
    {label: 'Strona startowa', path: '/', icon: Dashboard},
    {label: 'Zadania', path: '/routes', icon: TaskAlt},
    {label: 'Analityka', path: '/analytics', icon: Analytics},
];

const menus: NavbarMenu[] = [
    {
        label: 'Przesyłki',
        icon: ShoppingCart,
        items: [
            {label: 'Lista przesyłek', path: '/shipments/list', icon: ShoppingCart},
            {label: 'Utwórz przesyłkę', path: '/shipments/create', icon: LocalShipping},
        ],
    },
    {
        label: 'Użytkownicy',
        icon: Person,
        items: [
            {label: 'Dostawcy', path: '/suppliers', icon: Storefront},
            {label: 'Kierowcy', path: '/users', icon: Person},
            {label: 'Pojazdy', path: '/depots', icon: DirectionsCar},
        ],
    },
    {
        label: 'Zarządzanie',
        icon: Settings,
        items: [
            {label: 'Promocje', path: '/deals', icon: LocalOffer},
            {label: 'Płatności', path: '/billing', icon: AccountBalance},
            {label: 'Administratorzy', path: '/users', icon: AdminPanelSettings},
            {label: 'Software', path: '/software-configurations', icon: SettingsSuggest},
            {label: 'Support', path: '/support', icon: SupportAgent},
        ],
    },
];

function Navbar({activePath, onOpenTab}: NavbarProps) {
    const [openMenu, setOpenMenu] = React.useState<string | null>(null);
    const environment = getAppEnvironment();

    const openTab = (tab: AppTabDefinition) => {
        onOpenTab(tab);
        setOpenMenu(null);
    };

    const renderTopItem = (item: NavbarItem) => {
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
                <span className="top-nav-brand-icon"><ShoppingCart fontSize="small" /></span>
                <span>Manager 2.0</span>
            </div>

            <nav className="top-nav-menu" aria-label="Main navigation">
                {mainItems.map(renderTopItem)}
                {menus.map((menu) => {
                    const Icon = menu.icon;
                    const isActive = menu.items.some((item) => activePath === item.path);
                    const isOpen = openMenu === menu.label;

                    return (
                        <div className="top-nav-dropdown" key={menu.label}>
                            <button
                                className={`top-nav-link${isActive ? ' top-nav-link-active' : ''}`}
                                onClick={() => setOpenMenu(isOpen ? null : menu.label)}
                                type="button"
                            >
                                <Icon fontSize="small" />
                                <span>{menu.label}</span>
                                <ExpandMore fontSize="small" />
                            </button>
                            {isOpen ? (
                                <div className="top-nav-dropdown-panel">
                                    {menu.items.map((item) => {
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
                <button
                    className="top-nav-primary-action"
                    onClick={() => openTab({label: "Utwórz przesyłkę", path: "/shipments/create"})}
                    type="button"
                >
                    <Add fontSize="small" />
                    <span>Dodaj</span>
                </button>
                <button className="top-nav-icon-button" type="button" aria-label="Powiadomienia">
                    <NotificationsNone fontSize="small" />
                </button>
                <button
                    className="top-nav-user"
                    onClick={() => openTab({label: "Mój profil", path: "/profile"})}
                    type="button"
                >
                    <span className="top-nav-user-avatar"><Person fontSize="small" /></span>
                    <span>
                        <strong>Admin</strong>
                        <small>S. ADMIN</small>
                    </span>
                    <ExpandMore fontSize="small" />
                </button>
            </div>
        </header>
    );
}

export default Navbar;
