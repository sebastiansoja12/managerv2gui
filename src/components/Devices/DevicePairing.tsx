import React, {useEffect, useState} from "react";
import {Alert, Button, Chip, Snackbar, Typography} from "components/ui";
import {Add, DevicesOther, Refresh} from "components/ui/icons";
import AuthService from "../../hooks/AuthService";
import DeviceService from "../../hooks/DeviceService";
import {CurrentUserDto} from "../../auth/UserProfileDto";
import {ApiErrorResponse} from "../../api/ApiResult";
import pl from "../../i18n/translate";
import {canManageUsers} from "../Users/model/UserRoleAccess";
import {DeviceDto} from "./dto/DeviceDto";
import DeviceActivationPanel from "./DeviceActivationPanel";
import DeviceCreateDialog from "./DeviceCreateDialog";
import DeviceSelfPairingPanel from "./DeviceSelfPairingPanel";
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
    const [loading, setLoading] = useState(false);
    const [notice, setNotice] = useState<Notice | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

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

    const handleDeviceCreated = async () => {
        setCreateDialogOpen(false);
        setNotice({severity: "success", message: pl.devices.create.messages.created});
        await loadData();
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
                    <div className="device-pairing-header-actions">
                        <Button disabled={loading} startIcon={<Refresh />} variant="outlined" onClick={loadData}>
                            {pl.devices.actions.refresh}
                        </Button>
                        <Button disabled={loading} startIcon={<Add />} variant="contained" onClick={() => setCreateDialogOpen(true)}>
                            {pl.devices.create.open}
                        </Button>
                    </div>
                </section>

                <DeviceSelfPairingPanel/>

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

                {canManageUsers(user?.role) ? <DeviceActivationPanel onNotice={setNotice}/> : null}
            </div>

            <DeviceCreateDialog
                currentUser={user}
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                onCreated={handleDeviceCreated}
            />

            <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice(null)}>
                {notice ? <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert> : undefined}
            </Snackbar>
        </main>
    );
}

export default DevicePairing;
