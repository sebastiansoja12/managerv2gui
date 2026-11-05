import React from "react";
import {
    AccountTree,
    AdminPanelSettings,
    Analytics,
    ChatBubbleOutline,
    Dashboard,
    DevicesOther,
    Inventory2,
    LocalShipping,
    LocationOn,
    Loop,
    Person,
    QrCodeScanner,
    ReportProblemOutlined,
    Route,
    Settings,
    ShoppingCart,
    SupportAgent,
    TaskAlt,
    WarehouseRounded,
} from "components/ui/icons";

// Ordered from the most specific prefix, so the first match wins.
const tabIconsByPathPrefix: Array<[string, React.ElementType]> = [
    ["/pallets/scan", QrCodeScanner],
    ["/shipment-scanner", QrCodeScanner],
    ["/shipment-route", Route],
    ["/pallets", Inventory2],
    ["/shipments", ShoppingCart],
    ["/shipment-details", LocalShipping],
    ["/shipment-control-center", LocalShipping],
    ["/parcels", ShoppingCart],
    ["/returns", Loop],
    ["/incidents", ReportProblemOutlined],
    ["/fleet-map", LocationOn],
    ["/deliveries/incomplete", ReportProblemOutlined],
    ["/deliveries", LocalShipping],
    ["/courier-deliveries", LocalShipping],
    ["/carriers", LocalShipping],
    ["/drivers", Person],
    ["/couriers", Person],
    ["/users", AdminPanelSettings],
    ["/depots", WarehouseRounded],
    ["/pickup-points", LocationOn],
    ["/device-pairing", DevicesOther],
    ["/processes", TaskAlt],
    ["/chat", ChatBubbleOutline],
    ["/analytics", Analytics],
    ["/support", SupportAgent],
    ["/profile", Person],
    ["/my-settings", Settings],
    ["/global-configuration", Settings],
];

export const getTabIcon = (path: string): React.ElementType => {
    if (path === "/") {
        return Dashboard;
    }

    const match = tabIconsByPathPrefix.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`));
    return match ? match[1] : AccountTree;
};
