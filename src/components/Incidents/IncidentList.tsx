import React, {useCallback, useEffect, useState} from "react";
import {Alert, Button, Checkbox, Chip, FormControlLabel, IconButton, MenuItem, TextField, Typography} from "components/ui";
import {Refresh, ReportProblemOutlined} from "components/ui/icons";
import IncidentService from "../../hooks/IncidentService";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "../AppShell/types";
import IncidentResolveDialog from "./IncidentResolveDialog";
import {
    formatIncidentAge,
    formatIncidentDateTime,
    incidentDetailsTab,
    incidentErrorMessage,
    incidentShipmentTab,
    severityColor,
    statusColor,
} from "./incidentPresentation";
import {
    INCIDENT_CATEGORIES,
    INCIDENT_SEVERITIES,
    INCIDENT_STATUSES,
    IncidentCategory,
    IncidentDto,
    IncidentFilters,
    IncidentResolution,
    IncidentSeverity,
    IncidentStatisticsDto,
    IncidentStatus,
} from "./model/Incident";
import "../Pallets/styles/pallets.css";
import "./styles/incidents.css";

type IncidentListProps = {
    onOpenTab?: (tab: AppTabDefinition) => void;
};

const PAGE_SIZE = 20;

const INITIAL_FILTERS: IncidentFilters = {status: "", severity: "", category: "", assignedToMe: false};

