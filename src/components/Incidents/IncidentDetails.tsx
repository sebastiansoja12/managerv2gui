import React, {useCallback, useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {
    Alert,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
    Typography,
} from "components/ui";
import {Refresh, ReportProblemOutlined} from "components/ui/icons";
import {ApiErrorResponse} from "../../api/ApiResult";
import IncidentService from "../../hooks/IncidentService";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "../AppShell/types";
import IncidentResolveDialog from "./IncidentResolveDialog";
import {
    formatIncidentAge,
    formatIncidentDateTime,
    incidentErrorMessage,
    incidentShipmentTab,
    severityColor,
    statusColor,
} from "./incidentPresentation";
import {IncidentDto, IncidentResolution} from "./model/Incident";
import "../Pallets/styles/pallets.css";
import "./styles/incidents.css";

type IncidentDetailsProps = {
    onOpenTab?: (tab: AppTabDefinition) => void;
};

type IncidentAction = "assign" | "comment" | "resolve" | "reopen";

function IncidentDetails({onOpenTab}: IncidentDetailsProps) {
    const translations = pl.incidents;
    const {incidentId = ""} = useParams<{incidentId: string}>();
    const [incident, setIncident] = useState<IncidentDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [runningAction, setRunningAction] = useState<IncidentAction | null>(null);
    const [comment, setComment] = useState("");
    const [resolveOpen, setResolveOpen] = useState(false);
    const [reopenOpen, setReopenOpen] = useState(false);
    const [reopenReason, setReopenReason] = useState("");
    const [dialogError, setDialogError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            setIncident((await IncidentService.get(incidentId)).data);
        } catch (error) {
            setIncident(null);
            setLoadError((error as ApiErrorResponse | undefined)?.status === 404
                ? translations.details.notFound
                : translations.details.loadError);
        } finally {
            setLoading(false);
        }
    }, [incidentId, translations.details.loadError, translations.details.notFound]);

    useEffect(() => {
        load();
    }, [load]);

    const run = async (action: IncidentAction, request: () => Promise<unknown>, inDialog = false) => {
        setRunningAction(action);
        setActionError(null);
        setDialogError(null);
        try {
            await request();
            setIncident((await IncidentService.get(incidentId)).data);
            return true;
        } catch (error) {
            const message = incidentErrorMessage(error, translations.list.actionError);
            if (inDialog) {
                setDialogError(message);
            } else {
                setActionError(message);
            }
            return false;
        } finally {
            setRunningAction(null);
        }
    };

    const addComment = async () => {
        if (!comment.trim()) {
            setActionError(translations.details.commentRequired);
            return;
        }
        if (await run("comment", () => IncidentService.comment(incidentId, comment.trim()))) {
            setComment("");
        }
    };

    const resolve = async (resolution: IncidentResolution, note: string | null) => {
        if (await run("resolve", () => IncidentService.resolve(incidentId, {resolution, note}), true)) {
            setResolveOpen(false);
        }
    };

    const reopen = async () => {
        if (!reopenReason.trim()) {
            setDialogError(translations.details.reopenDialog.reasonRequired);
            return;
        }
        if (await run("reopen", () => IncidentService.reopen(incidentId, reopenReason.trim()), true)) {
            setReopenOpen(false);
        }
    };

    if (loading && !incident) {
        return <main className="pallet-page incident-details-page"><p className="pallet-empty">{translations.details.loading}</p></main>;
    }

    if (!incident) {
        return (
            <main className="pallet-page incident-details-page">
                <Alert severity="error" action={<Button variant="outlined" onClick={load}>{pl.common.refresh}</Button>}>
                    {loadError || translations.details.loadError}
                </Alert>
            </main>
        );
    }

    const resolved = incident.status === "RESOLVED";
    const busy = runningAction !== null;
    const trackingNumber = incident.trackingNumber || incident.shipmentId.value;
    const entries = [...incident.entries].reverse();

    return (
        <main className="pallet-page incident-details-page">
            <div className="pallet-shell">
                <section className="pallet-header">
                    <div className="pallet-title">
                        <span className="pallet-title-icon"><ReportProblemOutlined /></span>
                        <div>
                            <Typography variant="h4">{translations.details.title.replace("{incidentId}", String(incident.incidentId.value))}</Typography>
                            <div className="incident-details-badges">
                                <Chip color={statusColor(incident.status)} label={translations.statuses[incident.status]} size="small" />
                                <Chip color={severityColor(incident.severity)} label={translations.severities[incident.severity]} size="small" />
                                <Chip label={translations.categories[incident.category]} size="small" variant="outlined" />
                            </div>
                        </div>
                    </div>
                    <div className="pallet-actions">
                        {resolved ? (
                            <Button variant="outlined" disabled={busy} onClick={() => {
                                setDialogError(null);
                                setReopenReason("");
                                setReopenOpen(true);
                            }}>
                                {translations.details.reopen}
                            </Button>
                        ) : (
                            <>
                                <Button variant="outlined" disabled={busy}
                                        startIcon={runningAction === "assign" ? <CircularProgress size={16} /> : undefined}
                                        onClick={() => run("assign", () => IncidentService.assignToMe(incidentId))}>
                                    {translations.list.assign}
                                </Button>
                                <Button disabled={busy} onClick={() => {
                                    setDialogError(null);
                                    setResolveOpen(true);
                                }}>
                                    {translations.list.resolve}
                                </Button>
                            </>
                        )}
                        <IconButton aria-label={pl.common.refresh} title={pl.common.refresh} disabled={busy} onClick={load}>
                            <Refresh fontSize="small" />
                        </IconButton>
                    </div>
                </section>

                {actionError ? <Alert severity="error" onClose={() => setActionError(null)}>{actionError}</Alert> : null}

                <div className="pallet-details-grid">
                    <section className="pallet-panel">
                        <div className="pallet-panel-header">
                            <h2 className="pallet-section-title">{translations.details.summary}</h2>
                            <Button variant="outlined" size="small" onClick={() => onOpenTab?.(incidentShipmentTab(incident))}>
                                {translations.details.openShipment}
                            </Button>
                        </div>
                        <p className="incident-details-description">{incident.description || translations.details.noDescription}</p>
                        <dl className="pallet-definition-list">
                            <div><dt>{translations.columns.shipment}</dt><dd className="pallet-code">{trackingNumber}</dd></div>
                            <div><dt>{translations.columns.department}</dt><dd>{incident.departmentCode || pl.common.dash}</dd></div>
                            <div><dt>{translations.columns.reporter}</dt><dd>{incident.reporter.username || pl.common.dash}</dd></div>
                            <div><dt>{translations.columns.reportedAt}</dt><dd>{formatIncidentDateTime(incident.reportedAt)}</dd></div>
                            <div><dt>{translations.columns.age}</dt><dd>{formatIncidentAge(incident, Date.now())}</dd></div>
                            <div><dt>{translations.columns.assignee}</dt><dd>{incident.assignee?.username || translations.list.unassigned}</dd></div>
                            <div><dt>{translations.details.updatedAt}</dt><dd>{formatIncidentDateTime(incident.updatedAt)}</dd></div>
                            {incident.resolution ? (
                                <div><dt>{translations.details.resolution}</dt><dd>{translations.resolutions[incident.resolution]}</dd></div>
                            ) : null}
                            {incident.resolvedAt ? (
                                <div><dt>{translations.details.resolvedAt}</dt><dd>{formatIncidentDateTime(incident.resolvedAt)}</dd></div>
                            ) : null}
                        </dl>
                    </section>

                    <section className="pallet-panel">
                        <h2 className="pallet-section-title">{translations.details.timeline}</h2>
                        <div className="incident-comment-form">
                            <TextField fullWidth multiline rows={3} label={translations.details.commentLabel}
                                       placeholder={translations.details.commentPlaceholder} value={comment}
                                       inputProps={{maxLength: 2000}}
                                       onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setComment(event.target.value)} />
                            <Button disabled={busy} startIcon={runningAction === "comment" ? <CircularProgress size={16} /> : undefined}
                                    onClick={addComment}>
                                {translations.details.commentSubmit}
                            </Button>
                        </div>
                        {entries.length ? (
                            <ol className="incident-timeline">
                                {entries.map((entry, index) => (
                                    <li className={`incident-timeline-entry incident-timeline-${entry.type.toLowerCase()}`} key={`${entry.occurredAt}-${index}`}>
                                        <div className="incident-timeline-heading">
                                            <strong>{entry.actor.username || pl.common.dash}</strong>
                                            <span>{translations.details.entryTypes[entry.type]}</span>
                                            <time dateTime={entry.occurredAt}>{formatIncidentDateTime(entry.occurredAt)}</time>
                                        </div>
                                        {entry.text ? <p>{entry.text}</p> : null}
                                    </li>
                                ))}
                            </ol>
                        ) : <p className="pallet-empty">{translations.details.noEntries}</p>}
                    </section>
                </div>
            </div>

            <IncidentResolveDialog
                incident={resolveOpen ? incident : null}
                resolving={runningAction === "resolve"}
                error={dialogError}
                onClose={() => setResolveOpen(false)}
                onResolve={resolve}
            />

            <Dialog open={reopenOpen} onClose={() => runningAction !== "reopen" && setReopenOpen(false)} fullWidth>
                <DialogTitle>{translations.details.reopenDialog.title.replace("{incidentId}", String(incident.incidentId.value))}</DialogTitle>
                <DialogContent>
                    {dialogError ? <Alert severity="error">{dialogError}</Alert> : null}
                    <TextField fullWidth multiline rows={3} required label={translations.details.reopenDialog.reason}
                               value={reopenReason} inputProps={{maxLength: 2000}}
                               onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setReopenReason(event.target.value)} />
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" disabled={runningAction === "reopen"} onClick={() => setReopenOpen(false)}>{pl.common.cancel}</Button>
                    <Button disabled={runningAction === "reopen"} onClick={reopen}>{translations.details.reopenDialog.submit}</Button>
                </DialogActions>
            </Dialog>
        </main>
    );
}

export default IncidentDetails;
