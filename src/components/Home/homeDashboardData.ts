import {ShipmentDto} from "../Shipment/dto/ShipmentDto";

export type DashboardPeriodDays = 7 | 14 | 30;

export type TurnoverDay = {
    date: Date;
    dateKey: string;
    shipmentCount: number;
    totalCost: number;
};

export type MoneyTotal = {
    amount: number;
    currency: string;
};

const shipmentDepartmentCode = (shipment: ShipmentDto) => {
    if (typeof shipment.destination === "string") {
        return shipment.destination;
    }

    return shipment.destination?.value || "";
};

export const filterShipmentsForDepartment = (
    shipments: ShipmentDto[],
    departmentCode: string,
    departmentId?: number | string | null,
) => {
    const normalizedDepartmentCode = departmentCode.trim().toLowerCase();
    const normalizedDepartmentId = departmentId === undefined || departmentId === null
        ? ""
        : String(departmentId);

    return shipments.filter((shipment) => {
        const matchesDestination = shipmentDepartmentCode(shipment).trim().toLowerCase()
            === normalizedDepartmentCode;
        const matchesOrigin = normalizedDepartmentId
            && String(shipment.originDepartmentId?.value ?? "") === normalizedDepartmentId;
        return matchesDestination || Boolean(matchesOrigin);
    });
};

const localDateKey = (date: Date) => [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
].join("-");

export const startOfDashboardPeriod = (periodDays: DashboardPeriodDays, now = new Date()) => {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (periodDays - 1));
    return start;
};

export const shipmentsInPeriod = (
    shipments: ShipmentDto[],
    periodDays: DashboardPeriodDays,
    now = new Date(),
) => {
    const start = startOfDashboardPeriod(periodDays, now).getTime();
    const end = now.getTime();
    return shipments.filter((shipment) => {
        if (!shipment.createdAt) {
            return false;
        }
        const createdAt = new Date(shipment.createdAt).getTime();
        return Number.isFinite(createdAt) && createdAt >= start && createdAt <= end;
    });
};

export const getPrimaryCurrency = (shipments: ShipmentDto[]) => {
    const currencyCounts = shipments.reduce<Map<string, number>>((counts, shipment) => {
        const currency = shipment.price?.currency || "PLN";
        counts.set(currency, (counts.get(currency) || 0) + 1);
        return counts;
    }, new Map());

    return Array.from(currencyCounts.entries())
        .sort((left, right) => right[1] - left[1])[0]?.[0] || "PLN";
};

export const calculateMoneyTotals = (shipments: ShipmentDto[]): MoneyTotal[] => {
    const totals = shipments.reduce<Map<string, number>>((result, shipment) => {
        const currency = shipment.price?.currency || "PLN";
        const amount = Number(shipment.price?.amount || 0);
        result.set(currency, (result.get(currency) || 0) + (Number.isFinite(amount) ? amount : 0));
        return result;
    }, new Map());

    return Array.from(totals.entries())
        .map(([currency, amount]) => ({amount, currency}))
        .sort((left, right) => right.amount - left.amount);
};

export const buildTurnoverSeries = (
    shipments: ShipmentDto[],
    periodDays: DashboardPeriodDays,
    currency: string,
    now = new Date(),
): TurnoverDay[] => {
    const start = startOfDashboardPeriod(periodDays, now);
    const days = Array.from({length: periodDays}, (_, dayIndex) => {
        const date = new Date(start);
        date.setDate(date.getDate() + dayIndex);
        return {
            date,
            dateKey: localDateKey(date),
            shipmentCount: 0,
            totalCost: 0,
        };
    });
    const daysByKey = new Map(days.map((day) => [day.dateKey, day]));

    shipments.forEach((shipment) => {
        if (!shipment.createdAt) {
            return;
        }
        const createdAt = new Date(shipment.createdAt);
        if (Number.isNaN(createdAt.getTime()) || createdAt > now) {
            return;
        }
        const day = daysByKey.get(localDateKey(createdAt));
        if (!day) {
            return;
        }

        day.shipmentCount += 1;
        if ((shipment.price?.currency || "PLN") === currency) {
            const amount = Number(shipment.price?.amount || 0);
            day.totalCost += Number.isFinite(amount) ? amount : 0;
        }
    });

    return days;
};
