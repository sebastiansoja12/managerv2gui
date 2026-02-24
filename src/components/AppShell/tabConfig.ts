import pl from "../../i18n/pl";

export const tabTitles: Record<string, string> = {
    "/": pl.navigation.home,
    "/shipment-control-center": pl.home.tiles.shipmentControlCenter.title,
    "/shipments": pl.navigation.shipmentList,
    "/shipments/list": pl.navigation.shipmentList,
    "/shipments/create": pl.navigation.shipmentCreate,
    "/depots": pl.navigation.departments,
    "/parcels": pl.navigation.shipmentList,
    "/analytics": pl.navigation.analytics,
    "/processes": pl.navigation.processes,
    "/couriers": pl.navigation.couriers,
    "/vehicles": pl.navigation.vehicles,
    "/pallets": pl.navigation.pallets,
    "/shipment-scanner": pl.navigation.shipmentScanner,
    "/courier-deliveries": pl.navigation.courierDeliveries,
    "/suppliers": pl.navigation.suppliers,
    "/users": pl.navigation.users,
    "/deals": pl.navigation.deals,
    "/billing": pl.navigation.billing,
    "/support": pl.navigation.support,
    "/login": pl.navigation.login,
    "/profile": pl.navigation.profile,
    "/device-pairing": pl.navigation.devicePairing,
    "/software-configurations": pl.navigation.systemSettings,
};

export const normalizePath = (path: string) => path === "/shipments" ? "/shipments/list" : path;

export const getTabTitle = (path: string) => {
    const normalizedPath = normalizePath(path);
    const shipmentTrackingEditMatch = normalizedPath.match(/^\/shipments\/tracking\/([^/]+)\/edit$/);
    if (shipmentTrackingEditMatch) {
        return `ShipmentControlCenter ${decodeURIComponent(shipmentTrackingEditMatch[1])}`;
    }

    const shipmentEditMatch = normalizedPath.match(/^\/shipments\/(\d+)\/edit$/);
    if (shipmentEditMatch) {
        return `ShipmentControlCenter #${shipmentEditMatch[1]}`;
    }

    return tabTitles[normalizedPath] || "Nowa karta";
};
