import Department from "../../class/depots/Department";
import pl from "../../i18n/translate";

export const formatDeliveryDateTime = (value?: string | null) => {
    if (!value) {
        return pl.common.dash;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleString(pl.common.locale, {
            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
        });
};

export const deliveryStatusLabel = (status?: string | null) => status
    ? pl.deliveries.status[status as keyof typeof pl.deliveries.status] || pl.deliveries.unknown
    : pl.deliveries.unknown;

export const deliveryTypeLabel = (type: string) =>
    pl.deliveries.type[type as keyof typeof pl.deliveries.type] || pl.deliveries.unknown;

export const deliveryTargetLabel = (type: string) =>
    pl.deliveries.target[type as keyof typeof pl.deliveries.target] || pl.deliveries.unknown;

export const deliveryLifecycleLabel = (status: string) =>
    pl.deliveries.lifecycle[status as keyof typeof pl.deliveries.lifecycle] || pl.deliveries.unknown;

export const deliveryMethodLabel = (method?: string | null) => method
    ? pl.deliveries.method[method as keyof typeof pl.deliveries.method] || pl.deliveries.unknown
    : pl.common.dash;

export const deliveryOutcomeLabel = (outcome: string) =>
    pl.deliveries.outcome[outcome as keyof typeof pl.deliveries.outcome] || pl.deliveries.unknown;

export const pickupMethodLabel = (method?: string | null) => method
    ? pl.shipments.pickupMethod[method as keyof typeof pl.shipments.pickupMethod] || pl.deliveries.unknown
    : pl.common.dash;

export const departmentCodeLabel = (departments: Department[], departmentId?: string | null) => {
    if (!departmentId) {
        return pl.common.dash;
    }

    return departments.find((department) => String(department.departmentId) === departmentId)
        ?.departmentCode?.value || departmentId;
};
