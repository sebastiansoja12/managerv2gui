import React, {useState} from "react";
import {Button, Chip, CircularProgress} from "components/ui";
import {History} from "components/ui/icons";
import pl from "../../i18n/translate";
import Department from "../../class/depots/Department";
import {PalletHistoryEntryDto, PalletStatusDto} from "./model/Pallet";
import {formatPalletDate, palletStatusLabel} from "./palletLabels";
import "../RouteLog/styles/route-history.css";

type PalletHistoryTimelineProps = {
    entries: PalletHistoryEntryDto[];
    departmentsById: Map<string, Department>;
    loading?: boolean;
    error?: string | null;
    initialLimit?: number;
};

const eventLabel = (eventType: string) => {
    const labels = pl.pallets.history.events as Record<string, string>;
    return labels[eventType] || labels.UNKNOWN;
};

const departmentLabel = (departmentsById: Map<string, Department>, departmentId?: number | string | null) => {
    if (departmentId === null || departmentId === undefined || departmentId === "") {
        return pl.common.dash;
    }
    const department = departmentsById.get(String(departmentId));
    return department?.departmentCode?.value
        ? [department.departmentCode.value, department.address?.city].filter(Boolean).join(" · ")
        : String(departmentId);
};

const timestamp = (entry: PalletHistoryEntryDto) => {
    const parsed = entry.occurredAt ? new Date(entry.occurredAt).getTime() : Number.NaN;
    return Number.isNaN(parsed) ? 0 : parsed;
};

function PalletHistoryTimeline({entries, departmentsById, loading = false, error = null, initialLimit = 8}: PalletHistoryTimelineProps) {
    const [expanded, setExpanded] = useState(false);

    if (loading) {
        return (
            <div className="route-history-empty">
                <CircularProgress size={24} />
                <span>{pl.pallets.history.loading}</span>
            </div>
        );
    }

    if (error || !entries.length) {
        return (
            <div className="route-history-empty">
                <History fontSize="small" />
                <span>{error || pl.pallets.history.empty}</span>
            </div>
        );
    }

    const sortedEntries = [...entries].sort((left, right) => timestamp(right) - timestamp(left));
    const visibleEntries = expanded ? sortedEntries : sortedEntries.slice(0, initialLimit);

    return (
        <div className="route-history">
            <div className="route-history-timeline">
                {visibleEntries.map((entry, index) => (
                    <article className="route-history-item" key={`${entry.occurredAt}-${entry.eventType}-${index}`}>
                        <div className="route-history-dot" />
                        <div className="route-history-body">
                            <div className="route-history-top">
                                <strong>{eventLabel(entry.eventType)}</strong>
                                <span>{formatPalletDate(entry.occurredAt)}</span>
                            </div>
                            {entry.palletStatus ? (
                                <div className="route-history-tags">
                                    <Chip label={palletStatusLabel(entry.palletStatus as PalletStatusDto)} size="small" />
                                </div>
                            ) : null}
                            {entry.details ? <p>{entry.details}</p> : null}
                            <dl>
                                <div><dt>{pl.pallets.history.department}</dt><dd>{departmentLabel(departmentsById, entry.departmentId)}</dd></div>
                                <div><dt>{pl.pallets.history.user}</dt><dd>{entry.username || (entry.userId ? String(entry.userId) : pl.common.dash)}</dd></div>
                            </dl>
                        </div>
                    </article>
                ))}
            </div>
            {sortedEntries.length > initialLimit ? (
                <Button variant="text" onClick={() => setExpanded((current) => !current)}>
                    {expanded ? pl.routeLogs.timeline.showLess : pl.routeLogs.timeline.showAll.replace("{count}", String(sortedEntries.length))}
                </Button>
            ) : null}
        </div>
    );
}

export default PalletHistoryTimeline;
