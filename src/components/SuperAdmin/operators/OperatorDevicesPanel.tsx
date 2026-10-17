import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Alert, Dialog, DialogActions, DialogContent, DialogTitle} from "components/ui";
import {Block, CheckCircle, Key, Refresh, VpnKey} from "components/ui/icons";
import {getBackendErrorMessage} from "../../../api/errorMessage";
import OperatorOperationsService from "../../../hooks/OperatorOperationsService";
import pl from "../../../i18n/translate";
import {User} from "../../Users/model/User";
import {isPairKeyActive, OperatorApiKey, OperatorDevice} from "./model/OperatorOperations";

type OperatorDevicesPanelProps = {
    operatorId: string;
    users: User[];
};

type PendingAction =
    | {type: "revokeDevice"; device: OperatorDevice}
    | {type: "revokeApiKey"; apiKey: OperatorApiKey}
    | null;

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return pl.common.dash;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString(pl.common.locale);
};

function OperatorDevicesPanel({operatorId, users}: OperatorDevicesPanelProps) {
    const texts = pl.superAdmin.devices;
    const [devices, setDevices] = useState<OperatorDevice[]>([]);
    const [apiKeys, setApiKeys] = useState<OperatorApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [pending, setPending] = useState<PendingAction>(null);
    const [working, setWorking] = useState("");

    const usernames = useMemo(() => new Map(users.map((user) => [String(user.userId?.value), user.username])), [users]);

    const load = useCallback(() => {
        setLoading(true);
        setError("");
        Promise.all([
            OperatorOperationsService.getDevices(operatorId),
            OperatorOperationsService.getApiKeys(operatorId),
        ])
            .then(([loadedDevices, loadedApiKeys]) => {
                setDevices(Array.isArray(loadedDevices) ? loadedDevices : []);
                setApiKeys(Array.isArray(loadedApiKeys) ? loadedApiKeys : []);
            })
            .catch((requestError) => setError(getBackendErrorMessage(requestError, texts.loadError)))
            .finally(() => setLoading(false));
    }, [operatorId, texts.loadError]);

    useEffect(() => {
        setNotice("");
        load();
    }, [load]);

    const run = (key: string, action: () => Promise<void>, successMessage: string) => {
        setWorking(key);
        setError("");
        setNotice("");
        action()
            .then(() => {
                setNotice(successMessage);
                setPending(null);
                load();
            })
            .catch((requestError) => setError(getBackendErrorMessage(requestError, texts.saveError)))
            .finally(() => setWorking(""));
    };

    const toggleStatus = (device: OperatorDevice) => {
        const nextStatus = device.status === "BLOCKED" ? "ACTIVE" : "BLOCKED";
        run(`status:${device.deviceId}`, () => OperatorOperationsService.changeDeviceStatus(operatorId, device.deviceId, nextStatus),
            nextStatus === "BLOCKED" ? texts.blocked : texts.unblocked);
    };

    const confirmPending = () => {
        if (!pending) {
            return;
        }
        if (pending.type === "revokeDevice") {
            run(`revoke:${pending.device.deviceId}`, () => OperatorOperationsService.revokeDevice(operatorId, pending.device.deviceId), texts.revoked);
        } else {
            run(`key:${pending.apiKey.userId}`, () => OperatorOperationsService.revokeApiKey(operatorId, pending.apiKey.userId), texts.apiKeyRevoked);
        }
    };

    const typeLabel = (type?: string | null) => (type ? (texts.types as Record<string, string>)[type] || type : pl.common.dash);
    const statusLabel = (status?: string | null) => (status ? (texts.statuses as Record<string, string>)[status] || status : pl.common.dash);

    return (
        <div className="super-admin-configuration-workspace super-admin-operator-devices">
            <div className="super-admin-directory-list-header">
                <div><strong>{texts.title}</strong><span>{texts.subtitle}</span></div>
                <button aria-label={texts.refresh} className="super-admin-icon-button" disabled={loading} onClick={load} type="button">
                    <Refresh fontSize="small" />
                </button>
            </div>

            {error ? <Alert severity="error">{error}</Alert> : null}
            {notice ? <Alert severity="success">{notice}</Alert> : null}

            <div className="super-admin-directory-table super-admin-member-table">
                <div className="super-admin-directory-row super-admin-directory-head super-admin-device-row">
                    <span>{texts.columns.device}</span>
                    <span>{texts.columns.user}</span>
                    <span>{texts.columns.pairing}</span>
                    <span>{texts.columns.status}</span>
                    <span>{texts.columns.actions}</span>
                </div>
                {devices.map((device) => {
                    const keyActive = isPairKeyActive(device);
                    const blocked = device.status === "BLOCKED";
                    const retired = device.status === "RETIRED";
                    return (
                        <div className="super-admin-directory-row super-admin-device-row" key={device.deviceId}>
                            <span className="super-admin-member-name">
                                <strong>{device.deviceId}</strong>
                                <small>{typeLabel(device.deviceType)}{device.version ? ` · ${device.version}` : ""}</small>
                            </span>
                            <span className="super-admin-member-name">
                                <strong>{device.userId ? `@${usernames.get(String(device.userId)) || device.userId}` : pl.common.dash}</strong>
                                <small>{device.departmentCode || pl.common.dash}</small>
                            </span>
                            <span className="super-admin-member-name">
                                <strong>{keyActive ? texts.paired : texts.notPaired}</strong>
                                <small>{keyActive ? texts.pairExpires.replace("{time}", formatDateTime(device.pairKeyExpiresAt)) : texts.lastLogin.replace("{time}", formatDateTime(device.lastLoginAt))}</small>
                            </span>
                            <span><em className={`super-admin-job-status super-admin-device-status-${String(device.status || "").toLowerCase()}`}>{statusLabel(device.status)}</em></span>
                            <span className="super-admin-owner-actions">
                                <button
                                    className="super-admin-secondary-button super-admin-compact-button"
                                    disabled={!device.paired || Boolean(working)}
                                    onClick={() => setPending({type: "revokeDevice", device})}
                                    type="button"
                                >
                                    <Key fontSize="small" /><span>{texts.revoke}</span>
                                </button>
                                <button
                                    className={blocked ? "super-admin-secondary-button super-admin-compact-button" : "super-admin-danger-button super-admin-compact-button"}
                                    disabled={retired || Boolean(working)}
                                    onClick={() => toggleStatus(device)}
                                    type="button"
                                >
                                    {blocked ? <CheckCircle fontSize="small" /> : <Block fontSize="small" />}
                                    <span>{blocked ? texts.unblock : texts.block}</span>
                                </button>
                            </span>
                        </div>
                    );
                })}
                {!loading && !devices.length ? <div className="super-admin-directory-empty">{texts.empty}</div> : null}
            </div>

            <div className="super-admin-directory-list">
                <div className="super-admin-directory-list-header">
                    <div><strong>{texts.apiKeys.title}</strong><span>{texts.apiKeys.subtitle}</span></div>
                </div>
                <div className="super-admin-directory-table super-admin-member-table">
                    {apiKeys.map((apiKey) => (
                        <div className="super-admin-directory-row super-admin-access-admin-row" key={apiKey.userId}>
                            <span className="super-admin-member-name">
                                <strong><VpnKey fontSize="small" /> {`${apiKey.firstName || ""} ${apiKey.lastName || ""}`.trim() || apiKey.username}</strong>
                                <small>@{apiKey.username}{apiKey.departmentCode ? ` · ${apiKey.departmentCode}` : ""}</small>
                            </span>
                            <span className={`super-admin-member-role super-admin-member-role-${apiKey.role.toLowerCase()}`}>
                                {pl.usersManagement.roles[apiKey.role as keyof typeof pl.usersManagement.roles] || apiKey.role}
                            </span>
                            <span className="super-admin-owner-actions">
                                <button className="super-admin-danger-button super-admin-compact-button" disabled={Boolean(working)} onClick={() => setPending({type: "revokeApiKey", apiKey})} type="button">
                                    <Key fontSize="small" /><span>{texts.apiKeys.revoke}</span>
                                </button>
                            </span>
                        </div>
                    ))}
                    {!loading && !apiKeys.length ? <div className="super-admin-directory-empty">{texts.apiKeys.empty}</div> : null}
                </div>
            </div>

            <Dialog className="super-admin-dialog" fullWidth maxWidth="sm" open={Boolean(pending)} onClose={working ? undefined : () => setPending(null)}>
                <DialogTitle>{pending?.type === "revokeApiKey" ? texts.apiKeys.revokeTitle : texts.revokeTitle}</DialogTitle>
                <DialogContent>
                    <p className="super-admin-impersonation-description">
                        {pending?.type === "revokeApiKey"
                            ? texts.apiKeys.revokeDescription.replace("{user}", `@${pending.apiKey.username}`)
                            : pending?.type === "revokeDevice" ? texts.revokeDescription.replace("{device}", pending.device.deviceId) : ""}
                    </p>
                </DialogContent>
                <DialogActions>
                    <button className="super-admin-secondary-button" disabled={Boolean(working)} onClick={() => setPending(null)} type="button">{texts.cancel}</button>
                    <button className="super-admin-danger-button" disabled={Boolean(working)} onClick={confirmPending} type="button">{texts.confirm}</button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default OperatorDevicesPanel;
