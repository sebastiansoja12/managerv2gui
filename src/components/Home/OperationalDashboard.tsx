import React, {FormEvent, useEffect, useMemo, useState} from "react";
import {
    AttachMoney,
    Business,
    CheckCircleOutline,
    ChevronRight,
    History,
    Inventory2,
    LocalShipping,
    Loop,
    Refresh,
    Search,
    TrendingUp,
} from "components/ui/icons";
import {MenuItem, TextField} from "components/ui";
import {useNavigate} from "react-router-dom";
import {getBackendErrorMessage} from "../../api/errorMessage";
import {useAuthState} from "../../auth/AuthState";
import Department from "../../class/depots/Department";
import DeliveryNetworkService from "../../hooks/DeliveryNetworkService";
import DepartmentService from "../../hooks/DepartmentService";
import ReturnService from "../../hooks/ReturnService";
import ShipmentService from "../../hooks/ShipmentService";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "../AppShell/types";
import {DepartmentRelation} from "../Departments/model/DepartmentRelation";
import {ReturnPackageDto} from "../Returns/model/ReturnPackage";
import {ShipmentDto, ShipmentStatusDto} from "../Shipment/dto/ShipmentDto";
import DepartmentNetworkMap from "./DepartmentNetworkMap";
import {
    buildTurnoverSeries,
    calculateMoneyTotals,
    DashboardPeriodDays,
    filterShipmentsForDepartment,
    getPrimaryCurrency,
    shipmentsInPeriod,
    TurnoverDay,
} from "./homeDashboardData";
import "./styles/home-dashboard.css";

type OperationalDashboardProps = {
    onOpenTab?: (tab: AppTabDefinition) => void;
};

type ShipmentLookupCriterion = "TRACKING_NUMBER" | "SHIPMENT_ID";

