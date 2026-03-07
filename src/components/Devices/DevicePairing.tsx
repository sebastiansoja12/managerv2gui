import React, {ChangeEvent, useEffect, useMemo, useState} from "react";
import QRCode from "qrcode";
import {Alert, Button, Chip, Snackbar, TextField, Typography} from "@mui/material";
import {DevicesOther, QrCode2, Refresh} from "@mui/icons-material";
import AuthService from "../../hooks/AuthService";
import DeviceService from "../../hooks/DeviceService";
import {CurrentUserDto} from "../../auth/UserProfileDto";
import {ApiErrorResponse} from "../../api/ApiResult";
import pl from "../../i18n/translate";
import {DeviceDto, DevicePairResponseDto} from "./dto/DeviceDto";
import "./styles/device-pairing.css";

type Notice = {
    severity: "success" | "error";
    message: string;
};

function valueOrDash(value?: string | number | null) {
    return value === undefined || value === null || value === "" ? pl.common.dash : value;
}

function DevicePairing() {
    const [user, setUser] = useState<CurrentUserDto | null>(null);
    const [devices, setDevices] = useState<DeviceDto[]>([]);
    const [externalSystemId, setExternalSystemId] = useState("");
    const [pairResponse, setPairResponse] = useState<DevicePairResponseDto | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [notice, setNotice] = useState<Notice | null>(null);

    const departmentCode = useMemo(() => user?.departmentCode || "", [user]);

    const showError = React.useCallback((error: unknown, fallbackMessage: string) => {
        const apiError = error as ApiErrorResponse;
        setNotice({severity: "error", message: apiError.message || fallbackMessage});
    }, []);

    const loadData = React.useCallback(async () => {
        setLoading(true);
        try {
            const [profileResponse, devicesResponse] = await Promise.all([
                AuthService.me(),
                DeviceService.currentUserDevices(),
            ]);
            setUser(profileResponse.data);
            setDevices(devicesResponse.data);
        } catch (error) {
            showError(error, pl.devices.messages.loadError);
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const generateQr = async (response: DevicePairResponseDto) => {
        const payload = {
            type: "MANAGER_DEVICE_PAIRING",
            userId: response.userId?.value,
            deviceId: response.deviceId?.value,
            devicePairId: response.devicePairId?.value,
            pairKey: response.pairKey,
            pairStatus: response.pairStatus,
            generatedAt: new Date().toISOString(),
        };
        const url = await QRCode.toDataURL(JSON.stringify(payload), {
            errorCorrectionLevel: "M",
            margin: 1,
            width: 260,
        });
        setQrCodeUrl(url);
    };

    const pairDevice = async () => {
        if (!externalSystemId.trim()) {
            setNotice({severity: "error", message: pl.devices.messages.externalSystemIdRequired});
            return;
        }

        setLoading(true);
        try {
            const response = await DeviceService.pairCurrentUserDevice({
                externalSystemId: externalSystemId.trim(),
                departmentCode: departmentCode ? {value: departmentCode} : null,
            });
            setPairResponse(response.data);
            await generateQr(response.data);
            setNotice({severity: "success", message: pl.devices.messages.paired});
            await loadData();
        } catch (error) {
            showError(error, pl.devices.messages.pairError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="device-pairing-page">
            <div className="device-pairing-shell">
                <section className="device-pairing-header">
                    <div className="device-pairing-title">
                        <span className="device-pairing-title-icon"><DevicesOther /></span>
                        <div>
                            <Typography variant="h4">{pl.devices.page.title}</Typography>
                            <p>{pl.devices.page.subtitle}</p>
                        </div>
                    </div>
                    <Button disabled={loading} startIcon={<Refresh />} variant="outlined" onClick={loadData}>
                        {pl.devices.actions.refresh}
                    </Button>
                </section>

                <section className="device-pairing-grid">
                    <div className="device-pairing-panel">
                        <Typography variant="h5">{pl.devices.pairing.title}</Typography>
                        <p>{pl.devices.pairing.description}</p>
                        <div className="device-pairing-form">
                            <TextField
                                fullWidth
                                label={pl.devices.fields.externalSystemId}
                                size="small"
                                value={externalSystemId}
                                onChange={(event: ChangeEvent<HTMLInputElement>) => setExternalSystemId(event.target.value)}
                            />
                            <TextField
                                disabled
                                fullWidth
                                label={pl.devices.fields.departmentCode}
                                size="small"
                                value={departmentCode || pl.common.dash}
                            />
                            <Button disabled={loading} startIcon={<QrCode2 />} variant="contained" onClick={pairDevice}>
                                {pl.devices.actions.generateQr}
                            </Button>
                        </div>
                    </div>

                    <div className="device-pairing-panel device-pairing-qr-panel">
                        <Typography variant="h5">{pl.devices.qr.title}</Typography>
                        {qrCodeUrl ? (
                            <>
                                <img alt={pl.devices.qr.alt} className="device-pairing-qr" src={qrCodeUrl} />
                                <div className="device-pairing-pair-details">
                                    <span>{pl.devices.fields.pairKey}</span>
                                    <strong>{valueOrDash(pairResponse?.pairKey)}</strong>
                                </div>
                                <Chip label={valueOrDash(pairResponse?.pairStatus)} />
                            </>
                        ) : (
                            <div className="device-pairing-empty-qr">
                                <QrCode2 />
                                <span>{pl.devices.qr.empty}</span>
                            </div>
                        )}
                    </div>
                </section>

                <section className="device-pairing-panel device-pairing-table-panel">
                    <div className="device-pairing-table-header">
                        <Typography variant="h5">{pl.devices.assigned.title}</Typography>
                        <span>{pl.devices.assigned.count.replace("{count}", String(devices.length))}</span>
                    </div>
                    <div className="device-pairing-table-wrap">
                        <table className="device-pairing-table">
                            <thead>
                                <tr>
                                    <th>{pl.devices.columns.deviceId}</th>
                                    <th>{pl.devices.columns.type}</th>
                                    <th>{pl.devices.columns.version}</th>
                                    <th>{pl.devices.columns.department}</th>
                                    <th>{pl.devices.columns.active}</th>
                                    <th>{pl.devices.columns.lastUpdate}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {devices.length ? devices.map((device, index) => (
                                    <tr key={device.deviceId?.value || index}>
                                        <td>{valueOrDash(device.deviceId?.value)}</td>
                                        <td>{valueOrDash(device.deviceType)}</td>
                                        <td>{valueOrDash(device.version?.value)}</td>
                                        <td>{valueOrDash(device.depotCode?.value)}</td>
                                        <td>
                                            <Chip
                                                color={device.active ? "success" : "default"}
                                                label={device.active ? pl.devices.status.active : pl.devices.status.inactive}
                                                size="small"
                                            />
                                        </td>
                                        <td>{device.lastUpdate ? new Date(device.lastUpdate).toLocaleString(pl.common.locale) : pl.common.dash}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6}>{pl.devices.assigned.empty}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice(null)}>
                {notice ? <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert> : undefined}
            </Snackbar>
        </main>
    );
}

export default DevicePairing;
