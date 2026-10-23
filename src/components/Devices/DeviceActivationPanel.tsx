import React, {ChangeEvent, useCallback, useEffect, useState} from "react";
import QRCode from "qrcode";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    MenuItem,
    TextField,
    Typography,
} from "components/ui";
import {Block, QrCode2, Refresh} from "components/ui/icons";
import DeviceService from "../../hooks/DeviceService";
import {getBackendErrorMessage} from "../../api/errorMessage";
import pl from "../../i18n/translate";
import {DeviceActivationCodeResponseDto, DeviceAssignmentModeDto, DeviceDto, deviceAssignmentModes} from "./dto/DeviceDto";
import {buildActivationQrPayload, resolveActivationServerUrl} from "./deviceActivationQr";

type Notice = {
    severity: "success" | "error";
    message: string;
};

type DeviceActivationPanelProps = {
    onNotice: (notice: Notice) => void;
};

type ActivationState = {
    deviceId: string;
    code: DeviceActivationCodeResponseDto;
    qrCodeUrl: string;
};

const translations = pl.devices.activation;

function valueOrDash(value?: string | number | null) {
    return value === undefined || value === null || value === "" ? pl.common.dash : value;
}

function DeviceActivationPanel({onNotice}: DeviceActivationPanelProps) {
    const [devices, setDevices] = useState<DeviceDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [busyDeviceId, setBusyDeviceId] = useState<string | null>(null);
    const [activation, setActivation] = useState<ActivationState | null>(null);
    const [revokeDeviceId, setRevokeDeviceId] = useState<string | null>(null);
    const [now, setNow] = useState(() => Date.now());

    const serverUrl = resolveActivationServerUrl(process.env.REACT_APP_SERVER_URL, window.location.origin);

    const loadDevices = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const response = await DeviceService.allDevices();
            setDevices(response.data);
        } catch (error) {
            setLoadError(getBackendErrorMessage(error, translations.messages.loadError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDevices();
    }, [loadDevices]);

    useEffect(() => {
        if (!activation) {
            return undefined;
        }
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [activation]);

    const issueActivationCode = async (deviceId: string) => {
        setBusyDeviceId(deviceId);
        try {
            const response = await DeviceService.issueActivationCode(deviceId);
            const payload = buildActivationQrPayload(response.data.activationCode, serverUrl);
            const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(payload), {
                errorCorrectionLevel: "M",
                margin: 1,
                width: 260,
            });
            setNow(Date.now());
            setActivation({deviceId, code: response.data, qrCodeUrl});
        } catch (error) {
            onNotice({severity: "error", message: getBackendErrorMessage(error, translations.messages.activationError)});
        } finally {
            setBusyDeviceId(null);
        }
    };

    const changeAssignmentMode = async (deviceId: string, assignmentMode: DeviceAssignmentModeDto) => {
        setBusyDeviceId(deviceId);
        try {
            await DeviceService.updateOwnership(deviceId, {assignmentMode});
            setDevices((current) => current.map((device) => (
                device.deviceId?.value === deviceId ? {...device, assignmentMode} : device
            )));
            onNotice({severity: "success", message: translations.messages.modeChanged});
        } catch (error) {
            onNotice({severity: "error", message: getBackendErrorMessage(error, translations.messages.modeError)});
        } finally {
            setBusyDeviceId(null);
        }
    };

    const revokePairing = async () => {
        if (!revokeDeviceId) {
            return;
        }
        const deviceId = revokeDeviceId;
        setRevokeDeviceId(null);
        setBusyDeviceId(deviceId);
        try {
            await DeviceService.revokePairing(deviceId);
            onNotice({severity: "success", message: translations.messages.revoked});
        } catch (error) {
            onNotice({severity: "error", message: getBackendErrorMessage(error, translations.messages.revokeError)});
        } finally {
            setBusyDeviceId(null);
        }
    };

    const activationExpired = activation ? new Date(activation.code.expiresAt).getTime() <= now : false;

    return (
        <section className="device-pairing-panel device-pairing-table-panel device-activation-panel">
            <div className="device-pairing-table-header">
                <div>
                    <Typography variant="h5">{translations.title}</Typography>
                    <p>{translations.description}</p>
                </div>
                <div className="device-pairing-header-actions">
                    <span>{translations.count.replace("{count}", String(devices.length))}</span>
                    <Button disabled={loading} startIcon={<Refresh/>} variant="outlined" onClick={loadDevices}>
                        {pl.devices.actions.refresh}
                    </Button>
                </div>
            </div>
            {loadError ? <Alert severity="error">{loadError}</Alert> : null}
            <div className="device-pairing-table-wrap">
                <table className="device-pairing-table">
                    <thead>
                        <tr>
                            <th>{pl.devices.columns.deviceId}</th>
                            <th>{pl.devices.columns.type}</th>
                            <th>{pl.devices.columns.department}</th>
                            <th>{translations.columns.owner}</th>
                            <th>{translations.columns.mode}</th>
                            <th>{translations.columns.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {devices.length ? devices.map((device, index) => {
                            const deviceId = device.deviceId?.value || "";
                            const busy = busyDeviceId === deviceId;
                            return (
                                <tr key={deviceId || index}>
                                    <td>{valueOrDash(deviceId)}</td>
                                    <td>{valueOrDash(device.deviceType)}</td>
                                    <td>{valueOrDash(device.depotCode?.value)}</td>
                                    <td>{valueOrDash(device.username?.value)}</td>
                                    <td>
                                        <TextField
                                            select
                                            size="small"
                                            label={translations.columns.mode}
                                            disabled={!deviceId || busy}
                                            value={device.assignmentMode || "PERSONAL"}
                                            onChange={(event: ChangeEvent<HTMLInputElement>) => changeAssignmentMode(
                                                deviceId, event.target.value as DeviceAssignmentModeDto)}
                                        >
                                            {deviceAssignmentModes.map((mode) => (
                                                <MenuItem key={mode} value={mode}>{translations.modes[mode]}</MenuItem>
                                            ))}
                                        </TextField>
                                    </td>
                                    <td>
                                        <div className="device-activation-actions">
                                            <Button
                                                disabled={!deviceId || busy || device.active === false}
                                                startIcon={<QrCode2/>}
                                                variant="contained"
                                                onClick={() => issueActivationCode(deviceId)}
                                            >
                                                {translations.actions.activate}
                                            </Button>
                                            <Button
                                                disabled={!deviceId || busy}
                                                startIcon={<Block/>}
                                                variant="outlined"
                                                onClick={() => setRevokeDeviceId(deviceId)}
                                            >
                                                {translations.actions.revoke}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={6}>{loading ? pl.common.dash : translations.empty}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Dialog fullWidth maxWidth="sm" open={Boolean(activation)} onClose={() => setActivation(null)}>
                <DialogTitle>{translations.dialog.title.replace("{device}", activation?.deviceId || "")}</DialogTitle>
                <DialogContent className="device-activation-dialog">
                    <DialogContentText>{translations.dialog.description}</DialogContentText>
                    {activation ? (
                        <>
                            {activationExpired ? (
                                <Alert severity="warning">{translations.dialog.expired}</Alert>
                            ) : (
                                <img alt={translations.dialog.qrAlt} className="device-pairing-qr" src={activation.qrCodeUrl}/>
                            )}
                            <div className="device-pairing-pair-details">
                                <span>{translations.dialog.code}</span>
                                <strong>{activation.code.activationCode}</strong>
                            </div>
                            <div className="device-pairing-pair-details">
                                <span>{translations.dialog.serverUrl}</span>
                                <strong>{serverUrl}</strong>
                            </div>
                            <p>{translations.dialog.expiresAt.replace("{time}",
                                new Date(activation.code.expiresAt).toLocaleTimeString(pl.common.locale))}</p>
                        </>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button
                        disabled={!activation || busyDeviceId === activation.deviceId}
                        startIcon={<Refresh/>}
                        variant="outlined"
                        onClick={() => activation && issueActivationCode(activation.deviceId)}
                    >
                        {translations.dialog.regenerate}
                    </Button>
                    <Button variant="contained" onClick={() => setActivation(null)}>{translations.dialog.close}</Button>
                </DialogActions>
            </Dialog>

            <Dialog fullWidth maxWidth="xs" open={Boolean(revokeDeviceId)} onClose={() => setRevokeDeviceId(null)}>
                <DialogTitle>{translations.revokeDialog.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {translations.revokeDialog.description.replace("{device}", revokeDeviceId || "")}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={() => setRevokeDeviceId(null)}>{translations.revokeDialog.cancel}</Button>
                    <Button color="error" variant="contained" onClick={revokePairing}>{translations.revokeDialog.confirm}</Button>
                </DialogActions>
            </Dialog>
        </section>
    );
}

export default DeviceActivationPanel;