const SHIPMENT_PAGE_SIZE = 100;
const MAX_SHIPMENT_PAGES = 20;
const ACTIVE_SHIPMENT_STATUSES: ShipmentStatusDto[] = ["PREPARED", "ACCEPTED", "REROUTE", "SENT", "REDIRECT"];

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return pl.common.dash;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleString(pl.common.locale, {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
};

const formatMoney = (amount: number, currency: string, compact = false) => new Intl.NumberFormat(
    pl.common.locale,
    {
        currency,
        maximumFractionDigits: compact ? 0 : 2,
        notation: compact ? "compact" : "standard",
        style: "currency",
    },
).format(amount);

const loadShipments = async () => {
    const shipments: ShipmentDto[] = [];
    let page = 0;
    let currentPage: ShipmentDto[] = [];

    do {
        const response = await ShipmentService.search({
            page,
            size: SHIPMENT_PAGE_SIZE,
        });
        currentPage = response.data;
        shipments.push(...currentPage);
        page += 1;
    } while (currentPage.length === SHIPMENT_PAGE_SIZE && page < MAX_SHIPMENT_PAGES);

    return shipments;
};

const sortByNewest = <T extends {createdAt?: string | null}>(items: T[]) => [...items].sort((left, right) => (
    new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime()
));

type TurnoverChartProps = {
    currency: string;
    periodDays: DashboardPeriodDays;
    series: TurnoverDay[];
};

function TurnoverChart({currency, periodDays, series}: TurnoverChartProps) {
    const width = 760;
    const height = 280;
    const plot = {left: 48, right: 60, top: 20, bottom: 45};
    const plotWidth = width - plot.left - plot.right;
    const plotHeight = height - plot.top - plot.bottom;
    const countMaximum = Math.max(...series.map((day) => day.shipmentCount), 0);
    const costMaximum = Math.max(...series.map((day) => day.totalCost), 0);
    const maxCount = Math.max(countMaximum, 1);
    const maxCost = Math.max(costMaximum, 1);
    const step = plotWidth / Math.max(series.length, 1);
    const barWidth = Math.max(Math.min(step * 0.56, 34), 5);
    const points = series.map((day, index) => {
        const x = plot.left + step * index + step / 2;
        const y = plot.top + plotHeight - (day.totalCost / maxCost) * plotHeight;
        return {day, x, y};
    });
    const linePath = points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
    const areaPath = points.length
        ? `${linePath} L${points[points.length - 1].x},${plot.top + plotHeight} L${points[0].x},${plot.top + plotHeight} Z`
        : "";
    const labelEvery = periodDays === 7 ? 1 : periodDays === 14 ? 2 : 5;

    return (
        <div className="home-turnover-chart">
            <svg aria-label={pl.home.dashboard.chart.ariaLabel} role="img" viewBox={`0 0 ${width} ${height}`}>
                <defs>
                    <linearGradient id="home-turnover-area" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0" stopColor="var(--warning)" stopOpacity="0.24" />
                        <stop offset="1" stopColor="var(--warning)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
                    const y = plot.top + plotHeight * fraction;
                    const countLabel = countMaximum === 0
                        ? (fraction === 1 ? "0" : "")
                        : Number.isInteger(countMaximum * (1 - fraction))
                            ? String(countMaximum * (1 - fraction))
                            : "";
                    const costLabel = costMaximum === 0
                        ? (fraction === 1 ? formatMoney(0, currency, true) : "")
                        : formatMoney(costMaximum * (1 - fraction), currency, true);
                    return (
                        <g key={fraction}>
                            <line className="home-chart-grid-line" x1={plot.left} x2={width - plot.right} y1={y} y2={y} />
                            <text className="home-chart-axis-label" x={plot.left - 9} y={y + 4} textAnchor="end">
                                {countLabel}
                            </text>
                            <text className="home-chart-axis-label" x={width - plot.right + 9} y={y + 4}>
                                {costLabel}
                            </text>
                        </g>
                    );
                })}
                {areaPath ? <path d={areaPath} fill="url(#home-turnover-area)" /> : undefined}
                {series.map((day, index) => {
                    const x = plot.left + step * index + (step - barWidth) / 2;
                    const barHeight = (day.shipmentCount / maxCount) * plotHeight;
                    return (
                        <g key={day.dateKey}>
                            <rect
                                className="home-chart-bar"
                                height={barHeight}
                                rx={Math.min(5, barWidth / 2)}
                                width={barWidth}
                                x={x}
                                y={plot.top + plotHeight - barHeight}
                            >
                                <title>{`${day.date.toLocaleDateString(pl.common.locale)} · ${day.shipmentCount} · ${formatMoney(day.totalCost, currency)}`}</title>
                            </rect>
                            {index % labelEvery === 0 || index === series.length - 1 ? (
                                <text
                                    className="home-chart-date-label"
                                    textAnchor="middle"
                                    x={plot.left + step * index + step / 2}
                                    y={height - 14}
                                >
                                    {day.date.toLocaleDateString(pl.common.locale, {day: "2-digit", month: "short"})}
                                </text>
                            ) : undefined}
                        </g>
                    );
                })}
                {linePath ? <path className="home-chart-line" d={linePath} /> : undefined}
                {periodDays === 7 ? points.map(({day, x, y}) => (
                    <circle className="home-chart-point" cx={x} cy={y} key={day.dateKey} r="4">
                        <title>{`${day.date.toLocaleDateString(pl.common.locale)} · ${formatMoney(day.totalCost, currency)}`}</title>
                    </circle>
                )) : undefined}
            </svg>
        </div>
    );
}

