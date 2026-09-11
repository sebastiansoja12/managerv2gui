import React, {useEffect, useState} from "react";
import {Button, CircularProgress} from "components/ui";
import {FactCheckOutlined} from "components/ui/icons";
import {getBackendErrorMessage} from "../../api/errorMessage";
import AuditLogService from "../../hooks/AuditLogService";
import pl from "../../i18n/translate";
import {
    auditLogActionLabel,
    auditLogActorLabel,
    auditLogFieldLabel,
    auditLogValueLabel,
    formatAuditLogDate,
} from "./auditLogLabels";
import {AuditLogEntryDto, AuditLogResourceType} from "./model/AuditLogEntry";
import "./styles/audit-log.css";

type AuditLogTimelineProps = {
    resourceType: AuditLogResourceType;
    resourceId: string;
    reloadKey?: number;
    pageSize?: number;
    departmentLabel?: (departmentId: number) => string;
    inset?: boolean;
};

function AuditLogTimeline({
    resourceType,
    resourceId,
    reloadKey = 0,
    pageSize = 20,
    departmentLabel,
    inset = false,
}: AuditLogTimelineProps) {
    const insetClassName = inset ? " audit-log-inset" : "";
    const [entries, setEntries] = useState<AuditLogEntryDto[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryKey, setRetryKey] = useState(0);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        setEntries([]);
        setPage(0);
        AuditLogService.findByResource(resourceType, resourceId, 0, pageSize)
            .then((response) => {
                if (active) {
                    setEntries(response.data.content);
                    setTotalElements(response.data.totalElements);
                }
            })
            .catch((loadError) => {
                if (active) {
                    setError(getBackendErrorMessage(loadError, pl.auditLog.loadError));
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });
        return () => {
            active = false;
        };
    }, [resourceType, resourceId, pageSize, reloadKey, retryKey]);

    const loadMore = async () => {
        const nextPage = page + 1;
        setLoadingMore(true);
        try {
            const response = await AuditLogService.findByResource(resourceType, resourceId, nextPage, pageSize);
            setEntries((current) => [...current, ...response.data.content]);
            setTotalElements(response.data.totalElements);
            setPage(nextPage);
        } catch (loadError) {
            setError(getBackendErrorMessage(loadError, pl.auditLog.loadError));
        } finally {
            setLoadingMore(false);
        }
    };

    if (loading) {
        return (
            <div className={`audit-log-state${insetClassName}`}>
                <CircularProgress size={20} />
                <span>{pl.auditLog.loading}</span>
            </div>
        );
    }

    if (error && !entries.length) {
        return (
            <div className={`audit-log-state${insetClassName}`} role="alert">
                <span>{error}</span>
                <Button size="small" variant="text" onClick={() => setRetryKey((current) => current + 1)}>
                    {pl.auditLog.retry}
                </Button>
            </div>
        );
    }

    if (!entries.length) {
        return (
            <div className={`audit-log-state${insetClassName}`}>
                <FactCheckOutlined fontSize="small" />
                <span>{pl.auditLog.empty}</span>
            </div>
        );
    }

    const metadata = (entry: AuditLogEntryDto) => [
        auditLogActorLabel(entry),
        departmentLabel && entry.departmentId !== null ? departmentLabel(entry.departmentId) : null,
    ].filter((value): value is string => Boolean(value));

    return (
        <div className={`audit-log${insetClassName}`}>
            <ol className="audit-log-list">
                {entries.map((entry) => (
                    <li className="audit-log-entry" key={entry.id}>
                        <span aria-hidden="true" className="audit-log-marker" />
                        <div className="audit-log-content">
                            <div className="audit-log-heading">
                                <strong>{auditLogActionLabel(entry.resourceType, entry.action)}</strong>
                                <time dateTime={entry.occurredAt}>{formatAuditLogDate(entry.occurredAt)}</time>
                            </div>
                            <div className="audit-log-meta">
                                {metadata(entry).map((value, index) => (
                                    <span key={`${value}-${index}`}>{value}</span>
                                ))}
                            </div>
                            {entry.changes.length ? (
                                <dl className="audit-log-changes" aria-label={pl.auditLog.changes}>
                                    {entry.changes.map((change, index) => {
                                        const previousValue = auditLogValueLabel(entry.resourceType, change.field, change.previousValue);
                                        const currentValue = auditLogValueLabel(entry.resourceType, change.field, change.currentValue);
                                        return (
                                            <div className="audit-log-change" key={`${change.field}-${index}`}>
                                                <dt>{auditLogFieldLabel(change.field)}</dt>
                                                <dd>
                                                    {previousValue !== null ? (
                                                        <>
                                                            <del aria-label={pl.auditLog.previousValue}>{previousValue}</del>
                                                            <span aria-hidden="true" className="audit-log-arrow">→</span>
                                                        </>
                                                    ) : null}
                                                    <ins aria-label={pl.auditLog.currentValue}>{currentValue ?? pl.auditLog.removed}</ins>
                                                </dd>
                                            </div>
                                        );
                                    })}
                                </dl>
                            ) : null}
                        </div>
                    </li>
                ))}
            </ol>
            {error ? <div className={`audit-log-state${insetClassName}`} role="alert">{error}</div> : null}
            {entries.length < totalElements ? (
                <Button className="audit-log-more" disabled={loadingMore} size="small" variant="text" onClick={loadMore}>
                    {loadingMore
                        ? pl.auditLog.loading
                        : pl.auditLog.loadMore.replace("{count}", String(totalElements - entries.length))}
                </Button>
            ) : null}
        </div>
    );
}

export default AuditLogTimeline;
