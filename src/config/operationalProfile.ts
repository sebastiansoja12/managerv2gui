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

const COURIER_ONLY_ROLES = ["SUPPLIER"];

export const availableOperationalProfiles = (role?: string | null): OperationalProfile[] => (
    role && COURIER_ONLY_ROLES.includes(role.toUpperCase()) ? ["courier"] : operationalProfiles
);

export const resolveOperationalProfile = (
    role: string | null | undefined,
    selectedProfile: OperationalProfile,
): OperationalProfile => {
    const allowedProfiles = availableOperationalProfiles(role);
    return allowedProfiles.includes(selectedProfile) ? selectedProfile : allowedProfiles[0];
};

export const isReturnPath = (path: string) => path === "/returns" || path.startsWith("/returns/");

export const isPathAllowedForProfile = (path: string, profile: OperationalProfile) => {
    if (path === "/" || path === "/login" || path === "/profile") {
        return true;
    }

    if (/^\/shipments\/tracking\/[^/]+\/edit$/.test(path)
        || /^\/shipments\/tracking\/[^/]+\/history$/.test(path)
        || /^\/shipments\/\d+\/edit$/.test(path)
        || /^\/shipments\/\d+\/history$/.test(path)
        || /^\/processes\/[^/]+$/.test(path)) {
        return true;
    }

    if (/^\/pallets\/tracking\/[^/]+$/.test(path)
        || /^\/departments\/[^/]+$/.test(path)
        || /^\/carriers\/[^/]+$/.test(path)
        || /^\/drivers\/[^/]+$/.test(path)) {
        return profile === "warehouse";
    }

    if (/^\/deliveries\/[^/]+\/edit$/.test(path)) {
        return profile === "warehouse";
    }

    const courierPaths = [
        "/shipment-control-center",
        "/shipment-details",
        "/shipments/list",
        "/courier-deliveries",
        "/processes",
        "/my-settings",
        "/vehicles",
        "/device-pairing",
        "/chat",
    ];

    const warehousePaths = [
        "/shipment-control-center",
        "/shipment-details",
        "/shipments/list",
        "/shipments/create",
        "/shipment-scanner",
        "/depots",
        "/pickup-points",
        "/pallets",
        "/pallets/scan",
        "/pallets/create",
        "/pallets/create-from-shipments",
        "/pallets/cancelled",
        "/pallets/empty",
        "/carriers",
        "/drivers",
        "/couriers",
        "/processes",
        "/returns",
        "/deliveries",
        "/analytics",
        "/global-configuration",
        "/users",
        "/device-pairing",
        "/chat",
    ];

    return profile === "courier"
        ? courierPaths.includes(path)
        : warehousePaths.includes(path);
};