function OperationalDashboard({onOpenTab}: OperationalDashboardProps) {
    const navigate = useNavigate();
    const {user} = useAuthState();
    const [lookupCriterion, setLookupCriterion] = useState<ShipmentLookupCriterion>("TRACKING_NUMBER");
    const [lookupValue, setLookupValue] = useState("");
    const [periodDays, setPeriodDays] = useState<DashboardPeriodDays>(7);
    const [shipments, setShipments] = useState<ShipmentDto[]>([]);
    const [returnPackages, setReturnPackages] = useState<ReturnPackageDto[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [relations, setRelations] = useState<DepartmentRelation[]>([]);
    const [loading, setLoading] = useState(false);
    const [dashboardError, setDashboardError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const departmentCode = user?.departmentCode || "";
    const trimmedLookupValue = lookupValue.trim();
    const validLookupValue = Boolean(trimmedLookupValue)
        && (lookupCriterion === "TRACKING_NUMBER" || /^\d+$/.test(trimmedLookupValue));

    useEffect(() => {
        if (!departmentCode) {
            return undefined;
        }

        let ignore = false;
        setLoading(true);
        setDashboardError("");
        Promise.allSettled([
            loadShipments(),
            ReturnService.getAllByDepartment(departmentCode),
            DepartmentService.getAll().then((response) => response.data),
            DeliveryNetworkService.getCurrentNetwork().then((response) => response.data),
        ]).then(([shipmentResult, returnResult, departmentResult, relationResult]) => {
            if (ignore) {
                return;
            }

            const loadedDepartments = departmentResult.status === "fulfilled" ? departmentResult.value : [];
            const currentDepartment = loadedDepartments.find(
                (department) => department.departmentCode?.value === departmentCode,
            );
            setShipments(shipmentResult.status === "fulfilled"
                ? filterShipmentsForDepartment(
                    shipmentResult.value,
                    departmentCode,
                    currentDepartment?.departmentId,
                )
                : []);
            setReturnPackages(returnResult.status === "fulfilled" ? returnResult.value : []);
            setDepartments(loadedDepartments);
            setRelations(relationResult.status === "fulfilled" ? relationResult.value : []);

            const failure = [shipmentResult, returnResult, departmentResult, relationResult]
                .find((result) => result.status === "rejected");
            if (failure?.status === "rejected") {
                setDashboardError(getBackendErrorMessage(failure.reason, pl.home.dashboard.messages.loadError));
            }
            setLastUpdated(new Date());
        }).finally(() => {
            if (!ignore) {
                setLoading(false);
            }
        });

        return () => {
            ignore = true;
        };
    }, [departmentCode, reloadKey]);

    const periodShipments = useMemo(
        () => shipmentsInPeriod(shipments, periodDays),
        [periodDays, shipments],
    );
    const primaryCurrency = useMemo(() => getPrimaryCurrency(periodShipments), [periodShipments]);
    const moneyTotals = useMemo(() => calculateMoneyTotals(periodShipments), [periodShipments]);
    const turnoverSeries = useMemo(
        () => buildTurnoverSeries(periodShipments, periodDays, primaryCurrency),
        [periodDays, periodShipments, primaryCurrency],
    );
    const activeShipmentCount = periodShipments.filter(
        (shipment) => ACTIVE_SHIPMENT_STATUSES.includes(shipment.shipmentStatus),
    ).length;
    const deliveredShipmentCount = periodShipments.filter(
        (shipment) => shipment.shipmentStatus === "DELIVERY",
    ).length;
    const activeReturnCount = returnPackages.filter(
        (returnPackage) => !["COMPLETED", "CANCELLED"].includes(returnPackage.returnStatus),
    ).length;
    const recentShipments = useMemo(() => sortByNewest(periodShipments).slice(0, 5), [periodShipments]);
    const recentReturns = useMemo(() => sortByNewest(returnPackages).slice(0, 5), [returnPackages]);
    const totalMoneyLabel = moneyTotals.length
        ? moneyTotals.map((total) => formatMoney(total.amount, total.currency)).join(" + ")
        : formatMoney(0, primaryCurrency);

    const openTab = (tab: AppTabDefinition) => {
        if (onOpenTab) {
            onOpenTab(tab);
            return;
        }
        navigate(tab.path);
    };

    const openShipment = (view: "details" | "history") => {
        if (!validLookupValue) {
            return;
        }

        const encodedValue = encodeURIComponent(trimmedLookupValue);
        const searchingByTrackingNumber = lookupCriterion === "TRACKING_NUMBER";
        const tabLabelTemplate = searchingByTrackingNumber
            ? (view === "details" ? pl.home.trackingLookup.detailsTabLabel : pl.home.trackingLookup.historyTabLabel)
            : (view === "details" ? pl.home.trackingLookup.detailsByIdTabLabel : pl.home.trackingLookup.historyByIdTabLabel);
        const path = searchingByTrackingNumber
            ? (view === "details" ? `/shipments/tracking/${encodedValue}/edit` : `/shipments/tracking/${encodedValue}/history`)
            : (view === "details" ? `/shipments/${encodedValue}/edit` : `/shipments/${encodedValue}/history`);

        openTab({
            label: tabLabelTemplate
                .replace("{trackingNumber}", trimmedLookupValue)
                .replace("{shipmentId}", trimmedLookupValue),
            path,
        });
    };

    const openShipmentDetails = (shipment: ShipmentDto) => {
        const shipmentId = shipment.shipmentId.value;
        openTab({
            label: pl.home.trackingLookup.detailsByIdTabLabel.replace("{shipmentId}", shipmentId),
            path: `/shipments/${encodeURIComponent(shipmentId)}/edit`,
        });
    };

    const openReturnDetails = (returnPackage: ReturnPackageDto) => {
        const returnId = returnPackage.returnPackageId.value;
        openTab({
            label: `${pl.returns.details.title} #${returnId}`,
            path: `/returns/${encodeURIComponent(returnId)}`,
        });
    };

    const searchShipment = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        openShipment("details");
    };

    const firstName = user?.firstName || user?.username || pl.navigation.defaultUserName;

    return (
        <main className="home-dashboard-page">
            <header className="home-dashboard-header">
                <div>
                    <span className="home-dashboard-kicker">{pl.home.dashboard.kicker}</span>
                    <h1>{pl.home.dashboard.greeting.replace("{name}", firstName)}</h1>
                    <p>{pl.home.dashboard.subtitle}</p>
                </div>
                <div className="home-dashboard-context">
                    <span>{pl.home.dashboard.department}</span>
                    <strong><Business fontSize="small" />{departmentCode || pl.common.dash}</strong>
                    <small>{lastUpdated
                        ? pl.home.dashboard.updatedAt.replace("{time}", lastUpdated.toLocaleTimeString(pl.common.locale, {hour: "2-digit", minute: "2-digit"}))
                        : pl.home.dashboard.waitingForData}</small>
                    <button
                        aria-label={pl.home.dashboard.refresh}
                        disabled={loading || !departmentCode}
                        onClick={() => setReloadKey((current) => current + 1)}
                        type="button"
                    >
                        <Refresh className={loading ? "is-spinning" : ""} fontSize="small" />
                        {pl.home.dashboard.refresh}
                    </button>
                </div>
            </header>

            {dashboardError ? (
                <div className="home-dashboard-alert" role="alert">
                    <span>{dashboardError}</span>
                    <button onClick={() => setReloadKey((current) => current + 1)} type="button">
                        {pl.home.dashboard.messages.retry}
                    </button>
                </div>
            ) : undefined}

            <section className="home-tracking-lookup" aria-label={pl.home.trackingLookup.ariaLabel}>
                <div className="home-tracking-lookup-intro">
                    <span className="home-tracking-lookup-icon"><LocalShipping fontSize="small" /></span>
                    <div><span>{pl.home.trackingLookup.kicker}</span><strong>{pl.home.trackingLookup.title}</strong></div>
                </div>
                <form className="home-tracking-lookup-form" onSubmit={searchShipment}>
                    <div className="home-tracking-criterion">
                        <span>{pl.home.trackingLookup.criterionLabel}</span>
                        <TextField
                            aria-label={pl.home.trackingLookup.criterionLabel}
                            select
                            size="small"
                            value={lookupCriterion}
                            onChange={(event) => {
                                setLookupCriterion(event.target.value as ShipmentLookupCriterion);
                                setLookupValue("");
                            }}
                        >
                            <MenuItem value="TRACKING_NUMBER">{pl.home.trackingLookup.criteria.trackingNumber}</MenuItem>
                            <MenuItem value="SHIPMENT_ID">{pl.home.trackingLookup.criteria.shipmentId}</MenuItem>
                        </TextField>
                    </div>
                    <label className="home-tracking-value">
                        <span>{lookupCriterion === "TRACKING_NUMBER"
                            ? pl.home.trackingLookup.inputLabel
                            : pl.home.trackingLookup.shipmentIdInputLabel}</span>
                        <input
                            aria-label={lookupCriterion === "TRACKING_NUMBER"
                                ? pl.home.trackingLookup.inputLabel
                                : pl.home.trackingLookup.shipmentIdInputLabel}
                            inputMode={lookupCriterion === "SHIPMENT_ID" ? "numeric" : "text"}
                            pattern={lookupCriterion === "SHIPMENT_ID" ? "[0-9]*" : undefined}
                            placeholder={lookupCriterion === "TRACKING_NUMBER"
                                ? pl.home.trackingLookup.placeholder
                                : pl.home.trackingLookup.shipmentIdPlaceholder}
                            type="text"
                            value={lookupValue}
                            onChange={(event) => setLookupValue(event.target.value)}
                        />
                    </label>
                    <button className="home-tracking-primary" disabled={!validLookupValue} type="submit">
                        <Search fontSize="small" /><span>{pl.home.trackingLookup.search}</span>
                    </button>
                    <button
                        className="home-tracking-secondary"
                        disabled={!validLookupValue}
                        type="button"
                        onClick={() => openShipment("history")}
                    >
                        <History fontSize="small" /><span>{pl.home.trackingLookup.showHistory}</span>
                    </button>
                </form>
            </section>

            <section className="home-dashboard-metrics" aria-label={pl.home.dashboard.metrics.ariaLabel}>
                <article className="home-metric-card is-primary">
                    <span className="home-metric-icon"><Inventory2 fontSize="small" /></span>
                    <span>{pl.home.dashboard.metrics.shipments}</span>
                    <strong>{loading ? <i className="home-metric-loading" /> : periodShipments.length.toLocaleString(pl.common.locale)}</strong>
                    <small>{pl.home.dashboard.metrics.period.replace("{days}", String(periodDays))}</small>
                </article>
                <article className="home-metric-card is-blue">
                    <span className="home-metric-icon"><LocalShipping fontSize="small" /></span>
                    <span>{pl.home.dashboard.metrics.inProgress}</span>
                    <strong>{loading ? <i className="home-metric-loading" /> : activeShipmentCount.toLocaleString(pl.common.locale)}</strong>
                    <small>{pl.home.dashboard.metrics.currentFlow}</small>
                </article>
                <article className="home-metric-card is-green">
                    <span className="home-metric-icon"><CheckCircleOutline fontSize="small" /></span>
                    <span>{pl.home.dashboard.metrics.delivered}</span>
                    <strong>{loading ? <i className="home-metric-loading" /> : deliveredShipmentCount.toLocaleString(pl.common.locale)}</strong>
                    <small>{pl.home.dashboard.metrics.completedFlow}</small>
                </article>
                <article className="home-metric-card is-rose">
                    <span className="home-metric-icon"><Loop fontSize="small" /></span>
                    <span>{pl.home.dashboard.metrics.returns}</span>
                    <strong>{loading ? <i className="home-metric-loading" /> : activeReturnCount.toLocaleString(pl.common.locale)}</strong>
                    <small>{pl.home.dashboard.metrics.activeReturns}</small>
                </article>
                <article className="home-metric-card is-amber">
                    <span className="home-metric-icon"><AttachMoney fontSize="small" /></span>
                    <span>{pl.home.dashboard.metrics.turnover}</span>
                    <strong className="home-metric-money">{loading ? <i className="home-metric-loading" /> : totalMoneyLabel}</strong>
                    <small>{pl.home.dashboard.metrics.totalCost}</small>
                </article>
            </section>

            <section className="home-dashboard-main-grid">
                <section className="home-panel home-turnover-panel" aria-label={pl.home.dashboard.chart.title}>
                    <header className="home-panel-header">
                        <div>
                            <span className="home-panel-kicker"><TrendingUp fontSize="small" />{pl.home.dashboard.chart.kicker}</span>
                            <h2>{pl.home.dashboard.chart.title}</h2>
                            <p>{pl.home.dashboard.chart.subtitle.replace("{department}", departmentCode || pl.common.dash)}</p>
                        </div>
                        <div className="home-period-switch" aria-label={pl.home.dashboard.chart.periodLabel}>
                            {([7, 14, 30] as DashboardPeriodDays[]).map((days) => (
                                <button
                                    aria-pressed={periodDays === days}
                                    className={periodDays === days ? "is-active" : ""}
                                    key={days}
                                    onClick={() => setPeriodDays(days)}
                                    type="button"
                                >
                                    {pl.home.dashboard.chart.days.replace("{days}", String(days))}
                                </button>
                            ))}
                        </div>
                    </header>
                    <div className="home-chart-legend">
                        <span><i className="is-shipments" />{pl.home.dashboard.chart.shipments}</span>
                        <span><i className="is-cost" />{pl.home.dashboard.chart.cost} ({primaryCurrency})</span>
                    </div>
                    {loading ? <div className="home-dashboard-skeleton home-chart-skeleton" /> : (
                        <TurnoverChart currency={primaryCurrency} periodDays={periodDays} series={turnoverSeries} />
                    )}
                </section>

                <DepartmentNetworkMap
                    departmentCode={departmentCode}
                    departments={departments}
                    loading={loading}
                    relations={relations}
                />
            </section>

            <section className="home-dashboard-lists">
                <section className="home-panel home-activity-panel">
                    <header className="home-panel-header home-list-header">
                        <div>
                            <span className="home-panel-kicker"><Inventory2 fontSize="small" />{pl.home.dashboard.shipments.kicker}</span>
                            <h2>{pl.home.dashboard.shipments.title}</h2>
                        </div>
                        <button onClick={() => openTab({label: pl.home.tiles.shipmentList.title, path: "/shipments/list"})} type="button">
                            {pl.home.dashboard.showAll}<ChevronRight fontSize="small" />
                        </button>
                    </header>
                    <div className="home-activity-list">
                        {loading ? Array.from({length: 4}, (_, index) => <i className="home-activity-skeleton" key={index} />) : undefined}
                        {!loading && recentShipments.map((shipment) => (
                            <button className="home-activity-row" key={shipment.shipmentId.value} onClick={() => openShipmentDetails(shipment)} type="button">
                                <span className="home-activity-id">#{shipment.shipmentId.value}</span>
                                <span className="home-activity-main">
                                    <strong>{shipment.trackingNumber?.value || pl.common.dash}</strong>
                                    <small>{shipment.recipient?.city || pl.common.dash} · {formatDateTime(shipment.createdAt)}</small>
                                </span>
                                <span className={`home-status is-${shipment.shipmentStatus.toLowerCase()}`}>
                                    {pl.shipments.status[shipment.shipmentStatus] || shipment.shipmentStatus}
                                </span>
                                <span className="home-activity-money">{formatMoney(shipment.price?.amount || 0, shipment.price?.currency || "PLN")}</span>
                                <ChevronRight fontSize="small" />
                            </button>
                        ))}
                        {!loading && !recentShipments.length ? <div className="home-list-empty">{pl.home.dashboard.shipments.empty}</div> : undefined}
                    </div>
                </section>

                <section className="home-panel home-activity-panel">
                    <header className="home-panel-header home-list-header">
                        <div>
                            <span className="home-panel-kicker"><Loop fontSize="small" />{pl.home.dashboard.returns.kicker}</span>
                            <h2>{pl.home.dashboard.returns.title}</h2>
                        </div>
                        <button onClick={() => openTab({label: pl.home.tiles.returns.title, path: "/returns"})} type="button">
                            {pl.home.dashboard.showAll}<ChevronRight fontSize="small" />
                        </button>
                    </header>
                    <div className="home-activity-list">
                        {loading ? Array.from({length: 4}, (_, index) => <i className="home-activity-skeleton" key={index} />) : undefined}
                        {!loading && recentReturns.map((returnPackage) => (
                            <button className="home-activity-row is-return" key={returnPackage.returnPackageId.value} onClick={() => openReturnDetails(returnPackage)} type="button">
                                <span className="home-activity-id">R#{returnPackage.returnPackageId.value}</span>
                                <span className="home-activity-main">
                                    <strong>{pl.home.dashboard.returns.shipment.replace("{id}", returnPackage.shipmentId.value)}</strong>
                                    <small>{pl.returns.reasonCodes[returnPackage.reasonCode.value as keyof typeof pl.returns.reasonCodes] || returnPackage.reasonCode.value} · {formatDateTime(returnPackage.createdAt)}</small>
                                </span>
                                <span className={`home-status is-${returnPackage.returnStatus.toLowerCase()}`}>
                                    {pl.returns.status[returnPackage.returnStatus] || returnPackage.returnStatus}
                                </span>
                                <ChevronRight fontSize="small" />
                            </button>
                        ))}
                        {!loading && !recentReturns.length ? <div className="home-list-empty">{pl.home.dashboard.returns.empty}</div> : undefined}
                    </div>
                </section>
            </section>

        </main>
    );
}

export default OperationalDashboard;
