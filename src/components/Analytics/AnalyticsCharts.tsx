import React from "react";
import {Typography} from "components/ui";
import pl from "../../i18n/translate";
import {decimal} from "./analyticsPresentation";
import CostStructureChart from "./charts/CostStructureChart";
import DepartmentFinanceChart from "./charts/DepartmentFinanceChart";
import {DepartmentPerformanceDto} from "./model/Analytics";

type AnalyticsChartsProps = {
    departments: DepartmentPerformanceDto[];
    currency: string | null;
};

const hasAmounts = (department: DepartmentPerformanceDto) =>
    (decimal(department.revenue) ?? 0) !== 0 || (decimal(department.costs.total) ?? 0) !== 0;

function AnalyticsCharts({departments, currency}: AnalyticsChartsProps) {
    const translations = pl.analytics.charts;
    const financeDepartments = departments.filter(hasAmounts);
    const costDepartments = departments.filter((department) => (decimal(department.costs.total) ?? 0) > 0);

    return (
        <div className="analytics-overview-charts">
            <section className="pallet-panel" aria-labelledby="analytics-finance-chart-title">
                <div className="pallet-panel-header">
                    <div>
                        <Typography variant="h5" id="analytics-finance-chart-title">{translations.finance.title}</Typography>
                        <p>{translations.finance.subtitle}</p>
                    </div>
                </div>
                {currency && financeDepartments.length
                    ? <DepartmentFinanceChart departments={financeDepartments} currency={currency} />
                    : <p className="pallet-empty">{translations.finance.empty}</p>}
            </section>
            <section className="pallet-panel" aria-labelledby="analytics-cost-chart-title">
                <div className="pallet-panel-header">
                    <div>
                        <Typography variant="h5" id="analytics-cost-chart-title">{translations.costStructure.title}</Typography>
                        <p>{translations.costStructure.subtitle}</p>
                    </div>
                </div>
                {currency && costDepartments.length
                    ? <CostStructureChart departments={costDepartments} currency={currency} />
                    : <p className="pallet-empty">{translations.costStructure.empty}</p>}
            </section>
        </div>
    );
}

export default AnalyticsCharts;
