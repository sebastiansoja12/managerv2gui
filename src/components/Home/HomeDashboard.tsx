import React, {FormEvent, useState} from "react";
import {
    AccountTree,
    Analytics,
    History,
    Business,
    ChatBubbleOutline,
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
} from "components/ui/icons";
import {MenuItem, TextField} from "components/ui";
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

type ShipmentLookupCriterion = "TRACKING_NUMBER" | "SHIPMENT_ID";

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

function HomeDashboard({onOpenTab, operationalProfile}: HomeDashboardProps) {
    const navigate = useNavigate();
    const [lookupCriterion, setLookupCriterion] = useState<ShipmentLookupCriterion>("TRACKING_NUMBER");
    const [lookupValue, setLookupValue] = useState("");
    const visibleTiles = homeTiles.filter((tile) => isPathAllowedForProfile(tile.path, operationalProfile));
    const trimmedLookupValue = lookupValue.trim();
    const validLookupValue = Boolean(trimmedLookupValue)
        && (lookupCriterion === "TRACKING_NUMBER" || /^\d+$/.test(trimmedLookupValue));

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

    const openShipment = (view: "details" | "history") => {
        if (!validLookupValue) {
            return;
        }

        const encodedValue = encodeURIComponent(trimmedLookupValue);
        const searchingByTrackingNumber = lookupCriterion === "TRACKING_NUMBER";
        const tabLabelTemplate = searchingByTrackingNumber
            ? (view === "details"
                ? pl.home.trackingLookup.detailsTabLabel
                : pl.home.trackingLookup.historyTabLabel)
            : (view === "details"
                ? pl.home.trackingLookup.detailsByIdTabLabel
                : pl.home.trackingLookup.historyByIdTabLabel);
        const path = searchingByTrackingNumber
            ? (view === "details"
                ? `/shipments/tracking/${encodedValue}/edit`
                : `/shipments/tracking/${encodedValue}/history`)
            : (view === "details"
                ? `/shipments/${encodedValue}/edit`
                : `/shipments/${encodedValue}/history`);

        openTab({
            label: tabLabelTemplate
                .replace("{trackingNumber}", trimmedLookupValue)
                .replace("{shipmentId}", trimmedLookupValue),
            path,
        });
    };

    const searchShipment = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        openShipment("details");
    };

    return (
        <main className="home-dashboard-page">
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
                    <div className="home-tracking-criterion">
                        <span>{pl.home.trackingLookup.criterionLabel}</span>
                        <TextField
                            aria-label={pl.home.trackingLookup.criterionLabel}
                            select
                            size="small"
                            value={lookupCriterion}
                            onChange={(event) => {
                                setLookupCriterion(event.target.value as ShipmentLookupCriterion);
                                setLookupValue("");
                            }}
                        >
                            <MenuItem value="TRACKING_NUMBER">
                                {pl.home.trackingLookup.criteria.trackingNumber}
                            </MenuItem>
                            <MenuItem value="SHIPMENT_ID">
                                {pl.home.trackingLookup.criteria.shipmentId}
                            </MenuItem>
                        </TextField>
                    </div>
                    <label className="home-tracking-value">
                        <span>{lookupCriterion === "TRACKING_NUMBER"
                            ? pl.home.trackingLookup.inputLabel
                            : pl.home.trackingLookup.shipmentIdInputLabel}</span>
                        <input
                            aria-label={lookupCriterion === "TRACKING_NUMBER"
                                ? pl.home.trackingLookup.inputLabel
                                : pl.home.trackingLookup.shipmentIdInputLabel}
                            inputMode={lookupCriterion === "SHIPMENT_ID" ? "numeric" : "text"}
                            pattern={lookupCriterion === "SHIPMENT_ID" ? "[0-9]*" : undefined}
                            placeholder={lookupCriterion === "TRACKING_NUMBER"
                                ? pl.home.trackingLookup.placeholder
                                : pl.home.trackingLookup.shipmentIdPlaceholder}
                            type="text"
                            value={lookupValue}
                            onChange={(event) => setLookupValue(event.target.value)}
                        />
                    </label>
                    <button className="home-tracking-primary" disabled={!validLookupValue} type="submit">
                        <Search fontSize="small" />
                        <span>{pl.home.trackingLookup.search}</span>
                    </button>
                    <button
                        className="home-tracking-secondary"
                        disabled={!validLookupValue}
                        type="button"
                        onClick={() => openShipment("history")}
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
