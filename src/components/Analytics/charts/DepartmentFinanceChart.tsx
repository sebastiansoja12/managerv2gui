import React from "react";
import pl from "../../../i18n/translate";
import {useMeasuredWidth} from "../../../utils/useMeasuredWidth";
import {decimal, formatMoney} from "../analyticsPresentation";
import {DepartmentPerformanceDto} from "../model/Analytics";
import {linearScale, project} from "./chartScale";

type DepartmentFinanceChartProps = {
    departments: DepartmentPerformanceDto[];
    currency: string;
};

const SERIES = ["revenue", "costs", "result"] as const;

type FinanceSeries = typeof SERIES[number];

const seriesValue = (department: DepartmentPerformanceDto, series: FinanceSeries) => {
    if (series === "revenue") {
        return decimal(department.revenue) ?? 0;
    }
    if (series === "costs") {
        return decimal(department.costs.total) ?? 0;
    }
    return decimal(department.financialResult) ?? 0;
};

const compactMoney = (value: number, currency: string) =>
    new Intl.NumberFormat(String(pl.common.locale), {
        style: "currency",
        currency,
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);

function DepartmentFinanceChart({departments, currency}: DepartmentFinanceChartProps) {
    const translations = pl.analytics.charts.finance;
    const chartRef = React.useRef<HTMLDivElement>(null);
    const width = useMeasuredWidth(chartRef);
    const height = 280;
    const plot = {left: 72, right: 16, top: 16, bottom: 40};
    const plotWidth = Math.max(width - plot.left - plot.right, 1);
    const plotHeight = height - plot.top - plot.bottom;
    const scale = linearScale(departments.flatMap((department) => SERIES.map((series) => seriesValue(department, series))));
    const zeroY = project(0, scale, plot.top, plotHeight);
    const groupWidth = plotWidth / Math.max(departments.length, 1);
    const barWidth = Math.max(Math.min((groupWidth * 0.72) / SERIES.length, 28), 4);
    const labelEvery = Math.max(1, Math.ceil(departments.length / Math.max(Math.floor(plotWidth / 56), 1)));

    return (
        <div className="analytics-chart" ref={chartRef}>
            <div className="analytics-chart-legend">
                {SERIES.map((series) => (
                    <span key={series}><i className={`is-${series}`} />{translations.series[series]}</span>
                ))}
            </div>
            <svg role="img" aria-label={translations.ariaLabel.replace("{currency}", currency)}
                 viewBox={`0 0 ${width} ${height}`}>
                {scale.ticks.map((tick) => {
                    const y = project(tick, scale, plot.top, plotHeight);
                    return (
                        <g key={tick}>
                            <line className="analytics-chart-grid" x1={plot.left} x2={width - plot.right} y1={y} y2={y} />
                            <text className="analytics-chart-axis" x={plot.left - 8} y={y + 3} textAnchor="end">
                                {compactMoney(tick, currency)}
                            </text>
                        </g>
                    );
                })}
                <line className="analytics-chart-zero" x1={plot.left} x2={width - plot.right} y1={zeroY} y2={zeroY} />
                {departments.map((department, index) => {
                    const groupX = plot.left + groupWidth * index + (groupWidth - barWidth * SERIES.length) / 2;
                    return (
                        <g key={department.departmentCode ?? index} data-testid="analytics-finance-group">
                            {SERIES.map((series, seriesIndex) => {
                                const value = seriesValue(department, series);
                                const y = project(value, scale, plot.top, plotHeight);
                                const negative = series === "result" && value < 0;
                                return (
                                    <rect key={series}
                                          className={`analytics-chart-bar is-${series}${negative ? " is-negative" : ""}`}
                                          x={groupX + barWidth * seriesIndex}
                                          y={Math.min(y, zeroY)}
                                          width={barWidth - 2}
                                          height={Math.max(Math.abs(zeroY - y), value === 0 ? 0 : 1)}
                                          rx={Math.min(3, barWidth / 3)}>
                                        <title>{`${department.departmentCode} · ${translations.series[series]}: ${formatMoney(value, currency)}`}</title>
                                    </rect>
                                );
                            })}
                            {index % labelEvery === 0 ? (
                                <text className="analytics-chart-axis analytics-chart-category" textAnchor="middle"
                                      x={plot.left + groupWidth * index + groupWidth / 2} y={height - 16}>
                                    {department.departmentCode}
                                </text>
                            ) : null}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

export default DepartmentFinanceChart;
