export const DEPARTMENT_COST_CATEGORIES = ["FUEL", "SHIPMENT_DAMAGE", "CLAIM"] as const;

export const ANALYTICS_CURRENCIES = [
    "PLN", "EUR", "GBP", "CHF", "CZK", "SEK", "NOK", "DKK", "HUF", "RON", "BGN", "HRK",
    "RSD", "MKD", "ISK", "ALL", "BYN", "BAM", "GEL", "RUB", "UAH", "MDL",
] as const;

export const ANALYTICS_TABS = ["overview", "comparison", "forecast", "costs"] as const;

export const PERFORMANCE_SORT_KEYS = ["revenue", "financialResult", "profitabilityPercent", "registeredShipments", "totalCosts"] as const;

export type DepartmentCostCategory = typeof DEPARTMENT_COST_CATEGORIES[number];
export type AnalyticsCurrency = typeof ANALYTICS_CURRENCIES[number];
export type PerformanceSortKey = typeof PERFORMANCE_SORT_KEYS[number];
export type AnalyticsTab = typeof ANALYTICS_TABS[number];
export type ForecastStatus = "AVAILABLE" | "INSUFFICIENT_HISTORY";
export type DecimalValue = number | string;

export type CostBreakdownDto = {
    fuel: DecimalValue;
    shipmentDamage: DecimalValue;
    claims: DecimalValue;
    total: DecimalValue;
};

export type DepartmentPerformanceDto = {
    departmentCode: string | null;
    city: string | null;
    registeredShipments: number;
    canceledShipments: number;
    unpricedShipments: number;
    deliveredShipments: number;
    revenue: DecimalValue;
    actualTurnover: DecimalValue;
    costs: CostBreakdownDto;
    costEntries: number;
    financialResult: DecimalValue;
    profitabilityPercent: DecimalValue | null;
    revenueSharePercent: DecimalValue | null;
    damagedShipments: number;
    damageClaims: number;
};

export type PerformanceReportDto = {
    dateFrom: string;
    dateTo: string;
    currency: string | null;
    availableCurrencies: string[];
    organization: DepartmentPerformanceDto;
    unassigned: DepartmentPerformanceDto | null;
    departments: DepartmentPerformanceDto[];
};

export type DailyObservationDto = {
    day: string;
    registeredShipments: number;
};

export type DepartmentForecastDto = {
    departmentCode: string | null;
    city: string | null;
    averageShipments: DecimalValue | null;
    expectedShipments: number | null;
    minimumObserved: number | null;
    maximumObserved: number | null;
    actualShipments: number | null;
    observations: DailyObservationDto[];
};

export type ShipmentForecastDto = {
    targetDate: string;
    status: ForecastStatus;
    observationDays: string[];
    requiredObservations: number;
    organization: DepartmentForecastDto;
    departments: DepartmentForecastDto[];
};

export type DepartmentCostIdDto = {value: string};

export type DepartmentCostDto = {
    costId: DepartmentCostIdDto;
    departmentCode: string;
    category: DepartmentCostCategory;
    amount: DecimalValue;
    currency: string;
    incurredOn: string;
    description: string | null;
    recordedBy: {value: number | string};
    recordedAt: string;
};

export type RecordDepartmentCostRequest = {
    departmentCode: string;
    category: DepartmentCostCategory;
    amount: string;
    currency: string;
    incurredOn: string;
    description: string | null;
};

export type AnalyticsFilters = {
    dateFrom: string;
    dateTo: string;
    departmentCode: string;
    currency: string;
};

export type AnalyticsDepartmentOption = {
    departmentCode: string;
    city: string;
};
