import {ShipmentPriorityDto, ShipmentStatusDto} from "./dto/ShipmentDto";

export type ShipmentListStatusFilter = ShipmentStatusDto | "ALL";

export type ShipmentListFilters = {
    status: ShipmentListStatusFilter;
    priority: ShipmentPriorityDto | "";
    senderName: string;
    recipientName: string;
    minPrice: string;
    maxPrice: string;
    currency: string;
    locked: "ALL" | "YES" | "NO";
    createdFrom: string;
    createdTo: string;
};

export type ShipmentSavedView = {
    id: string;
    name: string;
    filters: ShipmentListFilters;
};

export const SHIPMENT_SAVED_VIEWS_STORAGE_KEY = "manager.shipmentSavedViews";

const storageKey = (username?: string | null) => username
    ? `${SHIPMENT_SAVED_VIEWS_STORAGE_KEY}.user.${username}`
    : SHIPMENT_SAVED_VIEWS_STORAGE_KEY;

const isSavedView = (value: unknown): value is ShipmentSavedView => {
    const view = value as ShipmentSavedView;
    return Boolean(view && typeof view.id === "string" && typeof view.name === "string" && view.filters
        && typeof view.filters.status === "string");
};

export const loadShipmentSavedViews = (username?: string | null): ShipmentSavedView[] => {
    try {
        const stored = window.localStorage.getItem(storageKey(username));
        const parsed: unknown = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? parsed.filter(isSavedView) : [];
    } catch {
        // Browser storage can be unavailable or hold stale data; the list still works without saved views.
        return [];
    }
};

export const storeShipmentSavedViews = (views: ShipmentSavedView[], username?: string | null) => {
    try {
        window.localStorage.setItem(storageKey(username), JSON.stringify(views));
    } catch {
        // Saved views are a convenience; a failed write keeps them for the current session only.
    }
};

export const createShipmentSavedView = (name: string, filters: ShipmentListFilters): ShipmentSavedView => ({
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    filters,
});
