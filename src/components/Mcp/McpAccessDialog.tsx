import React, {FormEvent, useEffect, useState} from "react";
import {Alert, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField} from "components/ui";
import {getBackendErrorMessage} from "../../api/errorMessage";
import McpService from "../../hooks/McpService";
import pl from "../../i18n/translate";
import {User} from "../Users/model/User";
import {McpAccessPolicy, McpModuleAccess, mcpModules} from "./model/McpAccess";
import "./styles/mcp.css";

type Props = {user?: User; onClose: () => void};

export default function McpAccessDialog({user, onClose}: Props) {
    const [policy, setPolicy] = useState<McpAccessPolicy>();
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const userId = user?.userId.value;

    useEffect(() => {
        setPolicy(undefined);
        setError("");
        setSuccess("");
        if (userId === undefined) {
            return;
        }
        let active = true;
        setLoading(true);
        McpService.getAccess(userId)
            .then((response) => { if (active) { setPolicy(response.data); } })
            .catch((requestError) => { if (active) { setError(getBackendErrorMessage(requestError, pl.mcp.loadError)); } })
            .finally(() => { if (active) { setLoading(false); } });
        return () => { active = false; };
    }, [userId]);

    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (userId === undefined || !policy) { return; }
        setBusy(true);
        setError("");
        setSuccess("");
        try {
            await McpService.updateAccess(userId, policy);
            setSuccess(pl.mcp.saved);
        } catch (requestError) {
            setError(getBackendErrorMessage(requestError, pl.mcp.saveError));
        } finally {
            setBusy(false);
        }
    };

    const revoke = async () => {
        if (userId === undefined || !window.confirm(pl.mcp.revokeAllConfirm)) { return; }
        setBusy(true);
        setError("");
        setSuccess("");
        try {
            await McpService.revokeUserKeys(userId);
            setSuccess(pl.mcp.keysRevoked);
        } catch (requestError) {
            setError(getBackendErrorMessage(requestError, pl.mcp.keyError));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog fullWidth maxWidth="md" open={Boolean(user)} onClose={busy ? undefined : onClose}>
            <form onSubmit={save}>
                <DialogTitle>{pl.mcp.title}{user ? ` · @${user.username}` : ""}</DialogTitle>
                <DialogContent>
                    <div className="mcp-content">
                        <p>{pl.mcp.adminDescription}</p>
                        {loading && <p role="status">{pl.common.loading}</p>}
                        {error && <Alert severity="error">{error}</Alert>}
                        {success && <Alert severity="success">{success}</Alert>}
                        {policy && <>
                            <label className="mcp-enabled">
                                <Checkbox checked={policy.enabled} disabled={busy} onChange={(event) =>
                                    setPolicy({...policy, enabled: event.target.checked})} />{pl.mcp.enabled}
                            </label>
                            <Alert severity="warning">{pl.mcp.blockWarning}</Alert>
                            <table className="mcp-table">
                                <thead><tr><th>{pl.mcp.module}</th><th>{pl.mcp.access}</th></tr></thead>
                                <tbody>{mcpModules.map((module) => <tr key={module}>
                                    <td>{pl.mcp.modules[module]}</td>
                                    <td><TextField select aria-label={`${pl.mcp.access}: ${pl.mcp.modules[module]}`}
                                        value={policy.modules[module] || "NONE"} disabled={busy || !policy.enabled}
                                        onChange={(event) => setPolicy({...policy, modules: {
                                            ...policy.modules, [module]: event.target.value as McpModuleAccess,
                                        }})}>
                                        {(["NONE", "READ", "WRITE"] as const).map((level) =>
                                            <MenuItem key={level} value={level}>{pl.mcp.levels[level]}</MenuItem>)}
                                    </TextField></td>
                                </tr>)}</tbody>
                            </table>
                            <p>{pl.mcp.refreshHint}</p>
                        </>}
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button disabled={busy || loading || !policy} onClick={() => void revoke()}>{pl.mcp.revokeAll}</Button>
                    <Button disabled={busy} onClick={onClose}>{pl.common.close}</Button>
                    <Button variant="contained" type="submit" disabled={busy || loading || !policy}>{pl.mcp.save}</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