function IncidentList({onOpenTab}: IncidentListProps) {
    const translations = pl.incidents;
    const [incidents, setIncidents] = useState<IncidentDto[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [statistics, setStatistics] = useState<IncidentStatisticsDto | null>(null);
    const [filters, setFilters] = useState<IncidentFilters>(INITIAL_FILTERS);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyIncidentId, setBusyIncidentId] = useState<string | null>(null);
    const [incidentToResolve, setIncidentToResolve] = useState<IncidentDto | null>(null);
    const [resolveError, setResolveError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [incidentPage, incidentStatistics] = await Promise.all([
                IncidentService.find(filters, page, PAGE_SIZE),
                IncidentService.statistics(),
            ]);
            setIncidents(incidentPage.data.incidents);
            setTotalElements(incidentPage.data.totalElements);
            setStatistics(incidentStatistics.data);
        } catch {
            setIncidents([]);
            setTotalElements(0);
            setError(translations.list.loadError);
        } finally {
            setLoading(false);
        }
    }, [filters, page, translations.list.loadError]);

    useEffect(() => {
        load();
    }, [load]);

    const changeFilter = <K extends keyof IncidentFilters>(key: K, value: IncidentFilters[K]) => {
        setPage(0);
        setFilters((current) => ({...current, [key]: value}));
    };

    const openShipment = (incident: IncidentDto) => onOpenTab?.(incidentShipmentTab(incident));
    const openIncident = (incident: IncidentDto) => onOpenTab?.(incidentDetailsTab(String(incident.incidentId.value)));

    const assignToMe = async (incident: IncidentDto) => {
        const incidentId = String(incident.incidentId.value);
        setBusyIncidentId(incidentId);
        setError(null);
        try {
            await IncidentService.assignToMe(incidentId);
            await load();
        } catch (assignError) {
            setError(incidentErrorMessage(assignError, translations.list.actionError));
        } finally {
            setBusyIncidentId(null);
        }
    };

    const resolve = async (resolution: IncidentResolution, note: string | null) => {
        if (!incidentToResolve) {
            return;
        }
        const incidentId = String(incidentToResolve.incidentId.value);
        setBusyIncidentId(incidentId);
        setResolveError(null);
        try {
            await IncidentService.resolve(incidentId, {resolution, note});
            setIncidentToResolve(null);
            await load();
        } catch (resolveFailure) {
            setResolveError(incidentErrorMessage(resolveFailure, translations.list.actionError));
        } finally {
            setBusyIncidentId(null);
        }
    };

    const lastPage = Math.max(0, Math.ceil(totalElements / PAGE_SIZE) - 1);
    const now = Date.now();
    const columns = [
        translations.columns.incident,
        translations.columns.shipment,
        translations.columns.category,
        translations.columns.severity,
        translations.columns.status,
        translations.columns.department,
        translations.columns.reporter,
        translations.columns.reportedAt,
        translations.columns.age,
        translations.columns.assignee,
        translations.columns.actions,
    ];
    const filtersActive = Boolean(filters.status || filters.severity || filters.category || filters.assignedToMe);

    return (
        <main className="pallet-page incidents-page">
            <div className="pallet-shell pallet-shell-wide">
                <section className="pallet-header">
                    <div className="pallet-title">
                        <span className="pallet-title-icon"><ReportProblemOutlined /></span>
                        <div>
                            <Typography variant="h4">{translations.list.title}</Typography>
                            <p>{translations.list.subtitle}</p>
                        </div>
                    </div>
                    <div className="pallet-actions">
                        <IconButton aria-label={pl.common.refresh} title={pl.common.refresh} onClick={load}><Refresh fontSize="small" /></IconButton>
                    </div>
                </section>

                {statistics ? (
                    <section className="pallet-summary incidents-summary">
                        <div className="pallet-summary-item"><span>{translations.statistics.open}</span><strong>{statistics.open}</strong></div>
                        <div className="pallet-summary-item incidents-summary-critical"><span>{translations.statistics.critical}</span><strong>{statistics.critical}</strong></div>
                        <div className="pallet-summary-item"><span>{translations.statistics.overdue}</span><strong>{statistics.overdue}</strong></div>
                        <div className="pallet-summary-item"><span>{translations.statistics.resolvedToday}</span><strong>{statistics.resolvedToday}</strong></div>
                    </section>
                ) : null}

                {error ? <Alert severity="error">{error}</Alert> : null}

                <section className="pallet-panel">
                    <div className="pallet-filters">
                        <TextField select label={translations.columns.status} size="small" value={filters.status}
                                   onChange={(event: React.ChangeEvent<HTMLSelectElement>) => changeFilter("status", event.target.value as IncidentStatus | "")}>
                            <MenuItem value="">{pl.common.all}</MenuItem>
                            {INCIDENT_STATUSES.map((status) => <MenuItem key={status} value={status}>{translations.statuses[status]}</MenuItem>)}
                        </TextField>
                        <TextField select label={translations.columns.severity} size="small" value={filters.severity}
                                   onChange={(event: React.ChangeEvent<HTMLSelectElement>) => changeFilter("severity", event.target.value as IncidentSeverity | "")}>
                            <MenuItem value="">{pl.common.all}</MenuItem>
                            {INCIDENT_SEVERITIES.map((severity) => <MenuItem key={severity} value={severity}>{translations.severities[severity]}</MenuItem>)}
                        </TextField>
                        <TextField select label={translations.columns.category} size="small" value={filters.category}
                                   onChange={(event: React.ChangeEvent<HTMLSelectElement>) => changeFilter("category", event.target.value as IncidentCategory | "")}>
                            <MenuItem value="">{pl.common.all}</MenuItem>
                            {INCIDENT_CATEGORIES.map((category) => <MenuItem key={category} value={category}>{translations.categories[category]}</MenuItem>)}
                        </TextField>
                        <FormControlLabel
                            control={<Checkbox checked={filters.assignedToMe}
                                               onChange={(event: React.ChangeEvent<HTMLInputElement>) => changeFilter("assignedToMe", event.target.checked)} />}
                            label={translations.list.assignedToMe}
                        />
                    </div>
                    <div className="pallet-table-wrap">
                        <table className="pallet-table incidents-table">
                            <thead>
                                <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td className="pallet-empty" colSpan={columns.length}>{translations.list.loading}</td></tr>
                                ) : incidents.length ? incidents.map((incident) => {
                                    const incidentId = String(incident.incidentId.value);
                                    const busy = busyIncidentId === incidentId;
                                    const resolved = incident.status === "RESOLVED";
                                    const trackingNumber = incident.trackingNumber || incident.shipmentId.value;
                                    return (
                                        <tr className="pallet-row" key={incidentId} tabIndex={0}
                                            onClick={() => openIncident(incident)}
                                            onKeyDown={(event) => event.target === event.currentTarget
                                                && (event.key === "Enter" || event.key === " ") && openIncident(incident)}>
                                            <td className="pallet-code incidents-id" title={incidentId}>#{incidentId}</td>
                                            <td className="incidents-nowrap">
                                                <button className="pallet-link" type="button" onClick={(event) => {
                                                    event.stopPropagation();
                                                    openShipment(incident);
                                                }}
                                                        aria-label={translations.list.openShipment.replace("{trackingNumber}", trackingNumber)}>
                                                    {trackingNumber}
                                                </button>
                                            </td>
                                            <td>
                                                <span className="incidents-category">{translations.categories[incident.category]}</span>
                                                {incident.description ? <small className="incidents-description">{incident.description}</small> : null}
                                            </td>
                                            <td className="incidents-nowrap"><Chip color={severityColor(incident.severity)} label={translations.severities[incident.severity]} size="small" /></td>
                                            <td className="incidents-nowrap"><Chip color={statusColor(incident.status)} label={translations.statuses[incident.status]} size="small" /></td>
                                            <td className="pallet-code incidents-nowrap">{incident.departmentCode || pl.common.dash}</td>
                                            <td>{incident.reporter.username || pl.common.dash}</td>
                                            <td className="incidents-nowrap">{formatIncidentDateTime(incident.reportedAt)}</td>
                                            <td className="incidents-nowrap">{formatIncidentAge(incident, now)}</td>
                                            <td>{incident.assignee?.username || <span className="incidents-muted">{translations.list.unassigned}</span>}</td>
                                            <td className="pallet-actions-cell">
                                                {resolved ? pl.common.dash : (
                                                    <span className="incidents-actions">
                                                        <Button size="small" variant="outlined" disabled={busy} onClick={(event) => {
                                                            event.stopPropagation();
                                                            assignToMe(incident);
                                                        }}>
                                                            {translations.list.assign}
                                                        </Button>
                                                        <Button size="small" disabled={busy} onClick={(event) => {
                                                            event.stopPropagation();
                                                            setResolveError(null);
                                                            setIncidentToResolve(incident);
                                                        }}>
                                                            {translations.list.resolve}
                                                        </Button>
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td className="pallet-empty" colSpan={columns.length}>{filtersActive ? translations.list.noMatches : translations.list.empty}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="pallet-pagination">
                        <span>{translations.list.pageInfo.replace("{page}", String(page + 1)).replace("{pages}", String(lastPage + 1))}</span>
                        <Button disabled={page === 0 || loading} variant="outlined" onClick={() => setPage((current) => Math.max(0, current - 1))}>
                            {translations.list.previous}
                        </Button>
                        <Button disabled={page >= lastPage || loading} variant="outlined" onClick={() => setPage((current) => current + 1)}>
                            {translations.list.next}
                        </Button>
                    </div>
                </section>
            </div>
            <IncidentResolveDialog
                incident={incidentToResolve}
                resolving={Boolean(incidentToResolve) && busyIncidentId === String(incidentToResolve?.incidentId.value)}
                error={resolveError}
                onClose={() => setIncidentToResolve(null)}
                onResolve={resolve}
            />
        </main>
    );
}

export default IncidentList;
