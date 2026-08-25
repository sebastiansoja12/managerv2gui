import {DeliveryQueryFilter, DeliverySortField} from "../model/Delivery";

export type DeliveryListFilters = Omit<DeliveryQueryFilter, "shipmentIds" | "sort" | "direction">;

export type DeliveryListSort = {
    field: DeliverySortField;
    direction: "asc" | "desc";
};

export const defaultDeliveryListFilters: DeliveryListFilters = {hideCanceled: true, hideCompleted: false};

export const defaultDeliveryListSort: DeliveryListSort = {field: "CREATED", direction: "desc"};

export const deliveryPageSizes = [10, 25, 50, 100] as const;

export const activeFilterCount = (filters: DeliveryListFilters) => Object.entries(filters)
    .filter(([name, value]) => {
        const defaultValue = defaultDeliveryListFilters[name as keyof DeliveryListFilters];
        if (Array.isArray(value)) {
            return value.length > 0;
        }
        return value !== undefined && value !== "" && value !== defaultValue;
    }).length;

export const toggleSort = (current: DeliveryListSort, field: DeliverySortField): DeliveryListSort =>
    current.field === field
        ? {field, direction: current.direction === "asc" ? "desc" : "asc"}
        : {field, direction: field === "CREATED" || field === "DELIVERED_AT" ? "desc" : "asc"};

export const deliveryStatusTone = (status?: string | null) => {
    if (status === "DELIVERED") {
        return "success";
    }
    if (status === "REJECTED" || status === "LOST" || status === "UNAVAILABLE") {
        return "danger";
    }
    return status === "DELIVERY" || status === "RETURN" ? "warning" : "neutral";
};

export const lifecycleTone = (status: string) => {
    if (status === "COMPLETED") {
        return "success";
    }
    if (status === "CANCELED") {
        return "danger";
    }
    return status === "MODIFIED" ? "warning" : "neutral";
};
