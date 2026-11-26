import {DepartmentPerformanceDto, PerformanceReportDto, ShipmentForecastDto} from "./model/Analytics";

export const performance = (overrides: Partial<DepartmentPerformanceDto> = {}): DepartmentPerformanceDto => ({
    departmentCode: "KAT",
    city: "Katowice",
    registeredShipments: 10,
    canceledShipments: 1,
    unpricedShipments: 0,
    deliveredShipments: 8,
    revenue: 1000,
    actualTurnover: 800,
    costs: {fuel: 150, shipmentDamage: 40, claims: 10, total: 200},
    costEntries: 3,
    financialResult: 800,
    profitabilityPercent: 80,
    revenueSharePercent: 100,
    damagedShipments: 2,
    damageClaims: 1,
    ...overrides,
});

export const report = (overrides: Partial<PerformanceReportDto> = {}): PerformanceReportDto => ({
    dateFrom: "2026-11-01",
    dateTo: "2026-11-17",
    currency: "PLN",
    availableCurrencies: ["PLN"],
    organization: performance({departmentCode: null, city: null}),
    unassigned: null,
    departments: [performance()],
    ...overrides,
});

export const forecast = (overrides: Partial<ShipmentForecastDto> = {}): ShipmentForecastDto => ({
    targetDate: "2026-11-18",
    status: "AVAILABLE",
    observationDays: ["2026-11-04", "2026-11-11"],
    requiredObservations: 4,
    organization: {departmentCode: null, city: null, averageShipments: 12.5, expectedShipments: 13,
        minimumObserved: 10, maximumObserved: 15, actualShipments: null,
        observations: [{day: "2026-11-04", registeredShipments: 10}, {day: "2026-11-11", registeredShipments: 15}]},
    departments: [{departmentCode: "KAT", city: "Katowice", averageShipments: 12.5, expectedShipments: 13,
        minimumObserved: 10, maximumObserved: 15, actualShipments: null,
        observations: [{day: "2026-11-04", registeredShipments: 10}, {day: "2026-11-11", registeredShipments: 15}]}],
    ...overrides,
});
