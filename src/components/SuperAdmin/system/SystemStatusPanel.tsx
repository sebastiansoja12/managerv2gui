import React, {useCallback, useEffect, useState} from "react";
import {Alert} from "components/ui";
import {CheckCircle, ErrorOutline, Refresh} from "components/ui/icons";
import {getBackendErrorMessage} from "../../../api/errorMessage";
import PlatformSystemService from "../../../hooks/PlatformSystemService";
import pl from "../../../i18n/translate";
import {formatUptime, SystemStatus} from "./model/SystemStatus";

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return pl.common.dash;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString(pl.common.locale);
};

function SystemStatusPanel() {
    const texts = pl.superAdmin.systemStatus;
    const [status, setStatus] = useState<SystemStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(() => {
        setLoading(true);
        setError("");
        PlatformSystemService.getStatus()
            .then(setStatus)
            .catch((requestError) => setError(getBackendErrorMessage(requestError, texts.loadError)))
            .finally(() => setLoading(false));
    }, [texts.loadError]);

    useEffect(() => {
        load();
    }, [load]);

    const runtime = status?.runtime;
    const database = status?.database;
    const migrations = status?.migrations;
    const memoryUsage = runtime && runtime.maxMemoryMegabytes > 0
        ? Math.round((runtime.usedMemoryMegabytes / runtime.maxMemoryMegabytes) * 100)
        : null;

    return (
        <section className="super-admin-module-section">
            <div className="super-admin-module-heading super-admin-module-heading-actions">
                <div>
                    <span className="super-admin-kicker">{pl.superAdmin.layout.kicker}</span>
                    <h2>{texts.title}</h2>
                    <p>{texts.subtitle}</p>
                </div>
                <button aria-label={texts.refresh} className="super-admin-icon-button" disabled={loading} onClick={load} type="button">
                    <Refresh fontSize="small" />
                </button>
            </div>

            {error ? <Alert severity="error">{error}</Alert> : null}

            {status ? (
                <div className="super-admin-status-grid">
                    <article className="super-admin-status-card">
                        <span className="super-admin-access-card-label">{texts.application}</span>
                        <strong>{runtime?.applicationName}</strong>
                        <dl>
                            <div><dt>{texts.version}</dt><dd>{runtime?.version}</dd></div>
                            <div><dt>{texts.java}</dt><dd>{runtime?.javaVersion}</dd></div>
                            <div><dt>{texts.profiles}</dt><dd>{runtime?.activeProfiles?.length ? runtime.activeProfiles.join(", ") : texts.noProfiles}</dd></div>
                        </dl>
                    </article>

                    <article className="super-admin-status-card">
                        <span className="super-admin-access-card-label">{texts.uptime}</span>
                        <strong>{formatUptime(runtime?.uptimeSeconds || 0)}</strong>
                        <dl>
                            <div><dt>{texts.startedAt}</dt><dd>{formatDateTime(runtime?.startedAt)}</dd></div>
                            <div><dt>{texts.memory}</dt><dd>{runtime?.usedMemoryMegabytes} / {runtime?.maxMemoryMegabytes} MB{memoryUsage !== null ? ` (${memoryUsage}%)` : ""}</dd></div>
                            <div><dt>{texts.processors}</dt><dd>{runtime?.availableProcessors}</dd></div>
                        </dl>
                        {memoryUsage !== null ? (
                            <span aria-label={texts.memory} className="super-admin-status-meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={memoryUsage}>
                                <span style={{width: `${Math.min(memoryUsage, 100)}%`}} />
                            </span>
                        ) : null}
                    </article>

                    <article className={`super-admin-status-card ${database?.available ? "is-healthy" : "is-failing"}`}>
                        <span className="super-admin-access-card-label">{texts.database}</span>
                        <strong className="super-admin-status-health">
                            {database?.available ? <CheckCircle fontSize="small" /> : <ErrorOutline fontSize="small" />}
                            {database?.available ? texts.databaseUp : texts.databaseDown}
                        </strong>
                        <dl>
                            <div><dt>{texts.engine}</dt><dd>{[database?.product, database?.version].filter(Boolean).join(" ") || pl.common.dash}</dd></div>
                            <div><dt>{texts.responseTime}</dt><dd>{database?.responseTimeMillis} ms</dd></div>
                        </dl>
                    </article>

                    <article className="super-admin-status-card">
                        <span className="super-admin-access-card-label">{texts.migrations}</span>
                        <strong>{migrations?.executedChangeSets ?? 0}</strong>
                        <dl>
                            <div><dt>{texts.lastChangeSet}</dt><dd title={migrations?.lastChangeSetId || ""}>{migrations?.lastChangeSetId || pl.common.dash}</dd></div>
                            <div><dt>{texts.author}</dt><dd>{migrations?.lastAuthor || pl.common.dash}</dd></div>
                            <div><dt>{texts.executedAt}</dt><dd>{formatDateTime(migrations?.lastExecutedAt)}</dd></div>
                        </dl>
                    </article>
                </div>
            ) : null}
            {loading && !status ? <div className="super-admin-directory-loading"><Refresh fontSize="small" />{texts.loading}</div> : null}
        </section>
    );
}

export default SystemStatusPanel;
