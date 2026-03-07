import React from "react";
import {
    AccountTree,
    Analytics,
    Business,
    ChevronRight,
    DevicesOther,
    DirectionsCar,
    Inventory2,
    LocalShipping,
    Person,
    SettingsSuggest,
    TableRows,
    Warehouse,
} from "@mui/icons-material";
import {useNavigate} from "react-router-dom";
import {isPathAllowedForProfile, OperationalProfile} from "../../config/operationalProfile";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "../AppShell/types";
import "./styles/home-dashboard.css";

type HomeTileKey = keyof typeof pl.home.tiles;

type HomeTile = {
    key: HomeTileKey;
    path: string;
    icon: React.ElementType;
    accent: string;
};

type HomeDashboardProps = {
    onOpenTab?: (tab: AppTabDefinition) => void;
    operationalProfile: OperationalProfile;
};

const homeTiles: HomeTile[] = [
    {key: "shipmentControlCenter", path: "/shipment-control-center", icon: Warehouse, accent: "blue"},
    {key: "shipmentList", path: "/shipments/list", icon: TableRows, accent: "cyan"},
    {key: "shipmentScanner", path: "/shipment-scanner", icon: Warehouse, accent: "teal"},
    {key: "courierDeliveries", path: "/courier-deliveries", icon: LocalShipping, accent: "emerald"},
    {key: "systemSettings", path: "/software-configurations", icon: SettingsSuggest, accent: "violet"},
    {key: "profile", path: "/profile", icon: Person, accent: "slate"},
    {key: "devicePairing", path: "/device-pairing", icon: DevicesOther, accent: "indigo"},
    {key: "processes", path: "/processes", icon: AccountTree, accent: "amber"},
    {key: "couriers", path: "/couriers", icon: LocalShipping, accent: "emerald"},
    {key: "vehicles", path: "/vehicles", icon: DirectionsCar, accent: "indigo"},
    {key: "departments", path: "/depots", icon: Business, accent: "teal"},
    {key: "pallets", path: "/pallets", icon: Inventory2, accent: "rose"},
    {key: "analytics", path: "/analytics", icon: Analytics, accent: "orange"},
];

function HomeDashboard({onOpenTab, operationalProfile}: HomeDashboardProps) {
    const navigate = useNavigate();
    const visibleTiles = homeTiles.filter((tile) => isPathAllowedForProfile(tile.path, operationalProfile));

    const openTile = (tile: HomeTile) => {
        const translation = pl.home.tiles[tile.key];
        const tab = {
            label: translation.title,
            path: tile.path,
        };

        if (onOpenTab) {
            onOpenTab(tab);
            return;
        }

        navigate(tab.path);
    };

    return (
        <main className="home-dashboard-page">
            <section className="home-dashboard-hero">
                <div className="home-dashboard-heading">
                    <span className="home-dashboard-kicker">{pl.common.brand}</span>
                    <h1>{pl.home.title}</h1>
                    <p>{pl.home.subtitle}</p>
                </div>
                <div className="home-dashboard-summary">
                    <strong>{visibleTiles.length}</strong>
                    <span>{pl.home.moduleCountLabel}</span>
                </div>
            </section>

            <section className="home-tile-grid" aria-label={pl.home.title}>
                {visibleTiles.map((tile) => {
                    const Icon = tile.icon;
                    const translation = pl.home.tiles[tile.key];

                    return (
                        <button
                            className={`home-tile home-tile-${tile.accent}`}
                            key={tile.key}
                            onClick={() => openTile(tile)}
                            type="button"
                        >
                            <span className="home-tile-icon">
                                <Icon fontSize="small" />
                            </span>
                            <span className="home-tile-content">
                                <strong>{translation.title}</strong>
                                <small>{translation.description}</small>
                            </span>
                            <span className="home-tile-action">
                                <span>{pl.home.openTile}</span>
                                <ChevronRight fontSize="small" />
                            </span>
                        </button>
                    );
                })}
            </section>
        </main>
    );
}

export default HomeDashboard;
