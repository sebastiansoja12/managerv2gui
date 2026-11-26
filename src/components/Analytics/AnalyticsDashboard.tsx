import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Alert, IconButton, MenuItem, TextField, Typography} from "components/ui";
import {Analytics, AttachMoney, Refresh, TrendingUp, ViewList} from "components/ui/icons";
import AnalyticsService from "../../hooks/AnalyticsService";
import DepartmentService from "../../hooks/DepartmentService";
import pl from "../../i18n/translate";
import {defaultAnalyticsPeriod, nextDay, sortDepartments} from "./analyticsPresentation";
import AnalyticsOverview from "./AnalyticsOverview";
import DepartmentComparisonTable from "./DepartmentComparisonTable";
import DepartmentCostRegister from "./DepartmentCostRegister";
import {
    ANALYTICS_TABS,
    AnalyticsDepartmentOption,
    AnalyticsFilters,
    AnalyticsTab,
    PerformanceReportDto,
    PerformanceSortKey,
} from "./model/Analytics";
import ShipmentForecastPanel from "./ShipmentForecastPanel";
import "../Pallets/styles/pallets.css";
import "./styles/analytics.css";

const TAB_ICONS: Record<AnalyticsTab, React.ElementType> = {
    overview: Analytics,
    comparison: ViewList,
    forecast: TrendingUp,
    costs: AttachMoney,
};

