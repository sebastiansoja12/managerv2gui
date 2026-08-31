import pl from "../../i18n/translate";

export const tabTitles = (): Record<string, string> => ({
    "/": pl.navigation.home,
    "/shipment-control-center": pl.home.tiles.shipmentDetails.title,
    "/shipment-details": pl.home.tiles.shipmentDetails.title,
    "/shipments": pl.navigation.shipmentList,
    "/shipments/list": pl.navigation.shipmentList,
    "/shipments/create": pl.navigation.shipmentCreate,
    "/depots": pl.navigation.departments,
    "/pickup-points": pl.navigation.pickupPoints,
    "/parcels": pl.navigation.shipmentList,
    "/analytics": pl.navigation.analytics,
    "/processes": pl.navigation.processes,
    "/returns": pl.navigation.returns,
    "/deliveries": pl.navigation.deliveries,
    "/couriers": pl.navigation.couriers,
    "/vehicles": pl.navigation.vehicles,
    "/pallets": pl.navigation.pallets,
    "/pallets/scan": pl.navigation.palletScanner,
    "/pallets/create": pl.pallets.createOptions.title,
    "/pallets/create-from-shipments": pl.pallets.createFromShipments.title,
    "/pallets/cancelled": pl.navigation.palletsCancelled,
    "/pallets/empty": pl.navigation.palletsEmpty,
    "/carriers": pl.navigation.carriers,
    "/drivers": pl.navigation.drivers,
    "/shipment-scanner": pl.navigation.shipmentScanner,
    "/courier-deliveries": pl.navigation.courierDeliveries,
    "/suppliers": pl.navigation.suppliers,
    "/users": pl.navigation.users,
    "/chat": pl.navigation.chat,
    "/deals": pl.navigation.deals,
    "/billing": pl.navigation.billing,
    "/support": pl.navigation.support,
    "/login": pl.navigation.login,
    "/profile": pl.navigation.profile,
    "/device-pairing": pl.navigation.devicePairing,
    "/my-settings": pl.navigation.mySettings,
    "/global-configuration": pl.navigation.globalConfiguration,
});

export const normalizePath = (path: string) => path === "/shipments" ? "/shipments/list" : path;

export const getTabTitle = (path: string) => {
    const normalizedPath = normalizePath(path);
    const deliveryEditMatch = normalizedPath.match(/^\/deliveries\/([^/]+)\/edit$/);
    if (deliveryEditMatch) {
        return `${pl.deliveries.detailsTitle} ${decodeURIComponent(deliveryEditMatch[1])}`;
    }
    const shipmentTrackingEditMatch = normalizedPath.match(/^\/shipments\/tracking\/([^/]+)\/edit$/);
    if (shipmentTrackingEditMatch) {
        return `${pl.shipments.page.detailsTitle} ${decodeURIComponent(shipmentTrackingEditMatch[1])}`;
    }

    const shipmentTrackingHistoryMatch = normalizedPath.match(/^\/shipments\/tracking\/([^/]+)\/history$/);
    if (shipmentTrackingHistoryMatch) {
        return `${pl.shipments.trackerlog} ${decodeURIComponent(shipmentTrackingHistoryMatch[1])}`;
    }

    const shipmentEditMatch = normalizedPath.match(/^\/shipments\/(\d+)\/edit$/);
    if (shipmentEditMatch) {
        return `${pl.shipments.page.detailsTitle} #${shipmentEditMatch[1]}`;
    }

    const shipmentHistoryMatch = normalizedPath.match(/^\/shipments\/(\d+)\/history$/);
    if (shipmentHistoryMatch) {
        return `${pl.shipments.trackerlog} #${shipmentHistoryMatch[1]}`;
    }

    const palletMatch = normalizedPath.match(/^\/pallets\/tracking\/([^/]+)$/);
    if (palletMatch) {
        return `${pl.pallets.details.title} ${decodeURIComponent(palletMatch[1])}`;
    }

    const departmentMatch = normalizedPath.match(/^\/departments\/([^/]+)$/);
    if (departmentMatch) {
        return `${pl.departments.view.tabTitle} #${decodeURIComponent(departmentMatch[1])}`;
    }

    const carrierMatch = normalizedPath.match(/^\/carriers\/([^/]+)$/);
    if (carrierMatch) {
        return `${pl.carriers.view.tabTitle} #${decodeURIComponent(carrierMatch[1])}`;
    }

    const driverMatch = normalizedPath.match(/^\/drivers\/([^/]+)$/);
    if (driverMatch) {
        return `${pl.drivers.view.tabTitle} #${decodeURIComponent(driverMatch[1])}`;
    }

    const processMatch = normalizedPath.match(/^\/processes\/([^/]+)$/);
    if (processMatch) {
        return `${pl.processes.details.title} ${decodeURIComponent(processMatch[1])}`;
    }

    const returnMatch = normalizedPath.match(/^\/returns\/([^/]+)$/);
    if (returnMatch) {
        return `${pl.returns.details.title} #${decodeURIComponent(returnMatch[1])}`;
    }

    const courierMatch = normalizedPath.match(/^\/couriers\/([^/]+)$/);
    if (courierMatch) {
        return `${pl.couriers.page.detailsTitle} ${decodeURIComponent(courierMatch[1])}`;
    }

    return tabTitles()[normalizedPath] || pl.app.tabs.fallbackTitle;
};
