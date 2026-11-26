import BackendClient from "../api/BackendClient";
import {
    AnalyticsFilters,
    DepartmentCostDto,
    DepartmentCostIdDto,
    PerformanceReportDto,
    RecordDepartmentCostRequest,
    ShipmentForecastDto,
} from "../components/Analytics/model/Analytics";
import http from "../http-common";

const client = new BackendClient(http);

const AnalyticsService = {
    performance: (filters: AnalyticsFilters) => client.get<PerformanceReportDto>("/analytics/performance", {
        params: {
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            departmentCode: filters.departmentCode || undefined,
            currency: filters.currency || undefined,
        },
    }),
    forecast: (date: string, departmentCode: string) => client.get<ShipmentForecastDto>("/analytics/forecast", {
        params: {date, departmentCode: departmentCode || undefined},
    }),
    costs: (filters: AnalyticsFilters) => client.get<DepartmentCostDto[]>("/analytics/costs", {
        params: {
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            departmentCode: filters.departmentCode || undefined,
        },
    }),
    recordCost: (request: RecordDepartmentCostRequest) =>
        client.post<RecordDepartmentCostRequest, DepartmentCostIdDto>("/analytics/costs", request),
    deleteCost: (costId: string) =>
        client.delete<undefined, void>(`/analytics/costs/${encodeURIComponent(costId)}`, undefined),
};

export default AnalyticsService;
