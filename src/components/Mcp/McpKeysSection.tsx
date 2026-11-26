import React, {FormEvent, useCallback, useEffect, useState} from "react";
import {Alert, Button, IconButton, TextField} from "components/ui";
import {ContentCopy, DeleteOutline, Key, Refresh, Visibility, VisibilityOff} from "components/ui/icons";
import useTemporarySecret, {MASKED_SECRET} from "../../auth/useTemporarySecret";
import {ApiErrorResponse} from "../../api/ApiResult";
import {getBackendErrorMessage} from "../../api/errorMessage";
import McpService from "../../hooks/McpService";
import pl from "../../i18n/translate";
import {McpAccessPolicy, McpKey, mcpKeyStatus} from "./model/McpAccess";
import "./styles/mcp.css";

export default function McpKeysSection() {
    const [keys, setKeys] = useState<McpKey[]>([]);
    const [policy, setPolicy] = useState<McpAccessPolicy>();
    const [name, setName] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const {secret, busy: secretBusy, hideSecret, readSecret} = useTemporarySecret();
    const [showCreate, setShowCreate] = useState(false);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const load = useCallback(async () => {
        hideSecret();
        setLoading(true);
        setError("");
        try {
            const [keysResponse, accessResponse] = await Promise.all([McpService.listKeys(), McpService.ownAccess()]);
            setKeys(keysResponse.data);
            setPolicy(accessResponse.data);
        } catch (requestError) {
            setPolicy(undefined);
            setError(getBackendErrorMessage(requestError, pl.mcp.loadError));
        } finally {
            setLoading(false);
        }
    }, [hideSecret]);

    useEffect(() => { void load(); }, [load]);

    const generate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        if (!name.trim() || name.trim().length > 100) {
            setError(pl.mcp.nameRequired);
            return;
        }
        const expiry = expiresAt ? new Date(expiresAt) : null;
        if (expiry && (!Number.isFinite(expiry.getTime()) || expiry.getTime() <= Date.now())) {
            setError(pl.mcp.expiryInvalid);
            return;
        }
        if (keys.some((key) => mcpKeyStatus(key) === "ACTIVE") && !window.confirm(pl.mcp.rotateConfirm)) { return; }
        setBusy(true);
        hideSecret();
        try {
            await McpService.generateKey({name: name.trim(), expiresAt: expiry?.toISOString() || null});
            setName("");
            setExpiresAt("");
            setShowCreate(false);
            setSuccess(pl.mcp.generated);
            await load();
        } catch (requestError) {
            setError(getBackendErrorMessage(requestError, pl.mcp.keyError));
        } finally {
            setBusy(false);
        }
    };

    const revoke = async (key: McpKey) => {
        if (!window.confirm(pl.mcp.revokeConfirm)) { return; }
        setBusy(true);
        hideSecret();
        setError("");
        setSuccess("");
        try {
            await McpService.revokeKey(key.mcpKeyId.value);
            setSuccess(pl.mcp.revoked);
            await load();
        } catch (requestError) {
            setError(getBackendErrorMessage(requestError, pl.mcp.keyError));
        } finally {
            setBusy(false);
        }
    };

    const activeKey = keys.find((key) => mcpKeyStatus(key) === "ACTIVE");
    const showSecret = async (copy: boolean) => {
        if (!activeKey) { return; }
        if (secret && !copy) { hideSecret(); return; }
        setError("");
        setSuccess("");
        try {
            const completed = await readSecret(async () => (await McpService.revealKey(activeKey.mcpKeyId.value)).data.key, copy);
            if (completed && copy) { setSuccess(pl.mcp.copied); }
        } catch (requestError) {
            setError((requestError as ApiErrorResponse).status === 409
                ? pl.mcp.revealUnavailable : getBackendErrorMessage(requestError, pl.mcp.keyError));
        }
    };
    const disabled = busy || loading || secretBusy || !policy?.enabled;
    const date = (value: string | null) => value ? new Date(value).toLocaleString(pl.common.locale, {
        year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }) : pl.mcp.never;

    return (
        <section className="user-profile-api-key-detail mcp-profile-section" aria-label={pl.mcp.title}>
            <div className="user-profile-api-key-label">
                <span>{pl.mcp.keyTitle}</span><small>{pl.mcp.profileDescription}</small>
            </div>
            <div className="user-profile-api-key-field profile-credential-field" data-empty={!activeKey}>
                <Key fontSize="small" />
                <input aria-label={pl.mcp.keyTitle} readOnly type="text" autoComplete="off" spellCheck={false}
                    value={activeKey ? secret || MASKED_SECRET : ""} placeholder={pl.mcp.keyMissing} />
                <div className="user-profile-api-key-actions">
                    <IconButton aria-label={secret ? pl.mcp.hide : pl.mcp.reveal} title={secret ? pl.mcp.hide : pl.mcp.reveal}
                        aria-pressed={Boolean(secret)} disabled={!activeKey || disabled} onClick={() => void showSecret(false)}>
                        {secret ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                    <IconButton aria-label={pl.mcp.copy} title={pl.mcp.copy} disabled={!activeKey || disabled}
                        onClick={() => void showSecret(true)}><ContentCopy fontSize="small" /></IconButton>
                    <IconButton aria-label={pl.mcp.newKeyOptions} title={pl.mcp.newKeyOptions} aria-expanded={showCreate || !activeKey}
                        disabled={disabled} onClick={() => { hideSecret(); setShowCreate((value) => !value); }}>
                        <Refresh fontSize="small" />
                    </IconButton>
                    <IconButton aria-label={pl.mcp.revoke} title={pl.mcp.revoke} className="user-profile-api-key-delete"
                        disabled={!activeKey || disabled} onClick={() => activeKey && void revoke(activeKey)}>
                        <DeleteOutline fontSize="small" />
                    </IconButton>
                </div>
            </div>
            {activeKey && <div className="mcp-key-meta">
                <strong>{activeKey.name}</strong>
                <span className="mcp-status" data-status="ACTIVE">{pl.mcp.statuses.ACTIVE}</span>
                <span>{pl.mcp.expiresLabel}: {activeKey.expiresAt ? date(activeKey.expiresAt) : pl.mcp.noExpiry}</span>
                <span>{pl.mcp.lastUsedLabel}: {date(activeKey.lastUsedAt)}</span>
            </div>}
            {activeKey && <p className="mcp-key-hint" role="status">{secret ? pl.mcp.revealedHint : pl.mcp.maskedHint}</p>}
            <div className="mcp-content">
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}
                {loading && <p role="status">{pl.common.loading}</p>}
                {policy && !policy.enabled && <Alert severity="warning">{pl.mcp.disabled}</Alert>}
                {(showCreate || !activeKey) && <form className="mcp-key-form" onSubmit={generate}>
                    <p className="mcp-form-hint">{pl.mcp.formHint}</p>
                    <TextField label={pl.mcp.name} value={name} inputProps={{maxLength: 100}}
                        onChange={(event) => setName(event.target.value)} disabled={disabled} />
                    <TextField label={pl.mcp.expiresAt} type="datetime-local" value={expiresAt}
                        onChange={(event) => setExpiresAt(event.target.value)} disabled={disabled} />
                    <div className="mcp-form-actions">
                        <Button type="submit" variant="contained" disabled={disabled}>{pl.mcp.generate}</Button>
                        {activeKey && <Button variant="outlined" disabled={busy} onClick={() => setShowCreate(false)}>{pl.common.cancel}</Button>}
                    </div>
                </form>}
                {!loading && !keys.length && <p className="mcp-key-hint">{pl.mcp.empty}</p>}
                {keys.length > 0 && <details className="mcp-history">
                    <summary>{pl.mcp.history}<span>{keys.length}</span></summary>
                    <div className="mcp-table-scroll"><table className="mcp-table">
                        <thead><tr>
                            <th>{pl.mcp.name}</th><th>{pl.mcp.status}</th><th>{pl.mcp.createdAt}</th>
                            <th>{pl.mcp.expiresLabel}</th><th>{pl.mcp.lastUsedAt}</th><th>{pl.common.actions}</th>
                        </tr></thead>
                        <tbody>{keys.map((key) => <tr key={key.mcpKeyId.value}>
                            <td><strong>{key.name}</strong><code className="mcp-prefix">{key.keyPrefix}…</code></td>
                            <td><span className="mcp-status" data-status={mcpKeyStatus(key)}>{pl.mcp.statuses[mcpKeyStatus(key)]}</span></td>
                            <td>{date(key.createdAt)}</td><td>{key.expiresAt ? date(key.expiresAt) : pl.mcp.noExpiry}</td><td>{date(key.lastUsedAt)}</td>
                            <td><IconButton disabled={busy || loading || key.status === "REVOKED"} onClick={() => void revoke(key)}
                                aria-label={`${pl.mcp.revoke}: ${key.name}`} title={pl.mcp.revoke}>
                                <DeleteOutline fontSize="small" />
                            </IconButton></td>
                        </tr>)}</tbody>
                    </table></div>
                </details>}
            </div>
        </section>
    );
}
