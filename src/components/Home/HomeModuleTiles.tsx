import React, {useEffect, useState} from "react";
import {
    AccountTree,
    Analytics,
    Business,
    ChatBubbleOutline,
    ChevronRight,
    Close,
    DevicesOther,
    DirectionsCar,
    History,
    Inventory2,
    LocalShipping,
    Person,
    SettingsSuggest,
    TableRows,
    Warehouse,
} from "components/ui/icons";
import {useNavigate} from "react-router-dom";
import {isPathAllowedForProfile, OperationalProfile} from "../../config/operationalProfile";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "../AppShell/types";
import "./styles/home-module-menu.css";

type HomeTileKey = keyof typeof pl.home.tiles;

type HomeTile = {
    key: HomeTileKey;
    path: string;
    icon: React.ElementType;
    accent: string;
};

type HomeModuleTilesProps = {
    onOpenTab?: (tab: AppTabDefinition) => void;
    operationalProfile: OperationalProfile;
};

const homeTiles: HomeTile[] = [
    {key: "shipmentDetails", path: "/shipment-details", icon: Warehouse, accent: "blue"},
    {key: "shipmentList", path: "/shipments/list", icon: TableRows, accent: "cyan"},
    {key: "returns", path: "/returns", icon: History, accent: "rose"},
    {key: "shipmentScanner", path: "/shipment-scanner", icon: Warehouse, accent: "teal"},
    {key: "courierDeliveries", path: "/courier-deliveries", icon: LocalShipping, accent: "emerald"},
    {key: "systemSettings", path: "/software-configurations", icon: SettingsSuggest, accent: "violet"},
    {key: "profile", path: "/profile", icon: Person, accent: "slate"},
    {key: "chat", path: "/chat", icon: ChatBubbleOutline, accent: "violet"},
    {key: "devicePairing", path: "/device-pairing", icon: DevicesOther, accent: "indigo"},
    {key: "processes", path: "/processes", icon: AccountTree, accent: "amber"},
    {key: "couriers", path: "/couriers", icon: LocalShipping, accent: "emerald"},
    {key: "vehicles", path: "/vehicles", icon: DirectionsCar, accent: "indigo"},
    {key: "departments", path: "/depots", icon: Business, accent: "teal"},
    {key: "pallets", path: "/pallets", icon: Inventory2, accent: "rose"},
    {key: "analytics", path: "/analytics", icon: Analytics, accent: "orange"},
];

function HomeModuleTiles({onOpenTab, operationalProfile}: HomeModuleTilesProps) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const visibleTiles = homeTiles.filter((tile) => isPathAllowedForProfile(tile.path, operationalProfile));

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [open]);

    const openTile = (tile: HomeTile) => {
        const translation = pl.home.tiles[tile.key];
        const tab = {label: translation.title, path: tile.path};
        if (onOpenTab) {
            onOpenTab(tab);
            setOpen(false);
            return;
        }
        navigate(tile.path);
        setOpen(false);
    };

    return (
        <>
            {!open ? (
                <button
                    aria-controls="home-module-menu"
                    aria-expanded="false"
                    aria-label={pl.home.dashboard.quickLinks.open}
                    className="home-module-menu-trigger"
                    onClick={() => setOpen(true)}
                    type="button"
                >
                    <ChevronRight aria-hidden="true" className="home-module-menu-trigger-arrow" fontSize="small" />
                </button>
            ) : undefined}
            <button
                aria-label={pl.home.dashboard.quickLinks.close}
                className={`home-module-menu-backdrop${open ? " is-open" : ""}`}
                onClick={() => setOpen(false)}
                tabIndex={open ? 0 : -1}
                type="button"
            />
            <aside
                aria-hidden={!open}
                aria-label={pl.home.dashboard.quickLinks.title}
                className={`home-module-menu${open ? " is-open" : ""}`}
                id="home-module-menu"
            >
                <header className="home-module-menu-header">
                    <div>
                        <span className="home-dashboard-kicker">{pl.home.dashboard.quickLinks.kicker}</span>
                        <h2>{pl.home.dashboard.quickLinks.title}</h2>
                    </div>
                    <button
                        aria-label={pl.home.dashboard.quickLinks.close}
                        onClick={() => setOpen(false)}
                        type="button"
                    >
                        <Close fontSize="small" />
                    </button>
                </header>
                <div className="home-module-menu-grid" aria-label={pl.home.title}>
                    {visibleTiles.map((tile) => {
                        const Icon = tile.icon;
                        const translation = pl.home.tiles[tile.key];
                        return (
                            <button
                                className={`home-module-menu-tile home-tile-${tile.accent}`}
                                key={tile.key}
                                onClick={() => openTile(tile)}
                                tabIndex={open ? 0 : -1}
                                type="button"
                            >
                                <span className="home-tile-icon"><Icon fontSize="small" /></span>
                                <span className="home-tile-content">
                                    <strong>{translation.title}</strong>
                                    <small>{translation.description}</small>
                                </span>
                                <ChevronRight fontSize="small" />
                            </button>
                        );
                    })}
                </div>
            </aside>
        </>
    );
}

export default HomeModuleTiles;
