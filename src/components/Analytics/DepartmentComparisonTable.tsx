import React from "react";
import {MenuItem, TextField, Typography} from "components/ui";
import pl from "../../i18n/translate";
import {
    decimal,
    formatMoney,
    formatNumber,
    formatPercent,
    sortDepartments,
} from "./analyticsPresentation";
import DepartmentName from "./DepartmentName";
import {DepartmentPerformanceDto, PERFORMANCE_SORT_KEYS, PerformanceReportDto, PerformanceSortKey} from "./model/Analytics";

type DepartmentComparisonTableProps = {
    report: PerformanceReportDto;
    sortKey: PerformanceSortKey;
    onSortKeyChange: (sortKey: PerformanceSortKey) => void;
};

const resultClassName = (value: DepartmentPerformanceDto["financialResult"]) => {
    const amount = decimal(value) ?? 0;
    return amount < 0 ? "analytics-number analytics-negative" : "analytics-number";
};

function PerformanceCells({performance, currency}: {performance: DepartmentPerformanceDto; currency: string | null}) {
    const translations = pl.analytics.comparison;
    const share = decimal(performance.revenueSharePercent);
    return (
        <>
            <td className="analytics-number">{formatNumber(performance.registeredShipments)}</td>
            <td className="analytics-number">{formatNumber(performance.canceledShipments)}</td>
            <td className="analytics-number">{formatNumber(performance.deliveredShipments)}</td>
            <td className="analytics-number">{formatMoney(performance.revenue, currency)}</td>
            <td className="analytics-number">{formatMoney(performance.actualTurnover, currency)}</td>
            <td className="analytics-number">{formatMoney(performance.costs.fuel, currency)}</td>
            <td className="analytics-number">{formatMoney(performance.costs.shipmentDamage, currency)}</td>
            <td className="analytics-number">{formatMoney(performance.costs.claims, currency)}</td>
            <td className="analytics-number">
                {formatMoney(performance.costs.total, currency)}
                {performance.costEntries === 0 ? <span className="analytics-muted"> ({translations.noCosts})</span> : null}
            </td>
            <td className={resultClassName(performance.financialResult)}>{formatMoney(performance.financialResult, currency)}</td>
            <td className={resultClassName(performance.profitabilityPercent ?? 0)}>{formatPercent(performance.profitabilityPercent)}</td>
            <td className="analytics-number">
                <span className="analytics-share">
                    <span className="analytics-share-bar" aria-hidden="true">
                        <span style={{width: `${Math.max(0, Math.min(100, share ?? 0))}%`}} />
                    </span>
                    {formatPercent(performance.revenueSharePercent)}
                </span>
            </td>
            <td className="analytics-number">{formatNumber(performance.damagedShipments)}</td>
            <td className="analytics-number">{formatNumber(performance.damageClaims)}</td>
        </>
    );
}

function DepartmentComparisonTable({report, sortKey, onSortKeyChange}: DepartmentComparisonTableProps) {
    const translations = pl.analytics.comparison;
    const columns = translations.columns;
    const departments = sortDepartments(report.departments, sortKey);
    const headers = [
        columns.shipments, columns.canceled, columns.delivered, columns.revenue, columns.turnover, columns.fuel,
        columns.damage, columns.claims, columns.costs, columns.result, columns.profitability, columns.share,
        columns.damagedShipments, columns.damageClaims,
    ];

    return (
        <section className="pallet-panel" aria-labelledby="analytics-comparison-title">
            <div className="analytics-panel-toolbar">
                <div>
                    <Typography variant="h5" id="analytics-comparison-title">{translations.title}</Typography>
                    <p>{translations.subtitle}</p>
                </div>
                <TextField className="analytics-sort-field" fullWidth={false} select size="small" label={pl.analytics.filters.sortBy} value={sortKey}
                           onChange={(event: React.ChangeEvent<HTMLSelectElement>) => onSortKeyChange(event.target.value as PerformanceSortKey)}>
                    {PERFORMANCE_SORT_KEYS.map((key) => <MenuItem key={key} value={key}>{translations.sort[key]}</MenuItem>)}
                </TextField>
            </div>
            <div className="pallet-table-wrap">
                <table className="pallet-table analytics-table">
                    <thead>
                        <tr>
                            <th className="analytics-department-cell">{columns.department}</th>
                            {headers.map((header) => <th key={header} className="analytics-number">{header}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {departments.length ? departments.map((performance) => (
                            <tr key={performance.departmentCode ?? "unknown"}>
                                <td className="analytics-department-cell">
                                    <DepartmentName departmentCode={performance.departmentCode} city={performance.city} />
                                </td>
                                <PerformanceCells performance={performance} currency={report.currency} />
                            </tr>
                        )) : (
                            <tr><td className="pallet-empty" colSpan={headers.length + 1}>{translations.empty}</td></tr>
                        )}
                        {report.unassigned ? (
                            <tr>
                                <td className="analytics-department-cell">{translations.unassigned}</td>
                                <PerformanceCells performance={report.unassigned} currency={report.currency} />
                            </tr>
                        ) : null}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td className="analytics-department-cell">{translations.organization}</td>
                            <PerformanceCells performance={report.organization} currency={report.currency} />
                        </tr>
                    </tfoot>
                </table>
            </div>
        </section>
    );
}

export default DepartmentComparisonTable;
