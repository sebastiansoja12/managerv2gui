import React, {useState} from "react";
import {Button, Chip, CircularProgress} from "components/ui";
import {Route} from "components/ui/icons";
import pl from "../../i18n/translate";
import {valueObjectValue} from "../../utils/valueObject";
import {ShipmentStatusDto} from "../Shipment/dto/ShipmentDto";
import {shipmentEventDescription} from "../Shipment/shipmentEventDescription";
import {RouteHistoryDetail, RouteHistoryEntry, sortRouteHistoryEntries} from "./routeHistory";
import "./styles/route-history.css";

type RouteHistoryTimelineProps = {
    entries: RouteHistoryEntry[];
    loading?: boolean;
    initialLimit?: number;
};

const detailStatus = (detail: RouteHistoryDetail) => detail.shipmentStatus || detail.parcelStatus || pl.common.dash;

const detailStatusLabel = (status: string) => pl.shipments.status[status as ShipmentStatusDto] || status;

const detailDepartment = (detail: RouteHistoryDetail) =>
    valueObjectValue(detail.departmentCode) || valueObjectValue(detail.depotCode) || pl.common.dash;

const detailTerminal = (detail: RouteHistoryDetail) => detail.terminalId?.value || detail.zebraId || pl.common.dash;

const formatTimestamp = (value?: string) => {
    if (!value) {
        return pl.common.dash;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
        ? value
        : parsed.toLocaleString(pl.common.locale, {day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"});
};

function RouteHistoryTimeline({entries, loading = false, initialLimit = 8}: RouteHistoryTimelineProps) {
    const [expanded, setExpanded] = useState(false);

    if (loading) {
        return (
            <div className="route-history-empty">
                <CircularProgress size={24} />
                <span>{pl.shipments.routeHistory.loading}</span>
            </div>
        );
    }

    if (!entries.length) {
        return (
            <div className="route-history-empty">
                <Route fontSize="small" />
                <span>{pl.shipments.routeHistory.empty}</span>
            </div>
        );
    }

    const sortedEntries = sortRouteHistoryEntries(entries);
    const visibleEntries = expanded ? sortedEntries : sortedEntries.slice(0, initialLimit);

    return (
        <div className="route-history">
            <div className="route-history-timeline">
                {visibleEntries.map(({key, sourceLabel, detail}) => {
                    const status = detailStatus(detail);
                    return (
                        <article className="route-history-item" key={key}>
                            <div className="route-history-dot" />
                            <div className="route-history-body">
                                <div className="route-history-top">
                                    <strong>{detail.processType || pl.shipments.routeHistory.defaultOperation}</strong>
                                    <span>{formatTimestamp(detail.timestamp)}</span>
                                </div>
                                <div className="route-history-tags">
                                    <Chip label={detailStatusLabel(status)} size="small" />
                                    {sourceLabel ? <span className="route-history-source">{sourceLabel}</span> : null}
                                </div>
                                <p>{shipmentEventDescription(detail.description, status)}</p>
                                <dl>
                                    <div><dt>{pl.shipments.routeHistory.department}</dt><dd>{detailDepartment(detail)}</dd></div>
                                    <div><dt>{pl.shipments.routeHistory.user}</dt><dd>{detail.username || pl.common.dash}</dd></div>
                                    <div><dt>{pl.shipments.routeHistory.terminal}</dt><dd>{detailTerminal(detail)}</dd></div>
                                </dl>
                            </div>
                        </article>
                    );
                })}
            </div>
            {sortedEntries.length > initialLimit ? (
                <Button variant="text" onClick={() => setExpanded((current) => !current)}>
                    {expanded ? pl.routeLogs.timeline.showLess : pl.routeLogs.timeline.showAll.replace("{count}", String(sortedEntries.length))}
                </Button>
            ) : null}
        </div>
    );
}

export default RouteHistoryTimeline;
