import pl from "../../i18n/translate";
import {DecimalValue, DepartmentPerformanceDto, PerformanceReportDto, PerformanceSortKey} from "./model/Analytics";

export const toIsoDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
};

export const defaultAnalyticsPeriod = (today: Date) => ({
    dateFrom: toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    dateTo: toIsoDate(today),
});

export const nextDay = (today: Date) => toIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));

export const decimal = (value: DecimalValue | null | undefined) =>
    value === null || value === undefined ? null : Number(value);

export const formatMoney = (value: DecimalValue | null | undefined, currency: string | null) => {
    const amount = decimal(value);
    if (amount === null || !currency) {
        return pl.common.dash;
    }
    return new Intl.NumberFormat(String(pl.common.locale), {style: "currency", currency}).format(amount);
};

export const formatPercent = (value: DecimalValue | null | undefined) => {
    const percent = decimal(value);
    if (percent === null) {
        return pl.common.dash;
    }
    return `${new Intl.NumberFormat(String(pl.common.locale), {maximumFractionDigits: 2}).format(percent)}%`;
};

export const formatNumber = (value: DecimalValue | null | undefined) => {
    const number = decimal(value);
    if (number === null) {
        return pl.common.dash;
    }
    return new Intl.NumberFormat(String(pl.common.locale), {maximumFractionDigits: 2}).format(number);
};

export const formatDate = (value: string) =>
    new Intl.DateTimeFormat(String(pl.common.locale)).format(new Date(`${value}T00:00:00`));

const sortValue = (performance: DepartmentPerformanceDto, key: PerformanceSortKey) => {
    if (key === "totalCosts") {
        return decimal(performance.costs.total) ?? 0;
    }
    if (key === "registeredShipments") {
        return performance.registeredShipments;
    }
    return decimal(performance[key]) ?? Number.NEGATIVE_INFINITY;
};

export const sortDepartments = (departments: DepartmentPerformanceDto[], key: PerformanceSortKey) =>
    [...departments].sort((left, right) => sortValue(right, key) - sortValue(left, key)
        || String(left.departmentCode).localeCompare(String(right.departmentCode)));

export const departmentLabel = (departmentCode: string | null, city: string | null) =>
    [departmentCode, city].filter(Boolean).join(" · ");

export const hasPerformanceData = (organization: DepartmentPerformanceDto) =>
    organization.registeredShipments > 0
    || organization.canceledShipments > 0
    || organization.deliveredShipments > 0
    || organization.costEntries > 0
    || organization.damagedShipments > 0
    || organization.damageClaims > 0;

export type AnalyticsNotice = {
    key: string;
    severity: "info" | "warning";
    message: string;
};

export const performanceNotices = (report: PerformanceReportDto): AnalyticsNotice[] => {
    const translations = pl.analytics.notices;
    const notices: AnalyticsNotice[] = [];
    if (!hasPerformanceData(report.organization)) {
        notices.push({key: "noData", severity: "info", message: translations.noData});
        return notices;
    }
    if (!report.currency) {
        notices.push({key: "noCurrency", severity: "info", message: translations.noCurrency});
    }
    const otherCurrencies = report.availableCurrencies.filter((currency) => currency !== report.currency);
    if (otherCurrencies.length) {
        notices.push({
            key: "otherCurrencies",
            severity: "warning",
            message: translations.otherCurrencies.replace("{currencies}", otherCurrencies.join(", ")),
        });
    }
    if (report.organization.unpricedShipments > 0) {
        notices.push({
            key: "unpriced",
            severity: "warning",
            message: translations.unpriced.replace("{count}", String(report.organization.unpricedShipments)),
        });
    }
    const departmentsWithoutCosts = report.departments
        .filter((department) => department.costEntries === 0 && (decimal(department.revenue) ?? 0) > 0)
        .map((department) => department.departmentCode)
        .filter((departmentCode): departmentCode is string => Boolean(departmentCode));
    if (departmentsWithoutCosts.length) {
        notices.push({
            key: "missingCosts",
            severity: "warning",
            message: translations.missingCosts.replace("{departments}", departmentsWithoutCosts.join(", ")),
        });
    }
    if (report.unassigned) {
        notices.push({key: "unassigned", severity: "info", message: translations.unassigned});
    }
    return notices;
};
