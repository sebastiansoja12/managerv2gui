import React from "react";
import pl from "../../../i18n/translate";
import {useMeasuredWidth} from "../../../utils/useMeasuredWidth";
import {decimal, formatMoney} from "../analyticsPresentation";
import {DepartmentPerformanceDto} from "../model/Analytics";

type CostStructureChartProps = {
    departments: DepartmentPerformanceDto[];
    currency: string;
};

const CATEGORIES = ["fuel", "shipmentDamage", "claims"] as const;

function CostStructureChart({departments, currency}: CostStructureChartProps) {
    const translations = pl.analytics.charts.costStructure;
    const chartRef = React.useRef<HTMLDivElement>(null);
    const width = useMeasuredWidth(chartRef, 520);
    const rowHeight = 26;
    const plot = {left: 64, right: 96, top: 6, bottom: 6};
    const height = plot.top + plot.bottom + rowHeight * departments.length;
    const plotWidth = Math.max(width - plot.left - plot.right, 1);
    const maximum = Math.max(...departments.map((department) => decimal(department.costs.total) ?? 0), 1);

    return (
        <div className="analytics-chart" ref={chartRef}>
            <div className="analytics-chart-legend">
                {CATEGORIES.map((category) => (
                    <span key={category}><i className={`is-${category}`} />{translations.series[category]}</span>
                ))}
            </div>
            <svg role="img" aria-label={translations.ariaLabel.replace("{currency}", currency)}
                 viewBox={`0 0 ${width} ${height}`}>
                {departments.map((department, index) => {
                    const y = plot.top + rowHeight * index;
                    let offset = plot.left;
                    return (
                        <g key={department.departmentCode ?? index} data-testid="analytics-cost-row">
                            <text className="analytics-chart-axis analytics-chart-category" x={plot.left - 8}
                                  y={y + rowHeight / 2 + 3} textAnchor="end">
                                {department.departmentCode}
                            </text>
                            {CATEGORIES.map((category) => {
                                const value = decimal(department.costs[category]) ?? 0;
                                const segmentWidth = (value / maximum) * plotWidth;
                                const x = offset;
                                offset += segmentWidth;
                                return value > 0 ? (
                                    <rect key={category} className={`analytics-chart-bar is-${category}`}
                                          x={x} y={y + 5} width={segmentWidth} height={rowHeight - 10}>
                                        <title>{`${department.departmentCode} · ${translations.series[category]}: ${formatMoney(value, currency)}`}</title>
                                    </rect>
                                ) : null;
                            })}
                            <text className="analytics-chart-axis" x={offset + 6} y={y + rowHeight / 2 + 3}>
                                {formatMoney(department.costs.total, currency)}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

export default CostStructureChart;
