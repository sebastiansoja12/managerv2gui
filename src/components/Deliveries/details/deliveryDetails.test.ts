import Department from "../../../class/depots/Department";
import {PickupPointDetails} from "../../PickupPoints/model/PickupPoint";
import {Delivery, DeliveryHistoryEntry} from "../model/Delivery";
import {describeChanges} from "./DeliveryChangeHistory";
import {attemptLimitReached, deliveryLifecycleStage, deliverySla, failedAttempts, formatDuration} from "./deliveryDetails";
import {deliveryMapPoints} from "./tiles/DeliveryMapTile";

jest.mock("leaflet", () => ({}));

const step = (stepNumber: number, outcome: string) => ({
    stepNumber, attemptedAt: "2026-10-01T10:00:00", outcome, deliveryStatus: null, userId: null, departmentId: null,
    supplierId: null, vehicleId: null, signatureId: null, comment: null, failureReason: null,
});

const delivery = (overrides: Partial<Delivery> = {}): Delivery => ({
    id: "d-1", targetType: "SHIPMENT", targetId: "1", shipmentId: "1", type: "OUTBOUND", deliveryStatus: "DEPOT",
    lifecycleStatus: "CREATED", originDepartmentId: "3", destinationDepartmentId: "5", pickupMethod: null,
    method: "COURIER", pickupPointId: null, deliveryPickupPointId: "pp-1", supplierId: null, vehicleId: null,
    signatureRequired: false, instructions: null, createdAt: "2026-10-01T08:00:00", plannedAt: null,
    deliveredAt: null, attemptLimit: 2, steps: [step(1, "IN_PROGRESS")], ...overrides,
});

describe("delivery details helpers", () => {
    const now = new Date("2026-10-01T12:00:00");

    it("evaluates delivery timeliness", () => {
        expect(deliverySla(delivery(), now)).toBe("UNPLANNED");
        expect(deliverySla(delivery({plannedAt: "2026-10-02T12:00:00"}), now)).toBe("ON_TIME");
        expect(deliverySla(delivery({plannedAt: "2026-10-01T13:00:00"}), now)).toBe("AT_RISK");
        expect(deliverySla(delivery({plannedAt: "2026-10-01T11:00:00"}), now)).toBe("OVERDUE");
        expect(deliverySla(delivery({plannedAt: "2026-10-01T11:00:00", deliveredAt: "2026-10-01T10:00:00"}), now))
            .toBe("DELIVERED_ON_TIME");
        expect(deliverySla(delivery({plannedAt: "2026-10-01T09:00:00", deliveredAt: "2026-10-01T10:00:00"}), now))
            .toBe("DELIVERED_LATE");
    });

    it("formats durations", () => {
        expect(formatDuration(-((26 * 60 + 5) * 60000))).toBe("1 d 2 h 5 min");
        expect(formatDuration(15 * 60000)).toBe("15 min");
    });

    it("counts failed attempts against the limit", () => {
        const failing = delivery({steps: [step(1, "IN_PROGRESS"), step(2, "FAILED"), step(3, "FAILED")]});

        expect(failedAttempts(failing)).toBe(2);
        expect(attemptLimitReached(failing)).toBe(true);
        expect(attemptLimitReached(delivery())).toBe(false);
    });

    it("resolves the lifecycle stage", () => {
        expect(deliveryLifecycleStage(delivery())).toBe("CREATED");
        expect(deliveryLifecycleStage(delivery({supplierId: "4"}))).toBe("ASSIGNED");
        expect(deliveryLifecycleStage(delivery({steps: [step(1, "IN_PROGRESS"), step(2, "FAILED")]}))).toBe("IN_DELIVERY");
        expect(deliveryLifecycleStage(delivery({lifecycleStatus: "COMPLETED"}))).toBe("COMPLETED");
    });

    it("describes only changed fields between history entries", () => {
        const base = {stepCount: 1, destinationDepartmentId: "5"} as DeliveryHistoryEntry;
        const fields = [
            {label: "destination", value: (entry: DeliveryHistoryEntry) => entry.destinationDepartmentId || "-"},
            {label: "steps", value: (entry: DeliveryHistoryEntry) => String(entry.stepCount)},
        ];

        expect(describeChanges(base, {...base, destinationDepartmentId: "7"}, fields))
            .toEqual([{label: "destination", from: "5", to: "7"}]);
    });

    it("collects map points with known coordinates", () => {
        const departments = [
            {departmentId: 3, departmentCode: {value: "KT1"}, coordinates: {latitude: 50.26, longitude: 19.02}},
            {departmentId: 5, departmentCode: {value: "WAW1"}, coordinates: null},
        ] as unknown as Department[];
        const pickupPoints = {
            "pp-1": {code: "PP01", coordinates: {latitude: 52.23, longitude: 21.01}},
        } as unknown as Record<string, PickupPointDetails>;

        const points = deliveryMapPoints(delivery(), departments, pickupPoints);

        expect(points.map((point) => point.label)).toEqual(["KT1", "PP01"]);
    });
});
