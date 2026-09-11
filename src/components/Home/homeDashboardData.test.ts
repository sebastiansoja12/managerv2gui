import {ShipmentDto} from "../Shipment/dto/ShipmentDto";
import {
    buildTurnoverSeries,
    calculateMoneyTotals,
    filterShipmentsForDepartment,
    getPrimaryCurrency,
    shipmentsInPeriod,
} from "./homeDashboardData";

const shipment = (createdAt: string, amount: number, currency = "PLN") => ({
    createdAt,
    price: {amount, currency},
} as ShipmentDto);

test("builds daily shipment and turnover values for the selected period", () => {
    const now = new Date("2026-09-11T12:00:00");
    const shipments = [
        shipment("2026-09-09T08:00:00", 20),
        shipment("2026-09-09T15:00:00", 30),
        shipment("2026-09-11T09:00:00", 50),
        shipment("2026-09-01T09:00:00", 900),
    ];

    const periodShipments = shipmentsInPeriod(shipments, 7, now);
    const series = buildTurnoverSeries(periodShipments, 7, "PLN", now);

    expect(periodShipments).toHaveLength(3);
    expect(series).toHaveLength(7);
    expect(series.find((day) => day.dateKey === "2026-09-09")).toMatchObject({
        shipmentCount: 2,
        totalCost: 50,
    });
    expect(series.find((day) => day.dateKey === "2026-09-11")).toMatchObject({
        shipmentCount: 1,
        totalCost: 50,
    });
});

test("keeps monetary totals separated by currency", () => {
    const shipments = [
        shipment("2026-09-11T08:00:00", 100, "PLN"),
        shipment("2026-09-11T09:00:00", 25, "PLN"),
        shipment("2026-09-11T10:00:00", 40, "EUR"),
    ];

    expect(getPrimaryCurrency(shipments)).toBe("PLN");
    expect(calculateMoneyTotals(shipments)).toEqual([
        {amount: 125, currency: "PLN"},
        {amount: 40, currency: "EUR"},
    ]);
});

test("includes incoming and outgoing shipments for the user's department", () => {
    const incoming = {
        ...shipment("2026-09-11T08:00:00", 100),
        shipmentId: {value: "1"},
        destination: {value: "KT1"},
        originDepartmentId: {value: 2},
    } as ShipmentDto;
    const outgoing = {
        ...shipment("2026-09-11T09:00:00", 100),
        shipmentId: {value: "2"},
        destination: {value: "WAW1"},
        originDepartmentId: {value: 7},
    } as ShipmentDto;
    const unrelated = {
        ...shipment("2026-09-11T10:00:00", 100),
        shipmentId: {value: "3"},
        destination: {value: "POZ1"},
        originDepartmentId: {value: 3},
    } as ShipmentDto;

    expect(filterShipmentsForDepartment([incoming, outgoing, unrelated], "KT1", 7)
        .map((item) => item.shipmentId.value)).toEqual(["1", "2"]);
});
