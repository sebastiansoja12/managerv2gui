export type OperationalProfile = "courier" | "warehouse";

const STORAGE_KEY = "manager.operationalProfile";

export const DEFAULT_OPERATIONAL_PROFILE: OperationalProfile = "warehouse";

export const operationalProfiles: OperationalProfile[] = ["courier", "warehouse"];

export const getOperationalProfile = (): OperationalProfile => {
    const savedProfile = localStorage.getItem(STORAGE_KEY);
    return savedProfile === "courier" || savedProfile === "warehouse"
        ? savedProfile
        : DEFAULT_OPERATIONAL_PROFILE;
};

export const setOperationalProfile = (profile: OperationalProfile) => {
    localStorage.setItem(STORAGE_KEY, profile);
};

export const isPathAllowedForProfile = (path: string, profile: OperationalProfile) => {
    if (path === "/" || path === "/login" || path === "/profile") {
        return true;
    }

    if (/^\/shipments\/tracking\/[^/]+\/edit$/.test(path) || /^\/shipments\/\d+\/edit$/.test(path)) {
        return true;
    }

    const courierPaths = [
        "/shipment-control-center",
        "/shipments/list",
        "/courier-deliveries",
        "/vehicles",
        "/device-pairing",
    ];

    const warehousePaths = [
        "/shipment-control-center",
        "/shipments/list",
        "/shipments/create",
        "/shipment-scanner",
        "/depots",
        "/pallets",
        "/processes",
        "/analytics",
        "/software-configurations",
        "/device-pairing",
    ];

    return profile === "courier"
        ? courierPaths.includes(path)
        : warehousePaths.includes(path);
};
