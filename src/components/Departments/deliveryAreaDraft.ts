import {AreaPoint, isValidArea} from "./deliveryAreaGeometry";

export type DeliveryArea = {
    id: string;
    name: string;
    points: AreaPoint[];
};

export const deliveryAreasChangedEvent = "manager:delivery-areas-changed";

export const storageKeyFor = (operatorId: number | undefined, departmentId: string) => (
    `manager.delivery-area-draft.v1.${operatorId ?? "unknown"}.${departmentId}`
);

export const readAreas = (storageKey: string): DeliveryArea[] => {
    try {
        const stored = window.localStorage.getItem(storageKey);
        if (!stored) {
            return [];
        }
        const parsed: unknown = JSON.parse(stored);
        if (!parsed || typeof parsed !== "object" || !("areas" in parsed)
            || !Array.isArray(parsed.areas)) {
            return [];
        }
        return parsed.areas.filter((area: unknown): area is DeliveryArea => {
            if (!area || typeof area !== "object" || !("id" in area) || !("name" in area)
                || !("points" in area)) {
                return false;
            }
            return typeof area.id === "string" && typeof area.name === "string"
                && Array.isArray(area.points) && isValidArea(area.points);
        });
    } catch {
        return [];
    }
};

export const writeAreas = (storageKey: string, areas: DeliveryArea[]) => {
    window.localStorage.setItem(storageKey, JSON.stringify({version: 1, areas}));
    window.dispatchEvent(new Event(deliveryAreasChangedEvent));
};
