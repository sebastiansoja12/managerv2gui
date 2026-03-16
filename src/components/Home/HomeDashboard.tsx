import React, {FormEvent, useState} from "react";
import {
    AccountTree,
    Analytics,
    History,
    Business,
    ChevronRight,
    DevicesOther,
    DirectionsCar,
    Inventory2,
    LocalShipping,
    Person,
    Search,
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
    {key: "shipmentDetails", path: "/shipment-details", icon: Warehouse, accent: "blue"},
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
    const [trackingNumber, setTrackingNumber] = useState("");
    const visibleTiles = homeTiles.filter((tile) => isPathAllowedForProfile(tile.path, operationalProfile));
    const trimmedTrackingNumber = trackingNumber.trim();

    const openTab = (tab: AppTabDefinition) => {
        if (onOpenTab) {
            onOpenTab(tab);
            return;
        }

        navigate(tab.path);
    };

    const openTile = (tile: HomeTile) => {
        const translation = pl.home.tiles[tile.key];
        openTab({
            label: translation.title,
            path: tile.path,
        });
    };

    const openShipmentByTrackingNumber = (view: "details" | "history") => {
        if (!trimmedTrackingNumber) {
            return;
        }

        const encodedTrackingNumber = encodeURIComponent(trimmedTrackingNumber);
        const tabLabelTemplate = view === "details"
            ? pl.home.trackingLookup.detailsTabLabel
            : pl.home.trackingLookup.historyTabLabel;
        const path = view === "details"
            ? `/shipments/tracking/${encodedTrackingNumber}/edit`
            : `/shipments/tracking/${encodedTrackingNumber}/history`;

        openTab({
            label: tabLabelTemplate.replace("{trackingNumber}", trimmedTrackingNumber),
            path,
        });
    };

    const searchShipment = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        openShipmentByTrackingNumber("details");
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

            <section className="home-tracking-lookup" aria-label={pl.home.trackingLookup.ariaLabel}>
                <div className="home-tracking-lookup-intro">
                    <span className="home-tracking-lookup-icon">
                        <LocalShipping fontSize="small" />
                    </span>
                    <div>
                        <span>{pl.home.trackingLookup.kicker}</span>
                        <strong>{pl.home.trackingLookup.title}</strong>
                    </div>
                </div>

                <form className="home-tracking-lookup-form" onSubmit={searchShipment}>
                    <input
                        aria-label={pl.home.trackingLookup.inputLabel}
                        placeholder={pl.home.trackingLookup.placeholder}
                        type="text"
                        value={trackingNumber}
                        onChange={(event) => setTrackingNumber(event.target.value)}
                    />
                    <button className="home-tracking-primary" disabled={!trimmedTrackingNumber} type="submit">
                        <Search fontSize="small" />
                        <span>{pl.home.trackingLookup.search}</span>
                    </button>
                    <button
                        className="home-tracking-secondary"
                        disabled={!trimmedTrackingNumber}
                        type="button"
                        onClick={() => openShipmentByTrackingNumber("history")}
                    >
                        <History fontSize="small" />
                        <span>{pl.home.trackingLookup.showHistory}</span>
                    </button>
                </form>
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
