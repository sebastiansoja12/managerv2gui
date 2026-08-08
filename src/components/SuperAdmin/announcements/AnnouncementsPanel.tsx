import React, {FormEvent, useCallback, useEffect, useMemo, useState} from "react";
import {Alert, Dialog, DialogActions, DialogContent, DialogTitle, Select} from "components/ui";
import {Add, DeleteOutline, EditOutlined, Refresh, Save} from "components/ui/icons";
import {getBackendErrorMessage} from "../../../api/errorMessage";
import OperatorService from "../../../hooks/OperatorService";
import PlatformAnnouncementService from "../../../hooks/PlatformAnnouncementService";
import pl from "../../../i18n/translate";
import {Operator} from "../../Operators/model/Operator";
import {getOperatorIdValue} from "../operators/operatorPanelUtils";
import {
    announcementRoles,
    announcementSeverities,
    announcementToDraft,
    draftToRequest,
    emptyAnnouncementDraft,
    isDraftRangeInvalid,
    PlatformAnnouncement,
    PlatformAnnouncementDraft,
    PlatformAnnouncementSeverity,
} from "./model/PlatformAnnouncement";

type AnnouncementsPanelProps = {
    operators?: Operator[];
};

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return "";
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString(pl.common.locale);
};

function AnnouncementsPanel({operators: providedOperators}: AnnouncementsPanelProps) {
    const texts = pl.superAdmin.announcements;
    const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
    const [loadedOperators, setLoadedOperators] = useState<Operator[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState<PlatformAnnouncement | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [draft, setDraft] = useState<PlatformAnnouncementDraft>(emptyAnnouncementDraft);
    const [saving, setSaving] = useState(false);
    const [dialogError, setDialogError] = useState("");
    const [deleting, setDeleting] = useState<PlatformAnnouncement | null>(null);

    const operators = providedOperators || loadedOperators;
    const operatorNames = useMemo(() => new Map(operators.map((operator) => [
        Number(getOperatorIdValue(operator)),
        operator.companyName,
    ])), [operators]);

    const load = useCallback(() => {
        setLoading(true);
        setError("");
        PlatformAnnouncementService.getAll()
            .then((loaded) => setAnnouncements(Array.isArray(loaded) ? loaded : []))
            .catch((requestError) => setError(getBackendErrorMessage(requestError, texts.loadError)))
            .finally(() => setLoading(false));
    }, [texts.loadError]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (providedOperators) {
            return;
        }
        OperatorService.getAll()
            .then((response) => setLoadedOperators(Array.isArray(response.data) ? response.data : []))
            .catch(() => setLoadedOperators([]));
    }, [providedOperators]);

    const openCreate = () => {
        setEditing(null);
        setDraft(emptyAnnouncementDraft());
        setDialogError("");
        setDialogOpen(true);
    };

    const openEdit = (announcement: PlatformAnnouncement) => {
        setEditing(announcement);
        setDraft(announcementToDraft(announcement));
        setDialogError("");
        setDialogOpen(true);
    };

    const toggleOperator = (operatorId: number) => {
        setDraft((current) => ({
            ...current,
            targetOperatorIds: current.targetOperatorIds.includes(operatorId)
                ? current.targetOperatorIds.filter((id) => id !== operatorId)
                : [...current.targetOperatorIds, operatorId],
        }));
    };

    const toggleRole = (role: string) => {
        setDraft((current) => ({
            ...current,
            targetRoles: current.targetRoles.includes(role)
                ? current.targetRoles.filter((value) => value !== role)
                : [...current.targetRoles, role],
        }));
    };

    const rangeInvalid = isDraftRangeInvalid(draft);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!draft.message.trim() || rangeInvalid) {
            return;
        }
        setSaving(true);
        setDialogError("");
        const request = draftToRequest(draft);
        const operation = editing
            ? PlatformAnnouncementService.update(editing.id, request)
            : PlatformAnnouncementService.create(request);
        operation
            .then(() => {
                setDialogOpen(false);
                load();
            })
            .catch((requestError) => setDialogError(getBackendErrorMessage(requestError, texts.saveError)))
            .finally(() => setSaving(false));
    };

    const confirmDelete = () => {
        if (!deleting) {
            return;
        }
        setSaving(true);
        PlatformAnnouncementService.remove(deleting.id)
            .then(() => {
                setDeleting(null);
                load();
            })
            .catch((requestError) => setError(getBackendErrorMessage(requestError, texts.clearError)))
            .finally(() => setSaving(false));
    };

    const audienceLabel = (announcement: PlatformAnnouncement) => {
        const operatorLabel = announcement.targetOperatorIds.length
            ? announcement.targetOperatorIds.map((id) => operatorNames.get(id) || `#${id}`).join(", ")
            : texts.allOperators;
        const roleLabel = announcement.targetRoles.length
            ? announcement.targetRoles.map((role) => pl.usersManagement.roles[role as keyof typeof pl.usersManagement.roles] || role).join(", ")
            : texts.allRoles;
        return `${operatorLabel} · ${roleLabel}`;
    };

    const validityLabel = (announcement: PlatformAnnouncement) => {
        if (!announcement.validFrom && !announcement.validTo) {
            return texts.always;
        }
        return `${announcement.validFrom ? formatDateTime(announcement.validFrom) : texts.now} → ${announcement.validTo ? formatDateTime(announcement.validTo) : texts.noEnd}`;
    };

    return (
        <section className="super-admin-module-section">
            <div className="super-admin-module-heading super-admin-module-heading-actions">
                <div>
                    <span className="super-admin-kicker">{pl.superAdmin.layout.kicker}</span>
                    <h2>{texts.title}</h2>
                    <p>{texts.listSubtitle}</p>
                </div>
                <div className="super-admin-module-heading-buttons">
                    <button aria-label={texts.refresh} className="super-admin-icon-button" disabled={loading} onClick={load} type="button">
                        <Refresh fontSize="small" />
                    </button>
                    <button className="super-admin-primary-button" onClick={openCreate} type="button">
                        <Add fontSize="small" /><span>{texts.create}</span>
                    </button>
                </div>
            </div>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <div className="super-admin-announcement-list">
                {announcements.map((announcement) => (
                    <article className={`super-admin-announcement-item super-admin-announcement-${announcement.severity.toLowerCase()}`} key={announcement.id}>
                        <div className="super-admin-announcement-item-head">
                            <em className={`super-admin-announcement-severity super-admin-announcement-severity-${announcement.severity.toLowerCase()}`}>
                                {texts.severities[announcement.severity]}
                            </em>
                            <em className={`super-admin-job-status super-admin-announcement-status-${announcement.status.toLowerCase()}`}>
                                {texts.statuses[announcement.status]}
                            </em>
                            <span className="super-admin-audit-time">{validityLabel(announcement)}</span>
                        </div>
                        {announcement.title ? <strong>{announcement.title}</strong> : null}
                        <p>{announcement.message}</p>
                        <div className="super-admin-announcement-item-foot">
                            <small>{audienceLabel(announcement)}{announcement.createdBy ? ` · @${announcement.createdBy}` : ""}</small>
                            <span className="super-admin-owner-actions">
                                <button className="super-admin-secondary-button super-admin-compact-button" onClick={() => openEdit(announcement)} type="button">
                                    <EditOutlined fontSize="small" /><span>{texts.edit}</span>
                                </button>
                                <button className="super-admin-danger-button super-admin-compact-button" onClick={() => setDeleting(announcement)} type="button">
                                    <DeleteOutline fontSize="small" /><span>{texts.deleteAction}</span>
                                </button>
                            </span>
                        </div>
                    </article>
                ))}
                {!loading && !announcements.length ? <div className="super-admin-directory-empty">{texts.empty}</div> : null}
            </div>

            <Dialog className="super-admin-dialog" fullWidth maxWidth="md" open={dialogOpen} onClose={saving ? undefined : () => setDialogOpen(false)}>
                <form onSubmit={submit}>
                    <DialogTitle>{editing ? texts.editTitle : texts.createTitle}</DialogTitle>
                    <DialogContent>
                        {dialogError ? <Alert severity="error" sx={{mb: 2}}>{dialogError}</Alert> : null}
                        <div className="super-admin-form-grid">
                            <label>
                                <span>{texts.titleLabel}</span>
                                <input maxLength={200} onChange={(event) => setDraft((current) => ({...current, title: event.target.value}))} value={draft.title} />
                            </label>
                            <label>
                                <span>{texts.severity}</span>
                                <Select aria-label={texts.severity} onChange={(event) => setDraft((current) => ({...current, severity: event.target.value as PlatformAnnouncementSeverity}))} value={draft.severity}>
                                    {announcementSeverities.map((severity) => <option key={severity} value={severity}>{texts.severities[severity]}</option>)}
                                </Select>
                            </label>
                            <label className="super-admin-form-grid-wide">
                                <span>{texts.fieldLabel}</span>
                                <textarea
                                    maxLength={2000}
                                    onChange={(event) => setDraft((current) => ({...current, message: event.target.value}))}
                                    placeholder={texts.placeholder}
                                    required
                                    rows={4}
                                    value={draft.message}
                                />
                            </label>
                            <label>
                                <span>{texts.validFrom}</span>
                                <input aria-label={texts.validFrom} onChange={(event) => setDraft((current) => ({...current, validFrom: event.target.value}))} type="datetime-local" value={draft.validFrom} />
                            </label>
                            <label>
                                <span>{texts.validTo}</span>
                                <input aria-label={texts.validTo} onChange={(event) => setDraft((current) => ({...current, validTo: event.target.value}))} type="datetime-local" value={draft.validTo} />
                            </label>
                        </div>
                        <p className={rangeInvalid ? "super-admin-form-hint super-admin-form-hint-error" : "super-admin-form-hint"}>
                            {rangeInvalid ? texts.invalidRange : draft.severity === "CRITICAL" ? texts.criticalHint : texts.validityHint}
                        </p>

                        <fieldset className="super-admin-data-section">
                            <legend>{texts.operators}</legend>
                            <p className="super-admin-form-hint">{draft.targetOperatorIds.length ? texts.selectedOperators.replace("{count}", String(draft.targetOperatorIds.length)) : texts.allOperators}</p>
                            <div className="super-admin-check-grid">
                                {operators.map((operator) => {
                                    const operatorId = Number(getOperatorIdValue(operator));
                                    return (
                                        <label className="super-admin-check" key={operatorId}>
                                            <input checked={draft.targetOperatorIds.includes(operatorId)} onChange={() => toggleOperator(operatorId)} type="checkbox" />
                                            <span>{operator.companyName} <small>#{operatorId}</small></span>
                                        </label>
                                    );
                                })}
                            </div>
                        </fieldset>

                        <fieldset className="super-admin-data-section">
                            <legend>{texts.roles}</legend>
                            <p className="super-admin-form-hint">{draft.targetRoles.length ? texts.selectedRoles.replace("{count}", String(draft.targetRoles.length)) : texts.allRoles}</p>
                            <div className="super-admin-check-grid">
                                {announcementRoles.map((role) => (
                                    <label className="super-admin-check" key={role}>
                                        <input checked={draft.targetRoles.includes(role)} onChange={() => toggleRole(role)} type="checkbox" />
                                        <span>{pl.usersManagement.roles[role as keyof typeof pl.usersManagement.roles] || role}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    </DialogContent>
                    <DialogActions>
                        <button className="super-admin-secondary-button" disabled={saving} onClick={() => setDialogOpen(false)} type="button">{texts.cancel}</button>
                        <button className="super-admin-primary-button" disabled={saving || !draft.message.trim() || rangeInvalid} type="submit">
                            <Save fontSize="small" /><span>{saving ? texts.saving : texts.save}</span>
                        </button>
                    </DialogActions>
                </form>
            </Dialog>

            <Dialog className="super-admin-dialog" fullWidth maxWidth="xs" open={Boolean(deleting)} onClose={saving ? undefined : () => setDeleting(null)}>
                <DialogTitle>{texts.deleteTitle}</DialogTitle>
                <DialogContent>
                    <p className="super-admin-impersonation-description">{deleting?.title || deleting?.message}</p>
                </DialogContent>
                <DialogActions>
                    <button className="super-admin-secondary-button" disabled={saving} onClick={() => setDeleting(null)} type="button">{texts.cancel}</button>
                    <button className="super-admin-danger-button" disabled={saving} onClick={confirmDelete} type="button">{texts.deleteAction}</button>
                </DialogActions>
            </Dialog>
        </section>
    );
}

export default AnnouncementsPanel;
