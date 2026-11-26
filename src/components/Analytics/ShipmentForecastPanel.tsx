import React, {useCallback, useEffect, useState} from "react";
import {Alert, TextField, Typography} from "components/ui";
import {getBackendErrorMessage} from "../../api/errorMessage";
import AnalyticsService from "../../hooks/AnalyticsService";
import pl from "../../i18n/translate";
import {decimal, departmentLabel, formatDate, formatNumber} from "./analyticsPresentation";
import ShipmentForecastChart from "./charts/ShipmentForecastChart";
import DepartmentName from "./DepartmentName";
import {DepartmentForecastDto, ShipmentForecastDto} from "./model/Analytics";

type ShipmentForecastPanelProps = {
    departmentCode: string;
    initialDate: string;
};

export const hasForecastHistory = (forecast: DepartmentForecastDto) =>
    forecast.observations.some((observation) => observation.registeredShipments > 0)
    || (forecast.actualShipments ?? 0) > 0;

export const sortByForecast = (departments: DepartmentForecastDto[]) =>
    [...departments].sort((left, right) =>
        (decimal(right.averageShipments) ?? -1) - (decimal(left.averageShipments) ?? -1)
        || String(left.departmentCode).localeCompare(String(right.departmentCode)));

function ForecastRow({name, forecast}: {name: React.ReactNode; forecast: DepartmentForecastDto}) {
    const range = forecast.minimumObserved === null || forecast.maximumObserved === null
        ? pl.common.dash
        : `${forecast.minimumObserved}–${forecast.maximumObserved}`;
    return (
        <tr>
            <td className="analytics-department-cell">{name}</td>
            <td className="analytics-number"><strong>{formatNumber(forecast.expectedShipments)}</strong></td>
            <td className="analytics-number">{formatNumber(forecast.averageShipments)}</td>
            <td className="analytics-number">{range}</td>
            <td className="analytics-number">{formatNumber(forecast.actualShipments)}</td>
        </tr>
    );
}

function ShipmentForecastPanel({departmentCode, initialDate}: ShipmentForecastPanelProps) {
    const translations = pl.analytics.forecast;
    const [targetDate, setTargetDate] = useState(initialDate);
    const [forecast, setForecast] = useState<ShipmentForecastDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!targetDate) {
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await AnalyticsService.forecast(targetDate, departmentCode);
            setForecast(response.data);
        } catch (loadError) {
            setForecast(null);
            setError(getBackendErrorMessage(loadError, translations.loadError));
        } finally {
            setLoading(false);
        }
    }, [departmentCode, targetDate, translations.loadError]);

    useEffect(() => {
        load();
    }, [load]);

    const columns = translations.columns;
    const singleDepartment = Boolean(departmentCode) && forecast?.departments.length === 1;
    const chartForecast = singleDepartment ? forecast?.departments[0] : forecast?.organization;
    const chartLabel = singleDepartment && forecast
        ? departmentLabel(forecast.departments[0].departmentCode, forecast.departments[0].city)
        : translations.organization;
    const departmentsWithHistory = forecast ? sortByForecast(forecast.departments.filter(hasForecastHistory)) : [];
    const departmentsWithoutHistory = forecast ? forecast.departments.filter((department) => !hasForecastHistory(department)) : [];

    return (
        <section className="pallet-panel analytics-forecast" aria-labelledby="analytics-forecast-title">
            <div className="analytics-panel-toolbar">
                <div>
                    <Typography variant="h5" id="analytics-forecast-title">{translations.title}</Typography>
                    <p>{translations.subtitle}</p>
                </div>
                <TextField className="analytics-date-field" fullWidth={false} size="small" type="date"
                           label={translations.date} value={targetDate}
                           onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTargetDate(event.target.value)} />
            </div>
            {error ? <Alert severity="error">{error}</Alert> : null}
            {loading ? <p className="pallet-empty">{translations.loading}</p> : null}
            {!loading && forecast ? (
                <>
                    {forecast.status === "INSUFFICIENT_HISTORY" ? (
                        <Alert severity="info">
                            {translations.insufficient
                                .replace("{observations}", String(forecast.observationDays.length))
                                .replace("{required}", String(forecast.requiredObservations))}
                        </Alert>
                    ) : null}

                    <div className="analytics-chart-block">
                        <Typography variant="h6">{chartLabel}</Typography>
                        {chartForecast && chartForecast.observations.length ? (
                            <ShipmentForecastChart label={chartLabel} targetDate={forecast.targetDate}
                                                   forecast={chartForecast} />
                        ) : <p className="pallet-empty">{translations.noHistory}</p>}
                        {forecast.observationDays.length ? (
                            <p className="analytics-definitions">
                                {translations.basedOn.replace("{days}", forecast.observationDays.map(formatDate).join(", "))}
                            </p>
                        ) : null}
                    </div>

                    <div className="pallet-table-wrap">
                        <table className="pallet-table analytics-table">
                            <thead>
                                <tr>
                                    <th>{columns.department}</th>
                                    <th className="analytics-number">{columns.expected}</th>
                                    <th className="analytics-number">{columns.average}</th>
                                    <th className="analytics-number">{columns.range}</th>
                                    <th className="analytics-number">{columns.actual}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {departmentsWithHistory.map((department) => (
                                    <ForecastRow key={department.departmentCode ?? "unknown"} forecast={department}
                                                 name={<DepartmentName departmentCode={department.departmentCode}
                                                                       city={department.city} />} />
                                ))}
                                {departmentsWithHistory.length === 0 ? (
                                    <tr><td className="pallet-empty" colSpan={5}>{translations.noHistory}</td></tr>
                                ) : null}
                            </tbody>
                            <tfoot>
                                <ForecastRow name={translations.organization} forecast={forecast.organization} />
                            </tfoot>
                        </table>
                    </div>
                    {departmentsWithoutHistory.length ? (
                        <p className="analytics-definitions">
                            {translations.withoutHistory
                                .replace("{count}", String(departmentsWithoutHistory.length))
                                .replace("{departments}", departmentsWithoutHistory
                                    .map((department) => department.departmentCode)
                                    .join(", "))}
                        </p>
                    ) : null}
                </>
            ) : null}
        </section>
    );
}

export default ShipmentForecastPanel;
