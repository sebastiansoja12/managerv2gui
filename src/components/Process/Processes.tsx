import React, {useEffect, useMemo, useState} from "react";
import {Alert, Button, CircularProgress, Chip, IconButton, TablePagination, Tooltip, Typography} from "components/ui";
import {AccountTree, MoreVert, Refresh, SyncAlt, Visibility} from "components/ui/icons";
import {useNavigate} from "react-router-dom";
import ProcessLogService from "../../hooks/ProcessLogService";
import {ApiErrorResponse} from "../../api/ApiResult";
import pl from "../../i18n/translate";
import {CommunicationLogDto, ProcessLogDto} from "./dto/ProcessLogDto";
import {valueObjectValue} from "../../utils/valueObject";
import "./styles/processes.css";

const formatDateTime = (date?: string | null) => {
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

const primaryCommunication = (processLog: ProcessLogDto): CommunicationLogDto | null =>
    processLog.communicationLogs?.[0] || null;

const serviceName = (processLog: ProcessLogDto) => {
    const communication = primaryCommunication(processLog);
    if (!communication) {
        return processLog.deviceInformation?.deviceType || pl.common.dash;
    }

    const source = communication.sourceService || pl.common.dash;
    const target = communication.targetService || pl.common.dash;
    return `${source} → ${target}`;
};

const userLabel = (processLog: ProcessLogDto) => {
    const communication = primaryCommunication(processLog);
    const userId = communication?.createdBy || communication?.updatedBy || processLog.deviceInformation?.userId;
    return userId ? `#${userId}` : pl.common.dash;
};

const departmentLabel = (processLog: ProcessLogDto) =>
    valueObjectValue(primaryCommunication(processLog)?.departmentCode) || valueObjectValue(processLog.deviceInformation?.departmentCode) || pl.common.dash;

const statusLabel = (status?: string | null) =>
    status ? pl.processes.status[status as keyof typeof pl.processes.status] || status : pl.processes.status.IN_PROGRESS;

const Processes: React.FC = () => {
    const navigate = useNavigate();
    const [processLogs, setProcessLogs] = useState<ProcessLogDto[]>([]);
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(20);
    const [totalElements, setTotalElements] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadProcesses = async (nextPage = page, nextRowsPerPage = rowsPerPage) => {
        setLoading(true);
        setError(null);
        try {
            const response = await ProcessLogService.getAll(nextPage, nextRowsPerPage);
            setProcessLogs(response.data.content || []);
            setTotalElements(response.data.totalElements || 0);
            setPage(response.data.number ?? nextPage);
            setRowsPerPage(response.data.size || nextRowsPerPage);
        } catch (loadError) {
            const apiError = loadError as ApiErrorResponse;
            setError(apiError.message || pl.processes.messages.loadError);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProcesses(0, rowsPerPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const sortedLogs = useMemo(() => [...processLogs].sort((left, right) => {
        const leftTime = new Date(left.createdAt || "").getTime() || 0;
        const rightTime = new Date(right.createdAt || "").getTime() || 0;
        return rightTime - leftTime;
    }), [processLogs]);

    return (
        <div className="processes-page">
            <div className="processes-shell">
                <div className="processes-header">
                    <div className="processes-title">
                        <span aria-hidden="true" className="processes-title-icon"><AccountTree /></span>
                        <div>
                            <Typography variant="h4">{pl.processes.page.title}</Typography>
                            <p className="processes-subtitle">{pl.processes.page.subtitle}</p>
                        </div>
                    </div>
                </div>

                <section className="processes-panel">
                    <div className="processes-panel-header">
                        <div>
                            <Typography variant="h6">{pl.processes.table.title}</Typography>
                            <span>{pl.processes.table.scope}</span>
                        </div>
                        <div className="processes-panel-actions">
                            {!loading ? <span className="processes-count">{pl.departments.filters.results.replace("{count}", String(totalElements))}</span> : null}
                            <Button startIcon={<Refresh />} variant="outlined" onClick={() => loadProcesses()} disabled={loading}>
                                {pl.common.refresh}
                            </Button>
                        </div>
                    </div>

                    {error ? <Alert severity="error">{error}</Alert> : null}

                    {loading ? (
                        <div className="processes-empty">
                            <CircularProgress size={26} />
                            <span>{pl.processes.messages.loading}</span>
                        </div>
                    ) : (
                        <div className="processes-table-wrap">
                            <table className="processes-table">
                                <colgroup>
                                    <col className="processes-col-id" />
                                    <col className="processes-col-service" />
                                    <col className="processes-col-user" />
                                    <col className="processes-col-department" />
                                    <col className="processes-col-date" />
                                    <col className="processes-col-status" />
                                    <col className="processes-col-actions" />
                                </colgroup>
                                <thead>
                                <tr>
                                    <th>{pl.processes.table.columns.processId}</th>
                                    <th>{pl.processes.table.columns.microservice}</th>
                                    <th>{pl.processes.table.columns.user}</th>
                                    <th>{pl.processes.table.columns.department}</th>
                                    <th>{pl.processes.table.columns.createdAt}</th>
                                    <th>{pl.processes.table.columns.status}</th>
                                    <th aria-label={pl.processes.table.columns.actions} />
                                </tr>
                                </thead>
                                <tbody>
                                {sortedLogs.length ? sortedLogs.map((processLog) => (
                                    <tr key={processLog.processId} onClick={() => navigate(`/processes/${processLog.processId}`)}>
                                        <td>
                                            <strong title={processLog.processId}>{processLog.processId}</strong>
                                        </td>
                                        <td>
                                            <span className="processes-service" title={serviceName(processLog)}>
                                                <SyncAlt fontSize="small" />
                                                <span>{serviceName(processLog)}</span>
                                            </span>
                                        </td>
                                        <td>{userLabel(processLog)}</td>
                                        <td>{departmentLabel(processLog)}</td>
                                        <td>{formatDateTime(processLog.createdAt)}</td>
                                        <td>
                                            <Chip className={`process-status process-status-${String(processLog.status || "IN_PROGRESS").toLowerCase()}`} label={statusLabel(processLog.status)} size="small" />
                                        </td>
                                        <td className="processes-actions-cell">
                                            <Tooltip title={pl.processes.actions.openDetails}>
                                                <IconButton aria-label={pl.processes.actions.openDetails} size="small" onClick={(event) => {
                                                    event.stopPropagation();
                                                    navigate(`/processes/${processLog.processId}`);
                                                }}>
                                                    <Visibility fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <IconButton size="small" onClick={(event) => event.stopPropagation()}>
                                                <MoreVert fontSize="small" />
                                            </IconButton>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7}>
                                            <div className="processes-empty">{pl.processes.table.empty}</div>
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && sortedLogs.length ? (
                        <TablePagination
                            className="processes-pagination"
                            component="div"
                            count={totalElements}
                            page={page}
                            rowsPerPage={rowsPerPage}
                            rowsPerPageOptions={[10, 20, 50]}
                            labelRowsPerPage={pl.processes.table.rowsPerPage}
                            labelDisplayedRows={({from, to, count}) =>
                                `${from}-${to} ${pl.processes.table.of} ${count}`}
                            onPageChange={(_, nextPage) => loadProcesses(nextPage, rowsPerPage)}
                            onRowsPerPageChange={(event) => {
                                const nextRowsPerPage = Number(event.target.value);
                                loadProcesses(0, nextRowsPerPage);
                            }}
                        />
                    ) : null}
                </section>
            </div>
        </div>
    );
};

export default Processes;
