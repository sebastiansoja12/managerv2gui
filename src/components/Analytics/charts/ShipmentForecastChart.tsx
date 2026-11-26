import React from "react";
import pl from "../../../i18n/translate";
import {useMeasuredWidth} from "../../../utils/useMeasuredWidth";
import {decimal, formatDate, formatNumber} from "../analyticsPresentation";
import {DepartmentForecastDto} from "../model/Analytics";
import {linearScale, project} from "./chartScale";

type ShipmentForecastChartProps = {
    label: string;
    targetDate: string;
    forecast: DepartmentForecastDto;
};

const shortDate = (value: string) =>
    new Intl.DateTimeFormat(String(pl.common.locale), {day: "2-digit", month: "2-digit"})
        .format(new Date(`${value}T00:00:00`));

function ShipmentForecastChart({label, targetDate, forecast}: ShipmentForecastChartProps) {
    const translations = pl.analytics.charts.forecast;
    const chartRef = React.useRef<HTMLDivElement>(null);
    const width = useMeasuredWidth(chartRef, 520);
    const height = 220;
    const plot = {left: 40, right: 16, top: 16, bottom: 36};
    const plotWidth = Math.max(width - plot.left - plot.right, 1);
    const plotHeight = height - plot.top - plot.bottom;
    const average = decimal(forecast.averageShipments);
    const expected = forecast.expectedShipments;
    const columns = [
        ...forecast.observations.map((observation) => ({
            key: observation.day,
            day: observation.day,
            value: observation.registeredShipments,
            kind: "observation" as const,
        })),
        {key: "target", day: targetDate, value: forecast.actualShipments ?? expected ?? 0, kind: "target" as const},
    ];
    const scale = linearScale([
        ...columns.map((column) => column.value),
        expected ?? 0,
        forecast.actualShipments ?? 0,
    ]);
    const step = plotWidth / columns.length;
    const barWidth = Math.max(Math.min(step * 0.6, 32), 4);
    const baseY = project(0, scale, plot.top, plotHeight);
    const averageY = average === null ? null : project(average, scale, plot.top, plotHeight);

    return (
        <div className="analytics-chart" ref={chartRef}>
            <div className="analytics-chart-legend">
                <span><i className="is-observation" />{translations.observed}</span>
                {average !== null ? <span><i className="is-average" />{translations.average}</span> : null}
                {expected !== null ? <span><i className="is-expected" />{translations.expected}</span> : null}
                {forecast.actualShipments !== null ? <span><i className="is-actual" />{translations.actual}</span> : null}
            </div>
            <svg role="img"
                 aria-label={translations.ariaLabel.replace("{department}", label).replace("{date}", formatDate(targetDate))}
                 viewBox={`0 0 ${width} ${height}`}>
                {scale.ticks.map((tick) => {
                    const y = project(tick, scale, plot.top, plotHeight);
                    return (
                        <g key={tick}>
                            <line className="analytics-chart-grid" x1={plot.left} x2={width - plot.right} y1={y} y2={y} />
                            <text className="analytics-chart-axis" x={plot.left - 8} y={y + 3} textAnchor="end">
                                {formatNumber(tick)}
                            </text>
                        </g>
                    );
                })}
                {columns.map((column, index) => {
                    const x = plot.left + step * index + (step - barWidth) / 2;
                    const y = project(column.value, scale, plot.top, plotHeight);
                    const isTarget = column.kind === "target";
                    const showExpected = isTarget && expected !== null;
                    const showActual = isTarget && forecast.actualShipments !== null;
                    return (
                        <g key={column.key}>
                            {!isTarget ? (
                                <rect className="analytics-chart-bar is-observation" data-testid="analytics-forecast-observation"
                                      x={x} y={y} width={barWidth} height={baseY - y} rx={3}>
                                    <title>{`${formatDate(column.day)}: ${formatNumber(column.value)}`}</title>
                                </rect>
                            ) : null}
                            {showActual ? (
                                <rect className="analytics-chart-bar is-actual" x={x} y={y} width={barWidth}
                                      height={baseY - y} rx={3}>
                                    <title>{`${formatDate(column.day)} · ${translations.actual}: ${formatNumber(forecast.actualShipments)}`}</title>
                                </rect>
                            ) : null}
                            {showExpected ? (
                                <rect className="analytics-chart-bar is-expected" data-testid="analytics-forecast-expected"
                                      x={x} y={project(expected, scale, plot.top, plotHeight)} width={barWidth}
                                      height={baseY - project(expected, scale, plot.top, plotHeight)} rx={3}>
                                    <title>{`${formatDate(column.day)} · ${translations.expected}: ${formatNumber(expected)}`}</title>
                                </rect>
                            ) : null}
                            <text className={`analytics-chart-axis${isTarget ? " analytics-chart-category" : ""}`}
                                  textAnchor="middle" x={plot.left + step * index + step / 2} y={height - 14}>
                                {shortDate(column.day)}
                            </text>
                        </g>
                    );
                })}
                {averageY !== null ? (
                    <line className="analytics-chart-average" x1={plot.left} x2={width - plot.right}
                          y1={averageY} y2={averageY}>
                        <title>{`${translations.average}: ${formatNumber(average)}`}</title>
                    </line>
                ) : null}
            </svg>
        </div>
    );
}

export default ShipmentForecastChart;
