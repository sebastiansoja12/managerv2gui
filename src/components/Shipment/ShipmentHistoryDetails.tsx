import React, {useEffect, useMemo, useState} from "react";
import {Alert, Box, Button, CircularProgress, Typography} from "@mui/material";
import {ArrowBack, LocalShipping, Map, Refresh, Route} from "@mui/icons-material";
import {useNavigate, useParams} from "react-router-dom";
import ShipmentService from "../../hooks/ShipmentService";
import {ApiErrorResponse} from "../../api/ApiResult";
import RouteLogRecord from "../RouteLog/model/RouteLogRecord";
import {ShipmentDto, ShipmentStatusDto} from "./dto/ShipmentDto";
import pl from "../../i18n/translate";
import {valueObjectValue} from "../../utils/valueObject";
import {shipmentEventDescription} from "./shipmentEventDescription";
import Department from "../../class/depots/Department";
import DepartmentService from "../../hooks/DepartmentService";
import "./styles/shipments.css";

type RouteDetail = RouteLogRecord["routeLogRecordDetails"]["routeLogRecordDetailSet"][number];

const ShipmentRouteMap = React.lazy(() => import("./ShipmentRouteMap"));

const formatDateTime = (date?: string) => {
    if (!date) {
        return pl.common.dash;
    }

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleString(pl.common.locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const routeDetails = (routeLog: RouteLogRecord | null): RouteDetail[] => {
    const details = routeLog?.routeLogRecordDetails?.routeLogRecordDetailSet;
    if (!details) {
        return [];
    }

    return [...details].sort((left, right) => {
        const leftTime = new Date(left.timestamp || "").getTime() || 0;
        const rightTime = new Date(right.timestamp || "").getTime() || 0;
        return leftTime - rightTime;
    });
};

const detailStatus = (detail: RouteDetail) => detail.shipmentStatus || detail.parcelStatus || pl.common.dash;
const detailStatusLabel = (status: string) => pl.shipments.status[status as ShipmentStatusDto] || status;
const detailDepartment = (detail: RouteDetail) => valueObjectValue(detail.departmentCode) || valueObjectValue(detail.depotCode) || pl.common.dash;
const detailUser = (detail: RouteDetail) => detail.username || pl.common.dash;
const detailTerminal = (detail: RouteDetail) => detail.terminalId?.value || detail.zebraId || pl.common.dash;

const fullName = (person?: ShipmentDto["sender"]) => {
    const value = `${person?.firstName || ""} ${person?.lastName || ""}`.trim();
    return value || pl.common.dash;
};

const ShipmentHistoryDetails: React.FC = () => {
    const navigate = useNavigate();
    const {shipmentId, trackingNumber} = useParams();
    const [shipment, setShipment] = useState<ShipmentDto | null>(null);
    const [routeLog, setRouteLog] = useState<RouteLogRecord | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [mapLoading, setMapLoading] = useState<boolean>(false);
    const [mapError, setMapError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const decodedTrackingNumber = trackingNumber ? decodeURIComponent(trackingNumber) : "";
    const details = useMemo(() => routeDetails(routeLog), [routeLog]);

    const loadHistory = async () => {
        setLoading(true);
        setError(null);
        setMapError(null);
        try {
            const response = decodedTrackingNumber
                ? await ShipmentService.getControlCenterByTrackingNumber(decodedTrackingNumber)
                : await ShipmentService.getControlCenter(shipmentId || "");
            setShipment(response.data.shipment);
            setRouteLog(response.data.routeLog);

            if (routeDetails(response.data.routeLog).length && !departments.length) {
                setMapLoading(true);
                try {
                    const departmentResponse = await DepartmentService.getAll();
                    setDepartments(departmentResponse.data);
                } catch (departmentError) {
                    const apiError = departmentError as ApiErrorResponse;
                    setMapError(apiError.message || pl.shipments.routeHistory.mapLoadError);
                } finally {
                    setMapLoading(false);
                }
            }
        } catch (loadError) {
            const apiError = loadError as ApiErrorResponse;
            setError(apiError.message || pl.shipments.messages.loadError);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shipmentId, trackingNumber]);

    const backPath = shipment?.trackingNumber?.value
        ? `/shipments/tracking/${encodeURIComponent(shipment.trackingNumber.value)}/edit`
        : `/shipments/${shipment?.shipmentId.value || shipmentId}/edit`;

    return (
        <div className="shipments-page shipment-history-page">
            <div className="shipments-shell">
                <div className="shipments-header">
                    <div className="shipments-title">
                        <span className="shipments-title-icon"><Map /></span>
                        <Box>
                            <Typography variant="h4">{pl.shipments.routeHistory.detailsTitle}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {shipment
                                    ? `${shipment.trackingNumber?.value || pl.common.dash} · ${fullName(shipment.sender)} → ${fullName(shipment.recipient)}`
                                    : pl.shipments.routeHistory.detailsSubtitle}
                            </Typography>
                        </Box>
                    </div>
                    <div className="shipment-edit-header-actions">
                        <Button startIcon={<ArrowBack />} variant="outlined" onClick={() => navigate(backPath)}>
                            {pl.shipments.page.detailsTitle}
                        </Button>
                        <Button disabled={loading} startIcon={<Refresh />} variant="outlined" onClick={loadHistory}>
                            {pl.common.refresh}
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="shipments-panel shipment-edit-loader">
                        <CircularProgress size={30} />
                        <span>{pl.shipments.routeHistory.loading}</span>
                    </div>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    <div className="shipment-history-layout">
                        <section className="shipments-panel shipment-history-map-panel">
                            <div className="shipment-history-section-header">
                                <div>
                                    <Typography variant="h6">{pl.shipments.routeHistory.mapTitle}</Typography>
                                    <span>{pl.shipments.routeHistory.mapSubtitle}</span>
                                </div>
                                <Route />
                            </div>
                            <div className="shipment-history-map">
                                <React.Suspense fallback={<div className="shipment-history-map-state">{pl.shipments.routeHistory.mapLoading}</div>}>
                                    <ShipmentRouteMap
                                        departments={departments}
                                        details={details}
                                        error={mapError}
                                        loading={mapLoading}
                                    />
                                </React.Suspense>
                            </div>
                        </section>

                        <section className="shipments-panel shipment-history-timeline-panel">
                            <div className="shipment-history-section-header">
                                <div>
                                    <Typography variant="h6">{pl.shipments.routeHistory.timelineTitle}</Typography>
                                    <span>{details.length} {pl.shipments.postCount}</span>
                                </div>
                                <LocalShipping />
                            </div>

                            {details.length ? (
                                <div className="shipment-history-timeline">
                                    {details.map((detail, index) => {
                                        const statusKey = detailStatus(detail);
                                        return (
                                            <article className="shipment-history-event" key={`${detail.id}-${detail.processType}-${index}`}>
                                                <div className="shipment-history-event-index">{index + 1}</div>
                                                <div>
                                                    <div className="shipment-history-event-top">
                                                        <strong>{detail.processType || pl.shipments.routeHistory.defaultOperation}</strong>
                                                        <span>{formatDateTime(detail.timestamp)}</span>
                                                    </div>
                                                    <span className={`shipment-history-status tm-status tm-status-${String(statusKey).toLowerCase()}`}>
                                                        {detailStatusLabel(statusKey)}
                                                    </span>
                                                    <p>{shipmentEventDescription(detail.description)}</p>
                                                    <dl>
                                                        <div><dt>{pl.shipments.routeHistory.department}</dt><dd>{detailDepartment(detail)}</dd></div>
                                                        <div><dt>{pl.shipments.routeHistory.user}</dt><dd>{detailUser(detail)}</dd></div>
                                                        <div><dt>{pl.shipments.routeHistory.terminal}</dt><dd>{detailTerminal(detail)}</dd></div>
                                                    </dl>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="shipment-cc-side-empty">
                                    <Route fontSize="small" />
                                    <span>{pl.shipments.routeHistory.empty}</span>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShipmentHistoryDetails;
