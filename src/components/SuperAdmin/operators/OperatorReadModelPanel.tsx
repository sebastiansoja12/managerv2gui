import React, {FormEvent, useCallback, useEffect, useMemo, useState} from "react";
import {Alert, Select} from "components/ui";
import {Refresh, SyncAlt} from "components/ui/icons";
import {getBackendErrorMessage} from "../../../api/errorMessage";
import OperatorAdministrationService from "../../../hooks/OperatorAdministrationService";
import pl from "../../../i18n/translate";
import {isReadModelJobRunning, ReadModelRebuildJob} from "./model/OperatorAdministration";

export const READ_MODEL_POLL_INTERVAL_MS = 3000;

type OperatorReadModelPanelProps = {
    operatorId: string;
};

const toIsoDate = (date: Date) => {
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 10);
};

const defaultRange = () => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 30);
    return {dateFrom: toIsoDate(from), dateTo: toIsoDate(today)};
};

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return pl.common.dash;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString(pl.common.locale);
};

const durationSeconds = (job: ReadModelRebuildJob) => {
    if (!job.startedAt) {
        return null;
    }
    const end = job.finishedAt ? new Date(job.finishedAt).getTime() : Date.now();
    const seconds = Math.round((end - new Date(job.startedAt).getTime()) / 1000);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
};

function OperatorReadModelPanel({operatorId}: OperatorReadModelPanelProps) {
    const texts = pl.superAdmin.readModels;
    const [types, setTypes] = useState<string[]>([]);
    const [readModelType, setReadModelType] = useState("");
    const [range, setRange] = useState(defaultRange);
    const [jobs, setJobs] = useState<ReadModelRebuildJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const typeLabel = (type: string) => (texts.types as Record<string, string>)[type] || type;
    const statusLabel = (status: string) => (texts.statuses as Record<string, string>)[status] || status;

    const loadJobs = useCallback((silent = false) => {
        if (!silent) {
            setLoading(true);
        }
        return OperatorAdministrationService.getReadModelJobs(operatorId)
            .then((loadedJobs) => setJobs(Array.isArray(loadedJobs) ? loadedJobs : []))
            .catch((requestError) => setError(getBackendErrorMessage(requestError, texts.loadError)))
            .finally(() => setLoading(false));
    }, [operatorId, texts.loadError]);

    useEffect(() => {
        OperatorAdministrationService.getReadModelTypes()
            .then((loadedTypes) => {
                const availableTypes = Array.isArray(loadedTypes) ? loadedTypes : [];
                setTypes(availableTypes);
                setReadModelType((current) => current || availableTypes[0] || "");
            })
            .catch((requestError) => setError(getBackendErrorMessage(requestError, texts.loadError)));
    }, [texts.loadError]);

    useEffect(() => {
        setError("");
        setNotice("");
        void loadJobs();
    }, [loadJobs]);

    const running = useMemo(() => jobs.some(isReadModelJobRunning), [jobs]);

    useEffect(() => {
        if (!running) {
            return undefined;
        }
        const interval = window.setInterval(() => {
            void loadJobs(true);
        }, READ_MODEL_POLL_INTERVAL_MS);
        return () => window.clearInterval(interval);
    }, [loadJobs, running]);

    const rangeInvalid = !range.dateFrom || !range.dateTo || range.dateFrom > range.dateTo;

    const start = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!readModelType || rangeInvalid) {
            return;
        }
        setStarting(true);
        setError("");
        setNotice("");
        OperatorAdministrationService.startReadModelRebuild(operatorId, readModelType, range)
            .then((job) => {
                setJobs((current) => [job, ...current.filter((currentJob) => currentJob.jobId !== job.jobId)]);
                setNotice(texts.started.replace("{type}", typeLabel(job.readModelType)));
            })
            .catch((requestError) => setError(getBackendErrorMessage(requestError, texts.startError)))
            .finally(() => setStarting(false));
    };

    return (
        <div className="super-admin-configuration-workspace super-admin-read-models">
            <div className="super-admin-directory-list-header">
                <div><strong>{texts.title}</strong><span>{texts.subtitle}</span></div>
                <button aria-label={texts.refresh} className="super-admin-icon-button" disabled={loading} onClick={() => void loadJobs()} type="button">
                    <Refresh fontSize="small" />
                </button>
            </div>

            {error ? <Alert severity="error">{error}</Alert> : null}
            {notice ? <Alert severity="success">{notice}</Alert> : null}

            <form className="super-admin-read-model-form" onSubmit={start}>
                <label>
                    <span>{texts.type}</span>
                    <Select aria-label={texts.type} onChange={(event) => setReadModelType(event.target.value)} value={readModelType}>
                        {types.map((type) => <option key={type} value={type}>{typeLabel(type)}</option>)}
                    </Select>
                </label>
                <label>
                    <span>{texts.dateFrom}</span>
                    <input aria-label={texts.dateFrom} onChange={(event) => setRange((current) => ({...current, dateFrom: event.target.value}))} type="date" value={range.dateFrom} />
                </label>
                <label>
                    <span>{texts.dateTo}</span>
                    <input aria-label={texts.dateTo} onChange={(event) => setRange((current) => ({...current, dateTo: event.target.value}))} type="date" value={range.dateTo} />
                </label>
                <button className="super-admin-primary-button" disabled={starting || !readModelType || rangeInvalid} type="submit">
                    <SyncAlt fontSize="small" /><span>{starting ? texts.starting : texts.start}</span>
                </button>
            </form>
            {rangeInvalid ? <p className="super-admin-form-hint">{texts.rangeInvalid}</p> : <p className="super-admin-form-hint">{texts.hint}</p>}

            <div className="super-admin-directory-table super-admin-member-table">
                <div className="super-admin-directory-row super-admin-directory-head super-admin-read-model-row">
                    <span>{texts.columns.type}</span>
                    <span>{texts.columns.range}</span>
                    <span>{texts.columns.status}</span>
                    <span>{texts.columns.created}</span>
                    <span>{texts.columns.duration}</span>
                </div>
                {jobs.map((job) => {
                    const seconds = durationSeconds(job);
                    return (
                        <div className="super-admin-directory-row super-admin-read-model-row" key={job.jobId}>
                            <span><strong>{typeLabel(job.readModelType)}</strong></span>
                            <span className="super-admin-audit-time">{job.dateFrom} → {job.dateTo}</span>
                            <span>
                                <em className={`super-admin-job-status super-admin-job-status-${String(job.status).toLowerCase()}`}>{statusLabel(job.status)}</em>
                                {job.error ? <small className="super-admin-job-error" title={job.error}>{job.error}</small> : null}
                            </span>
                            <span className="super-admin-audit-time">{formatDateTime(job.createdAt)}</span>
                            <span className="super-admin-audit-time">{seconds === null ? pl.common.dash : `${seconds} s`}</span>
                        </div>
                    );
                })}
                {!loading && !jobs.length ? <div className="super-admin-directory-empty">{texts.empty}</div> : null}
            </div>
        </div>
    );
}

export default OperatorReadModelPanel;
