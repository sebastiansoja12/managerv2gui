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
} from "@mui/material";
import {AccountTree, ArrowBack, Code, DataObject, Refresh, SyncAlt} from "@mui/icons-material";
import {useNavigate, useParams} from "react-router-dom";
import ProcessLogService from "../../hooks/ProcessLogService";
import {ApiErrorResponse} from "../../api/ApiResult";
import pl from "../../i18n/translate";
import {CommunicationLogDto, ProcessLogDto} from "./dto/ProcessLogDto";
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
        <div className="processes-page">
            <div className="processes-shell">
                <div className="processes-header">
                    <div className="processes-title">
                        <span className="processes-title-icon"><AccountTree /></span>
                        <div>
                            <Typography variant="h4">{pl.processes.details.title}</Typography>
                            <Typography variant="body2" color="text.secondary">{processId}</Typography>
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
                    <div className="process-details-layout">
                        <main className="processes-panel">
                            <div className="process-summary-grid">
                                <div>
                                    <span>{pl.processes.details.fields.processId}</span>
                                    <strong>{processLog.processId}</strong>
                                </div>
                                <div>
                                    <span>{pl.processes.details.fields.user}</span>
                                    <strong>{userLabel(processLog)}</strong>
                                </div>
                                <div>
                                    <span>{pl.processes.details.fields.department}</span>
                                    <strong>{processLog.deviceInformation?.departmentCode || communications[0]?.departmentCode || pl.common.dash}</strong>
                                </div>
                                <div>
                                    <span>{pl.processes.details.fields.status}</span>
                                    <Chip className={`process-status process-status-${String(processLog.status || "IN_PROGRESS").toLowerCase()}`} label={statusLabel(processLog.status)} size="small" />
                                </div>
                                <div>
                                    <span>{pl.processes.details.fields.createdAt}</span>
                                    <strong>{formatDateTime(processLog.createdAt)}</strong>
                                </div>
                                <div>
                                    <span>{pl.processes.details.fields.modifiedAt}</span>
                                    <strong>{formatDateTime(processLog.modifiedAt)}</strong>
                                </div>
                            </div>

                            <div className="process-total-request">
                                <div>
                                    <Typography variant="h6">{pl.processes.details.totalRequestTitle}</Typography>
                                    <span>{pl.processes.details.totalRequestDescription}</span>
                                </div>
                                <Button startIcon={<DataObject />} variant="contained" onClick={() => setPayloadDialog({
                                    title: pl.processes.details.totalRequestTitle,
                                    payload: processLog.request,
                                })}>
                                    {pl.processes.actions.showTotalRequest}
                                </Button>

                                <div>
                                    <Typography variant="h6">{pl.processes.details.totalResponseTitle}</Typography>
                                    <span>{pl.processes.details.totalResponseDescription}</span>
                                </div>
                                <Button startIcon={<DataObject />} variant="contained" onClick={() => setPayloadDialog({
                                    title: pl.processes.details.totalResponseTitle,
                                    payload: processLog?.response,
                                })}>
                                    {pl.processes.actions.showTotalResponse}
                                </Button>
                            </div>

                            <section className="process-communications">
                                <div className="process-section-heading">
                                    <Typography variant="h6">{pl.processes.details.communicationTitle}</Typography>
                                    <span>{communications.length} {pl.processes.details.communicationCount}</span>
                                </div>

                                {communications.length ? communications.map((communication, index) => (
                                    <article className="process-communication-card" key={`${communication.id || index}-${communication.serviceType || ""}`}>
                                        <div className="process-communication-main">
                                            <span className="process-communication-icon"><SyncAlt fontSize="small" /></span>
                                            <div>
                                                <strong>{serviceLabel(communication)}</strong>
                                                <p>
                                                    {communication.processType || pl.common.dash}
                                                    {" · "}
                                                    {communication.serviceType || pl.common.dash}
                                                    {" · "}
                                                    {formatDateTime(communication.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <dl className="process-communication-meta">
                                            <div><dt>{pl.processes.details.fields.user}</dt><dd>{communication.createdBy ? `#${communication.createdBy}` : pl.common.dash}</dd></div>
                                            <div><dt>{pl.processes.details.fields.department}</dt><dd>{communication.departmentCode || pl.common.dash}</dd></div>
                                            <div><dt>{pl.processes.details.fields.device}</dt><dd>{communication.deviceId || processLog.deviceInformation?.deviceId || pl.common.dash}</dd></div>
                                        </dl>
                                        <div className="process-communication-actions">
                                            <Button startIcon={<Code />} variant="outlined" onClick={() => setPayloadDialog({
                                                title: pl.processes.actions.showRequest,
                                                payload: communication.request,
                                            })}>
                                                {pl.processes.actions.showRequest}
                                            </Button>
                                            <Button startIcon={<Code />} variant="outlined" onClick={() => setPayloadDialog({
                                                title: pl.processes.actions.showResponse,
                                                payload: communication.response,
                                            })}>
                                                {pl.processes.actions.showResponse}
                                            </Button>
                                        </div>
                                        {communication.faultDescription ? (
                                            <Alert severity="warning">{communication.faultDescription}</Alert>
                                        ) : null}
                                    </article>
                                )) : (
                                    <div className="processes-empty">{pl.processes.details.noCommunicationLogs}</div>
                                )}
                            </section>
                        </main>
                    </div>
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
