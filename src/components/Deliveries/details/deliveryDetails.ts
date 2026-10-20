import {CourierDto} from "../../Couriers/dto/CourierDto";
import pl from "../../../i18n/translate";
import {Delivery, DeliveryStep} from "../model/Delivery";

export const deliveryStatuses = [
    "DEPOT", "CLIENT", "DELIVERY", "SENDER", "LOST", "UNKNOWN", "DELIVERED", "REJECTED", "RETURN", "UNAVAILABLE",
] as const;

export const deliveryMethods = ["COURIER", "PICKUP_POINT", "LOCKER"] as const;

export const pickupMethods = ["DEPARTMENT", "COURIER", "PICKUP_POINT", "LOCKER"] as const;

export type DeliveryDialogState =
    | {kind: "carrier"}
    | {kind: "route"}
    | {kind: "conditions"}
    | {kind: "attempt"}
    | {kind: "complete"}
    | {kind: "cancel"}
    | {kind: "stepComment"; step: DeliveryStep}
    | {kind: "stepStatus"; step: DeliveryStep}
    | {kind: "stepSignature"; step: DeliveryStep}
    | {kind: "stepCarrier"; step: DeliveryStep};

export type DeliveryStepAction = "stepComment" | "stepStatus" | "stepSignature" | "stepCarrier";

export const isDeliveryActive = (delivery: Delivery) =>
    delivery.lifecycleStatus !== "CANCELED" && delivery.lifecycleStatus !== "COMPLETED";

export const courierSupplierId = (courier: CourierDto): number | null => {
    if (courier.supplierId === null || courier.supplierId === undefined) {
        return null;
    }
    return typeof courier.supplierId === "number" ? courier.supplierId : courier.supplierId.value;
};

export const courierName = (courier: CourierDto) =>
    `${courier.firstName} ${courier.lastName} (${courier.supplierCode.value})`;

export const findCourier = (couriers: CourierDto[], supplierId?: string | null) => supplierId
    ? couriers.find((candidate) => String(courierSupplierId(candidate)) === supplierId) || null
    : null;

export const courierLabel = (couriers: CourierDto[], supplierId?: string | null) => {
    if (!supplierId) {
        return pl.common.dash;
    }
    const courier = couriers.find((candidate) => String(courierSupplierId(candidate)) === supplierId);
    return courier ? courierName(courier) : supplierId;
};

export const sortSteps = (steps: DeliveryStep[]) =>
    [...steps].sort((left, right) => left.stepNumber - right.stepNumber);

export const toDateTimeInput = (value?: string | null) => value ? value.slice(0, 16) : "";

export const fromDateTimeInput = (value: string) => value ? `${value}:00` : null;

export const parseOptionalNumber = (value: string): number | null | undefined => {
    if (!value.trim()) {
        return null;
    }
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

export type DeliverySla = "UNPLANNED" | "ON_TIME" | "AT_RISK" | "OVERDUE" | "DELIVERED_ON_TIME" | "DELIVERED_LATE";

export const deliveryLifecycleStages = ["CREATED", "ASSIGNED", "IN_DELIVERY", "COMPLETED"] as const;

export type DeliveryLifecycleStage = typeof deliveryLifecycleStages[number];

const AT_RISK_MILLISECONDS = 2 * 60 * 60 * 1000;

export const failedAttempts = (delivery: Delivery) =>
    delivery.steps.filter((step) => step.outcome === "FAILED").length;

export const attemptLimitReached = (delivery: Delivery) =>
    delivery.attemptLimit > 0 && failedAttempts(delivery) >= delivery.attemptLimit;

export const deliverySla = (delivery: Delivery, now: Date = new Date()): DeliverySla => {
    if (!delivery.plannedAt) {
        return "UNPLANNED";
    }
    const planned = new Date(delivery.plannedAt).getTime();
    if (delivery.deliveredAt) {
        return new Date(delivery.deliveredAt).getTime() > planned ? "DELIVERED_LATE" : "DELIVERED_ON_TIME";
    }
    if (now.getTime() > planned) {
        return "OVERDUE";
    }
    return planned - now.getTime() <= AT_RISK_MILLISECONDS ? "AT_RISK" : "ON_TIME";
};

export const formatDuration = (milliseconds: number) => {
    const totalMinutes = Math.round(Math.abs(milliseconds) / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    return [days ? `${days} d` : "", hours ? `${hours} h` : "", `${minutes} min`].filter(Boolean).join(" ");
};

export const deliveryLifecycleStage = (delivery: Delivery): DeliveryLifecycleStage => {
    if (delivery.lifecycleStatus === "COMPLETED") {
        return "COMPLETED";
    }
    if (delivery.steps.length > 1 || delivery.deliveryStatus === "DELIVERY") {
        return "IN_DELIVERY";
    }
    return delivery.supplierId ? "ASSIGNED" : "CREATED";
};
