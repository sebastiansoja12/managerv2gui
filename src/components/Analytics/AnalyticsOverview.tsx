import React from "react";
import {Alert} from "components/ui";
import pl from "../../i18n/translate";
import {decimal, formatMoney, formatNumber, formatPercent, performanceNotices} from "./analyticsPresentation";
import AnalyticsCharts from "./AnalyticsCharts";
import {DepartmentPerformanceDto, PerformanceReportDto} from "./model/Analytics";

type AnalyticsOverviewProps = {
    report: PerformanceReportDto;
    departments: DepartmentPerformanceDto[];
};

function AnalyticsOverview({report, departments}: AnalyticsOverviewProps) {
    const summary = pl.analytics.summary;
    const organization = report.organization;
    const currency = report.currency;
    const notices = performanceNotices(report);

    return (
        <>
            {notices.length ? (
                <section className="analytics-notices">
                    {notices.map((notice) => (
                        <Alert key={notice.key} severity={notice.severity}>{notice.message}</Alert>
                    ))}
                </section>
            ) : null}

            <section className="pallet-summary analytics-summary" aria-label={summary.title}>
                <div className="pallet-summary-item">
                    <span>{summary.registeredShipments}</span>
                    <strong>{formatNumber(organization.registeredShipments)}</strong>
                    <small>{summary.canceledShipments.replace("{count}", String(organization.canceledShipments))}</small>
                </div>
                <div className="pallet-summary-item">
                    <span>{summary.revenue}</span>
                    <strong>{formatMoney(organization.revenue, currency)}</strong>
                </div>
                <div className="pallet-summary-item">
                    <span>{summary.actualTurnover}</span>
                    <strong>{formatMoney(organization.actualTurnover, currency)}</strong>
                    <small>{summary.deliveredShipments.replace("{count}", String(organization.deliveredShipments))}</small>
                </div>
                <div className="pallet-summary-item">
                    <span>{summary.costs}</span>
                    <strong>{formatMoney(organization.costs.total, currency)}</strong>
                    <small>{summary.costEntries.replace("{count}", String(organization.costEntries))}</small>
                </div>
                <div className="pallet-summary-item">
                    <span>{summary.financialResult}</span>
                    <strong className={(decimal(organization.financialResult) ?? 0) < 0 ? "analytics-negative" : undefined}>
                        {formatMoney(organization.financialResult, currency)}
                    </strong>
                </div>
                <div className="pallet-summary-item">
                    <span>{summary.profitability}</span>
                    <strong>{formatPercent(organization.profitabilityPercent)}</strong>
                </div>
            </section>

            <AnalyticsCharts departments={departments} currency={currency} />
        </>
    );
}

export default AnalyticsOverview;
