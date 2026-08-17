import React, {FormEvent, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Link} from "react-router-dom";
import {Alert, Button, Chip, IconButton, MenuItem, TextField, Typography} from "components/ui";
import {Add, DeleteOutline, QrCodeScanner, Save} from "components/ui/icons";
import AuthService from "../../hooks/AuthService";
import DeviceService from "../../hooks/DeviceService";
import ShipmentCollectService, {CollectFaultError} from "../../hooks/ShipmentCollectService";
import {getBackendErrorMessage} from "../../api/errorMessage";
import {CurrentUserDto} from "../../auth/UserProfileDto";
import pl from "../../i18n/translate";
import {DeviceDto} from "../Devices/dto/DeviceDto";
import {readDevicePairKey, removeDevicePairKey, saveDevicePairKey} from "../Devices/devicePairKeyStore";
import {CollectResponse, PendingShipment} from "./model/ShipmentCollect";
import {readShipmentCollectSession, saveShipmentCollectSession} from "./shipmentCollectSession";
import "./styles/shipment-scanner.css";

type FeedbackState = "added" | "duplicate" | "invalidCode" | "saving" | "saved" | "partial" | "failed" | "error";

type Feedback = {
    state: FeedbackState;
    description?: string;
};

const feedbackSeverity: Record<FeedbackState, "success" | "warning" | "error" | "info"> = {
    added: "success",
    saved: "success",
    duplicate: "warning",
    partial: "warning",
    invalidCode: "error",
    failed: "error",
    error: "error",
    saving: "info",
};

const formatScanTime = () => new Date().toLocaleTimeString(pl.common.locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
});

export const normalizeTrackingNumber = (value: string) => value.trim();

const deviceKey = (device: DeviceDto, index: number) => device.deviceId?.value || String(index);

const isPairKeyFault = (message: string) => /pair key/i.test(message);

const resolveSavedState = (collectResponse: CollectResponse): FeedbackState => {
    if (collectResponse.success) {
        return "saved";
    }
    return collectResponse.details.some((detail) => detail.success) ? "partial" : "failed";
};