function AnalyticsDashboard() {
    const translations = pl.analytics;
    const today = useMemo(() => new Date(), []);
    const [filters, setFilters] = useState<AnalyticsFilters>({
        ...defaultAnalyticsPeriod(today),
        departmentCode: "",
        currency: "",
    });
    const [departments, setDepartments] = useState<AnalyticsDepartmentOption[]>([]);
    const [report, setReport] = useState<PerformanceReportDto | null>(null);
    const [sortKey, setSortKey] = useState<PerformanceSortKey>("revenue");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<AnalyticsTab>("overview");
    const [openedTabs, setOpenedTabs] = useState<AnalyticsTab[]>(["overview"]);

    const periodValid = Boolean(filters.dateFrom && filters.dateTo && filters.dateFrom <= filters.dateTo);

    useEffect(() => {
        DepartmentService.getAll()
            .then((response) => setDepartments(response.data
                .map((department) => ({
                    departmentCode: department.departmentCode.value,
                    city: department.address?.city,
                }))
                .sort((left, right) => left.departmentCode.localeCompare(right.departmentCode))))
            .catch(() => setDepartments([]));
    }, []);

    const load = useCallback(async () => {
        if (!periodValid) {
            setReport(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await AnalyticsService.performance(filters);
            setReport(response.data);
        } catch {
            setReport(null);
            setError(translations.loadError);
        } finally {
            setLoading(false);
        }
    }, [filters, periodValid, translations.loadError]);

    useEffect(() => {
        load();
    }, [load]);

    const changeFilter = <K extends keyof AnalyticsFilters>(key: K, value: AnalyticsFilters[K]) =>
        setFilters((current) => ({...current, [key]: value}));

    const openTab = (tab: AnalyticsTab) => {
        setActiveTab(tab);
        setOpenedTabs((current) => current.includes(tab) ? current : [...current, tab]);
    };

    const currencyOptions = report
        ? Array.from(new Set([...(report.currency ? [report.currency] : []), ...report.availableCurrencies])).sort()
        : [];
    const currency = report?.currency ?? null;
    const sortedDepartments = report ? sortDepartments(report.departments, sortKey) : [];
    const reportState = !periodValid
        ? <Alert severity="error">{translations.invalidPeriod}</Alert>
        : error
            ? <Alert severity="error">{error}</Alert>
            : loading || !report
                ? <p className="pallet-empty">{translations.loading}</p>
                : null;

    return (
        <main className="pallet-page analytics-page">
            <div className="pallet-shell pallet-shell-wide">
                <section className="pallet-header">
                    <div className="pallet-title">
                        <span className="pallet-title-icon"><Analytics /></span>
                        <div>
                            <Typography variant="h4">{translations.title}</Typography>
                            <p>{translations.subtitle}</p>
                        </div>
                    </div>
                    <div className="pallet-actions">
                        <IconButton aria-label={pl.common.refresh} title={pl.common.refresh} onClick={load}>
                            <Refresh fontSize="small" />
                        </IconButton>
                    </div>
                </section>

                <section className="pallet-panel analytics-filter-panel" aria-label={translations.filters.title}>
                    <div className="analytics-filters">
                        <TextField size="small" type="date" label={translations.filters.dateFrom}
                                   value={filters.dateFrom}
                                   onChange={(event: React.ChangeEvent<HTMLInputElement>) => changeFilter("dateFrom", event.target.value)} />
                        <TextField size="small" type="date" label={translations.filters.dateTo}
                                   value={filters.dateTo}
                                   onChange={(event: React.ChangeEvent<HTMLInputElement>) => changeFilter("dateTo", event.target.value)} />
                        <TextField select size="small" label={translations.filters.department} value={filters.departmentCode}
                                   onChange={(event: React.ChangeEvent<HTMLSelectElement>) => changeFilter("departmentCode", event.target.value)}>
                            <MenuItem value="">{translations.filters.allDepartments}</MenuItem>
                            {departments.map((department) => (
                                <MenuItem key={department.departmentCode} value={department.departmentCode}>
                                    {department.departmentCode} · {department.city}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField select size="small" label={translations.filters.currency} value={filters.currency}
                                   onChange={(event: React.ChangeEvent<HTMLSelectElement>) => changeFilter("currency", event.target.value)}>
                            <MenuItem value="">{translations.filters.automaticCurrency}</MenuItem>
                            {currencyOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                        </TextField>
                    </div>
                    <p className="analytics-definitions">{translations.definitions}</p>
                </section>

                <nav aria-label={translations.tabs.label} className="analytics-tabs" role="tablist">
                    {ANALYTICS_TABS.map((tab) => {
                        const Icon = TAB_ICONS[tab];
                        return (
                            <button aria-selected={activeTab === tab} className={activeTab === tab ? "active" : ""}
                                    id={`analytics-tab-${tab}`} key={tab} role="tab" type="button"
                                    onClick={() => openTab(tab)}>
                                <Icon fontSize="small" /> {translations.tabs[tab]}
                            </button>
                        );
                    })}
                </nav>

                <div aria-labelledby="analytics-tab-overview" className="analytics-tab-panel"
                     hidden={activeTab !== "overview"} role="tabpanel">
                    {reportState ?? (report ? <AnalyticsOverview report={report} departments={sortedDepartments} /> : null)}
                </div>

                {openedTabs.includes("comparison") ? (
                    <div aria-labelledby="analytics-tab-comparison" className="analytics-tab-panel"
                         hidden={activeTab !== "comparison"} role="tabpanel">
                        {reportState ?? (report ? (
                            <DepartmentComparisonTable report={report} sortKey={sortKey} onSortKeyChange={setSortKey} />
                        ) : null)}
                    </div>
                ) : null}

                {openedTabs.includes("forecast") ? (
                    <div aria-labelledby="analytics-tab-forecast" className="analytics-tab-panel"
                         hidden={activeTab !== "forecast"} role="tabpanel">
                        <ShipmentForecastPanel departmentCode={filters.departmentCode} initialDate={nextDay(today)} />
                    </div>
                ) : null}

                {openedTabs.includes("costs") ? (
                    <div aria-labelledby="analytics-tab-costs" className="analytics-tab-panel"
                         hidden={activeTab !== "costs"} role="tabpanel">
                        {periodValid ? (
                            <DepartmentCostRegister filters={filters} departments={departments}
                                                    defaultCurrency={currency} onChanged={load} />
                        ) : <Alert severity="error">{translations.invalidPeriod}</Alert>}
                    </div>
                ) : null}
            </div>
        </main>
    );
}

export default AnalyticsDashboard;
