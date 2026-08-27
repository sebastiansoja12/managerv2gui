import React, {useEffect, useMemo, useState} from "react";
import {
    Alert,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from "components/ui";
import {AccountTree, ArrowBack, Code, DataObject, Refresh, SyncAlt} from "components/ui/icons";
import {useNavigate, useParams} from "react-router-dom";
import ProcessLogService from "../../hooks/ProcessLogService";
import {ApiErrorResponse} from "../../api/ApiResult";
import pl from "../../i18n/translate";
import {CommunicationLogDto, ProcessLogDto} from "./dto/ProcessLogDto";
import {valueObjectValue} from "../../utils/valueObject";
import "./styles/processes.css";

type PayloadDialog = {
    title: string;
    payload?: string | null;
};

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

const formatPayload = (payload?: string | null) => {
    if (!payload) {
        return pl.processes.details.noPayload;
    }

    try {
        return JSON.stringify(JSON.parse(payload), null, 2);
    } catch {
        return payload;
    }
};

const statusLabel = (status?: string | null) =>
    status ? pl.processes.status[status as keyof typeof pl.processes.status] || status : pl.processes.status.IN_PROGRESS;

const userLabel = (processLog?: ProcessLogDto | null) => {
    const firstCommunication = processLog?.communicationLogs?.[0];
    const userId = firstCommunication?.createdBy || firstCommunication?.updatedBy || processLog?.deviceInformation?.userId;
    return userId ? `#${userId}` : pl.common.dash;
};

const serviceLabel = (communication: CommunicationLogDto) => {
    const source = communication.sourceService || pl.common.dash;
    const target = communication.targetService || pl.common.dash;
    return `${source} → ${target}`;
};

const processDepartmentLabel = (processLog: ProcessLogDto, communications: CommunicationLogDto[]) =>
    valueObjectValue(processLog.deviceInformation?.departmentCode) || valueObjectValue(communications[0]?.departmentCode) || pl.common.dash;

const ProcessDetails: React.FC = () => {
    const navigate = useNavigate();
    const {processId = ""} = useParams();
    const [processLog, setProcessLog] = useState<ProcessLogDto | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [payloadDialog, setPayloadDialog] = useState<PayloadDialog | null>(null);

    const loadProcess = async () => {
        if (!processId) {
            setError(pl.processes.messages.invalidProcessId);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await ProcessLogService.get(processId);
            setProcessLog(response.data);
        } catch (loadError) {
            const apiError = loadError as ApiErrorResponse;
            setError(apiError.message || pl.processes.messages.loadDetailsError);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProcess();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [processId]);

    const communications = useMemo(() => processLog?.communicationLogs || [], [processLog]);

    return (
        <div className="processes-page process-details-page">
            <div className="processes-shell">
                <div className="processes-header">
                    <div className="processes-title">
                        <span className="processes-title-icon"><AccountTree /></span>
                        <div>
                            <Typography variant="h4">{pl.processes.details.title}</Typography>
                            <p className="process-details-subtitle">{processId}</p>
                        </div>
                    </div>
                    <div className="processes-actions">
                        <Button startIcon={<ArrowBack />} variant="outlined" onClick={() => navigate("/processes")}>
                            {pl.processes.actions.backToList}
                        </Button>
                        <Button startIcon={<Refresh />} variant="outlined" disabled={loading} onClick={loadProcess}>
                            {pl.common.refresh}
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <section className="processes-panel processes-empty">
                        <CircularProgress size={26} />
                        <span>{pl.processes.messages.loading}</span>
                    </section>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : processLog ? (
                    <section className="process-details-layout">
                        <div className="process-details-main">
                            <div className="process-details-panel">
                                <dl className="process-details-summary">
                                    <div><dt>{pl.processes.details.fields.processId}</dt><dd className="process-details-mono">{processLog.processId}</dd></div>
                                    <div><dt>{pl.processes.details.fields.user}</dt><dd>{userLabel(processLog)}</dd></div>
                                    <div><dt>{pl.processes.details.fields.department}</dt><dd>{processDepartmentLabel(processLog, communications)}</dd></div>
                                    <div>
                                        <dt>{pl.processes.details.fields.status}</dt>
                                        <dd><Chip className={`process-status process-status-${String(processLog.status || "IN_PROGRESS").toLowerCase()}`} label={statusLabel(processLog.status)} size="small" /></dd>
                                    </div>
                                    <div><dt>{pl.processes.details.fields.createdAt}</dt><dd>{formatDateTime(processLog.createdAt)}</dd></div>
                                    <div><dt>{pl.processes.details.fields.modifiedAt}</dt><dd>{formatDateTime(processLog.modifiedAt)}</dd></div>
                                </dl>
                            </div>

                            <div className="process-details-panel">
                                <div className="process-details-panel-header">
                                    <Typography variant="h6">{pl.processes.details.communicationTitle}</Typography>
                                    <span className="process-details-count">{communications.length} {pl.processes.details.communicationCount}</span>
                                </div>

                                {communications.length ? (
                                    <ol className="process-communication-list">
                                        {communications.map((communication, index) => {
                                            const department = valueObjectValue(communication.departmentCode);
                                            const device = communication.deviceId || processLog.deviceInformation?.deviceId;
                                            const subtitle = [communication.processType, communication.serviceType, communication.createdAt ? formatDateTime(communication.createdAt) : null]
                                                .filter(Boolean)
                                                .join(" · ");

                                            return (
                                                <li className="process-communication-row" key={`${communication.id || index}-${communication.serviceType || ""}`}>
                                                    <span aria-hidden="true" className="process-communication-icon"><SyncAlt fontSize="small" /></span>
                                                    <div className="process-communication-body">
                                                        <strong>{serviceLabel(communication)}</strong>
                                                        {subtitle ? <p>{subtitle}</p> : null}
                                                        <dl className="process-communication-meta">
                                                            {communication.createdBy ? (
                                                                <div><dt>{pl.processes.details.fields.user}</dt><dd>#{communication.createdBy}</dd></div>
                                                            ) : null}
                                                            {department ? (
                                                                <div><dt>{pl.processes.details.fields.department}</dt><dd>{department}</dd></div>
                                                            ) : null}
                                                            {device ? (
                                                                <div><dt>{pl.processes.details.fields.device}</dt><dd>{device}</dd></div>
                                                            ) : null}
                                                        </dl>
                                                        {communication.faultDescription ? (
                                                            <Alert severity="warning">{communication.faultDescription}</Alert>
                                                        ) : null}
                                                    </div>
                                                    <div className="process-communication-actions">
                                                        <Button startIcon={<Code fontSize="small" />} variant="outlined" onClick={() => setPayloadDialog({
                                                            title: `${serviceLabel(communication)} · ${pl.processes.actions.showRequest}`,
                                                            payload: communication.request,
                                                        })}>
                                                            {pl.processes.actions.showRequest}
                                                        </Button>
                                                        <Button startIcon={<Code fontSize="small" />} variant="outlined" onClick={() => setPayloadDialog({
                                                            title: `${serviceLabel(communication)} · ${pl.processes.actions.showResponse}`,
                                                            payload: communication.response,
                                                        })}>
                                                            {pl.processes.actions.showResponse}
                                                        </Button>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                ) : (
                                    <div className="processes-empty">{pl.processes.details.noCommunicationLogs}</div>
                                )}
                            </div>
                        </div>

                        <aside className="process-details-panel process-details-side">
                            <div className="process-payload-item">
                                <div>
                                    <strong>{pl.processes.details.totalRequestTitle}</strong>
                                    <span>{pl.processes.details.totalRequestDescription}</span>
                                </div>
                                <Button startIcon={<DataObject fontSize="small" />} variant="outlined" onClick={() => setPayloadDialog({
                                    title: pl.processes.details.totalRequestTitle,
                                    payload: processLog.request,
                                })}>
                                    {pl.processes.actions.showTotalRequest}
                                </Button>
                            </div>
                            <div className="process-payload-item">
                                <div>
                                    <strong>{pl.processes.details.totalResponseTitle}</strong>
                                    <span>{pl.processes.details.totalResponseDescription}</span>
                                </div>
                                <Button startIcon={<DataObject fontSize="small" />} variant="outlined" onClick={() => setPayloadDialog({
                                    title: pl.processes.details.totalResponseTitle,
                                    payload: processLog.response,
                                })}>
                                    {pl.processes.actions.showTotalResponse}
                                </Button>
                            </div>
                        </aside>
                    </section>
                ) : null}
            </div>

            <Dialog open={Boolean(payloadDialog)} onClose={() => setPayloadDialog(null)} maxWidth="md" fullWidth>
                <DialogTitle>{payloadDialog?.title}</DialogTitle>
                <DialogContent>
                    <pre className="process-payload">{formatPayload(payloadDialog?.payload)}</pre>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPayloadDialog(null)}>{pl.common.close}</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default ProcessDetails;