function ShipmentScanner() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState("");
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [pendingShipments, setPendingShipments] = useState<PendingShipment[]>([]);
    const [devices, setDevices] = useState<DeviceDto[]>([]);
    const [devicesLoading, setDevicesLoading] = useState(true);
    const [devicesError, setDevicesError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<CurrentUserDto | null>(null);
    const [selectedDeviceKey, setSelectedDeviceKey] = useState("");
    const [pairKey, setPairKey] = useState("");
    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const [collectResponse, setCollectResponse] = useState<CollectResponse | null>(null);
    const [sessionRestored, setSessionRestored] = useState(false);

    const translations = pl.shipmentScanner;
    const saving = feedback?.state === "saving";

    const selectedDevice = useMemo(
        () => devices.find((device, index) => deviceKey(device, index) === selectedDeviceKey),
        [devices, selectedDeviceKey],
    );

    const userId = currentUser ? String(currentUser.userId.value) : null;
    const selectedDeviceId = selectedDevice?.deviceId?.value || null;
    const pairKeySaved = Boolean(userId && selectedDeviceId && pairKey && readDevicePairKey(userId, selectedDeviceId) === pairKey.trim());

    const collectedCount = useMemo(
        () => collectResponse?.details.filter((detail) => detail.success).length || 0,
        [collectResponse],
    );

    const focusInput = () => {
        window.setTimeout(() => inputRef.current?.focus(), 0);
    };

    const loadDevices = useCallback(async () => {
        setDevicesLoading(true);
        setDevicesError(null);
        try {
            const [profileResponse, devicesResponse] = await Promise.all([
                AuthService.me(),
                DeviceService.currentUserDevices(),
            ]);
            const loadedDevices = devicesResponse.data;
            const session = readShipmentCollectSession(profileResponse.data.userId.value);
            const restoredDeviceKey = loadedDevices.some((device, index) => deviceKey(device, index) === session.selectedDeviceKey)
                ? session.selectedDeviceKey
                : loadedDevices.length === 1 ? deviceKey(loadedDevices[0], 0) : "";
            setCurrentUser(profileResponse.data);
            setDevices(loadedDevices);
            setSelectedDeviceKey(restoredDeviceKey);
            setPendingShipments(session.pendingShipments);
            setSessionRestored(true);
        } catch (error) {
            setDevicesError(getBackendErrorMessage(error, translations.device.loadError));
        } finally {
            setDevicesLoading(false);
        }
    }, [translations.device.loadError]);

    useEffect(() => {
        loadDevices();
        focusInput();
    }, [loadDevices]);

    useEffect(() => {
        if (userId && sessionRestored) {
            saveShipmentCollectSession(userId, {pendingShipments, selectedDeviceKey});
        }
    }, [userId, sessionRestored, pendingShipments, selectedDeviceKey]);

    useEffect(() => {
        setPairKey(userId && selectedDeviceId ? readDevicePairKey(userId, selectedDeviceId) : "");
    }, [userId, selectedDeviceId]);

    const changePairKey = (value: string) => {
        setPairKey(value);
        if (userId && selectedDeviceId) {
            saveDevicePairKey(userId, selectedDeviceId, value);
        }
    };

    const forgetPairKey = () => {
        if (userId && selectedDeviceId) {
            removeDevicePairKey(userId, selectedDeviceId);
        }
        setPairKey("");
    };

    const addShipment = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (saving) {
            return;
        }

        const trackingNumber = normalizeTrackingNumber(inputValue);
        setInputValue("");
        setValidationMessage(null);
        focusInput();

        if (!trackingNumber) {
            setFeedback({state: "invalidCode"});
            return;
        }

        if (pendingShipments.some((shipment) => shipment.trackingNumber === trackingNumber)) {
            setFeedback({state: "duplicate", description: trackingNumber});
            return;
        }

        setPendingShipments((currentShipments) => [
            {trackingNumber, scannedAt: formatScanTime()},
            ...currentShipments,
        ]);
        setFeedback({state: "added", description: trackingNumber});
    };

    const removeShipment = (trackingNumber: string) => {
        setPendingShipments((currentShipments) => currentShipments
            .filter((shipment) => shipment.trackingNumber !== trackingNumber));
        focusInput();
    };

    const clearShipments = () => {
        setPendingShipments([]);
        setFeedback(null);
        focusInput();
    };

    const validateBeforeSave = (): string | null => {
        if (!pendingShipments.length) {
            return translations.validation.emptyList;
        }
        if (!selectedDevice) {
            return translations.validation.deviceRequired;
        }
        if (!pairKey.trim()) {
            return translations.validation.pairKeyRequired;
        }
        return null;
    };

    const saveCollection = async () => {
        if (saving) {
            return;
        }

        const validationError = validateBeforeSave();
        setValidationMessage(validationError);
        if (validationError || !selectedDevice) {
            return;
        }

        setFeedback({state: "saving"});
        try {
            const response = await ShipmentCollectService.collect({
                deviceInformation: {
                    version: selectedDevice.version?.value || "",
                    deviceId: selectedDevice.deviceId?.value || "",
                    responsibleUser: selectedDevice.username?.value || currentUser?.username || "",
                    departmentCode: selectedDevice.depotCode?.value || currentUser?.departmentCode || "",
                    pairKey: pairKey.trim(),
                    deviceUserType: "SUPPLIER",
                    deviceType: selectedDevice.deviceType || "SCANNER",
                },
                trackingNumbers: [...pendingShipments].reverse().map((shipment) => shipment.trackingNumber),
            });
            setCollectResponse(response);
            setPendingShipments([]);
            setFeedback({state: resolveSavedState(response), description: response.processId});
        } catch (error) {
            const message = error instanceof CollectFaultError
                ? error.message
                : getBackendErrorMessage(error, translations.feedback.error);
            if (isPairKeyFault(message)) {
                forgetPairKey();
            }
            setFeedback({state: "error", description: message});
        } finally {
            focusInput();
        }
    };

    const feedbackMessage = (currentFeedback: Feedback) => {
        const description = currentFeedback.state === "saving"
            ? translations.feedback.savingDescription
            : currentFeedback.description;
        return (
            <>
                <strong>{translations.feedback[currentFeedback.state]}</strong>
                {description ? <span className="shipment-collect-feedback-detail">{description}</span> : null}
            </>
        );
    };

    return (
        <main className="shipment-scanner-page">
            <div className="shipment-collect-shell">
                <section className="shipment-scanner-header shipment-collect-header">
                    <div className="shipment-collect-title">
                        <span className="shipment-collect-title-icon"><QrCodeScanner /></span>
                        <div>
                            <Typography variant="h4">{translations.page.title}</Typography>
                            <p>{translations.page.subtitle}</p>
                        </div>
                    </div>
                    <Chip
                        color={selectedDevice ? "success" : "warning"}
                        label={selectedDevice ? translations.page.readyStatus : translations.page.deviceMissingStatus}
                    />
                </section>

                <section className="shipment-collect-grid">
                    <div className="shipment-collect-panel">
                        <div className="shipment-collect-panel-header">
                            <div>
                                <Typography variant="h5">{translations.scanCard.title}</Typography>
                                <p>{translations.scanCard.description}</p>
                            </div>
                        </div>

                        <form className="shipment-collect-scan-form" onSubmit={addShipment}>
                            <TextField
                                autoComplete="off"
                                disabled={saving}
                                inputProps={{ref: inputRef}}
                                label={translations.scanCard.inputLabel}
                                placeholder={translations.scanCard.placeholder}
                                size="small"
                                value={inputValue}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setInputValue(event.target.value)}
                            />
                            <Button disabled={saving} startIcon={<Add />} type="submit" variant="outlined">
                                {translations.scanCard.submit}
                            </Button>
                        </form>

                        {feedback ? (
                            <Alert className="shipment-collect-feedback" severity={feedbackSeverity[feedback.state]}>
                                {feedbackMessage(feedback)}
                            </Alert>
                        ) : (
                            <p className="shipment-collect-hint">{translations.feedback.readyDescription}</p>
                        )}

                        <div className="shipment-collect-section-header">
                            <Typography variant="h5">{translations.pending.title}</Typography>
                            <span>{translations.pending.count.replace("{count}", String(pendingShipments.length))}</span>
                        </div>

                        <div className="shipment-collect-table-wrap">
                            <table className="shipment-collect-table">
                                <thead>
                                    <tr>
                                        <th>{translations.pending.columns.trackingNumber}</th>
                                        <th>{translations.pending.columns.scannedAt}</th>
                                        <th aria-label={translations.pending.columns.actions} />
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingShipments.length ? pendingShipments.map((shipment) => (
                                        <tr key={shipment.trackingNumber}>
                                            <td className="shipment-collect-code">{shipment.trackingNumber}</td>
                                            <td>{shipment.scannedAt}</td>
                                            <td className="shipment-collect-actions-cell">
                                                <IconButton
                                                    aria-label={translations.pending.remove.replace("{trackingNumber}", shipment.trackingNumber)}
                                                    disabled={saving}
                                                    size="small"
                                                    title={translations.pending.remove.replace("{trackingNumber}", shipment.trackingNumber)}
                                                    onClick={() => removeShipment(shipment.trackingNumber)}
                                                >
                                                    <DeleteOutline fontSize="small" />
                                                </IconButton>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td className="shipment-collect-empty" colSpan={3}>{translations.pending.empty}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {validationMessage ? <Alert severity="error">{validationMessage}</Alert> : null}

                        <div className="shipment-collect-actions">
                            <Button disabled={saving || !pendingShipments.length} variant="outlined" onClick={clearShipments}>
                                {translations.pending.clear}
                            </Button>
                            <Button disabled={saving} startIcon={<Save />} variant="contained" onClick={saveCollection}>
                                {translations.pending.save.replace("{count}", String(pendingShipments.length))}
                            </Button>
                        </div>
                    </div>

                    <div className="shipment-collect-side">
                        <div className="shipment-collect-panel">
                            <div className="shipment-collect-panel-header">
                                <div>
                                    <Typography variant="h5">{translations.device.title}</Typography>
                                    <p>{translations.device.description}</p>
                                </div>
                            </div>

                            {devicesLoading ? <p className="shipment-collect-hint">{translations.device.loading}</p> : null}
                            {devicesError ? <Alert severity="error">{devicesError}</Alert> : null}
                            {!devicesLoading && !devicesError && !devices.length ? (
                                <p className="shipment-collect-hint">
                                    {translations.device.empty}{" "}
                                    <Link to="/device-pairing">{translations.device.pairingLink}</Link>
                                </p>
                            ) : null}

                            {devices.length ? (
                                <div className="shipment-collect-form">
                                    <TextField
                                        select
                                        disabled={saving}
                                        label={translations.device.deviceLabel}
                                        size="small"
                                        value={selectedDeviceKey}
                                        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setSelectedDeviceKey(event.target.value)}
                                    >
                                        <MenuItem value="">{translations.device.devicePlaceholder}</MenuItem>
                                        {devices.map((device, index) => (
                                            <MenuItem key={deviceKey(device, index)} value={deviceKey(device, index)}>
                                                {[device.deviceType, device.deviceId?.value].filter(Boolean).join(" · ")}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                    <TextField
                                        autoComplete="off"
                                        disabled={saving || !selectedDevice}
                                        helperText={pairKeySaved ? translations.device.pairKeySaved : translations.device.pairKeyHint}
                                        label={translations.device.pairKeyLabel}
                                        size="small"
                                        type="password"
                                        value={pairKey}
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => changePairKey(event.target.value)}
                                    />
                                    <div className="shipment-collect-device-links">
                                        <Link className="shipment-collect-link" to="/device-pairing">{translations.device.pairingLink}</Link>
                                        {pairKeySaved ? (
                                            <Button disabled={saving} variant="text" onClick={forgetPairKey}>
                                                {translations.device.forgetPairKey}
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="shipment-collect-panel">
                            <div className="shipment-collect-panel-header">
                                <div>
                                    <Typography variant="h5">{translations.result.title}</Typography>
                                    <p>{collectResponse
                                        ? translations.result.summary
                                            .replace("{collected}", String(collectedCount))
                                            .replace("{total}", String(collectResponse.details.length))
                                        : translations.result.empty}</p>
                                </div>
                            </div>

                            {collectResponse ? (
                                <>
                                    <div className="shipment-collect-process">
                                        <span>{translations.result.processId}</span>
                                        <code>{collectResponse.processId}</code>
                                        <Link className="shipment-collect-link" to={`/processes/${collectResponse.processId}`}>
                                            {translations.result.openProcess}
                                        </Link>
                                    </div>
                                    <ul className="shipment-collect-results">
                                        {collectResponse.details.map((detail, index) => (
                                            <li key={`${detail.trackingNumber}-${index}`}>
                                                <div>
                                                    <span className="shipment-collect-code">{detail.trackingNumber || pl.common.dash}</span>
                                                    {detail.success ? null : (
                                                        <span className="shipment-collect-error">
                                                            {detail.errorMessage || translations.result.unknownError}
                                                        </span>
                                                    )}
                                                </div>
                                                <Chip
                                                    color={detail.success ? "success" : "error"}
                                                    label={detail.success ? translations.result.collected : translations.result.rejected}
                                                    size="small"
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ) : null}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default ShipmentScanner;
