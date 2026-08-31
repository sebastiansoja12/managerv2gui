import React, {FormEvent, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Link} from "react-router-dom";
import {Alert, Button, Chip, IconButton, TextField, Typography} from "components/ui";
import {Add, DeleteOutline, QrCodeScanner, Save} from "components/ui/icons";
import AuthService from "../../hooks/AuthService";
import ShipmentCollectService, {CollectFaultError} from "../../hooks/ShipmentCollectService";
import {getBackendErrorMessage} from "../../api/errorMessage";
import {CurrentUserDto} from "../../auth/UserProfileDto";
import pl from "../../i18n/translate";
import {useBrowserDevice} from "../Devices/useBrowserDevice";
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
    const [currentUser, setCurrentUser] = useState<CurrentUserDto | null>(null);
    const [activationCode, setActivationCode] = useState("");
    const [adminCodeVisible, setAdminCodeVisible] = useState(false);
    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const [collectResponse, setCollectResponse] = useState<CollectResponse | null>(null);
    const [sessionRestored, setSessionRestored] = useState(false);

    const translations = pl.shipmentScanner;
    const saving = feedback?.state === "saving";
    const browserDevice = useBrowserDevice();
    const device = browserDevice.device;
    const deviceReady = browserDevice.status === "ready";

    const userId = currentUser ? String(currentUser.userId.value) : null;

    const collectedCount = useMemo(
        () => collectResponse?.details.filter((detail) => detail.success).length || 0,
        [collectResponse],
    );

    const focusInput = () => {
        window.setTimeout(() => inputRef.current?.focus(), 0);
    };

    const loadCurrentUser = useCallback(async () => {
        try {
            const profileResponse = await AuthService.me();
            const session = readShipmentCollectSession(profileResponse.data.userId.value);
            setCurrentUser(profileResponse.data);
            setPendingShipments(session.pendingShipments);
            setSessionRestored(true);
        } catch (error) {
            setFeedback({state: "error", description: getBackendErrorMessage(error, translations.feedback.error)});
        }
    }, [translations.feedback.error]);

    useEffect(() => {
        loadCurrentUser();
        focusInput();
    }, [loadCurrentUser]);

    useEffect(() => {
        if (userId && sessionRestored) {
            saveShipmentCollectSession(userId, {pendingShipments});
        }
    }, [userId, sessionRestored, pendingShipments]);

    const activateBrowser = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!activationCode.trim() || browserDevice.activating) {
            return;
        }
        await browserDevice.activate(activationCode);
        setActivationCode("");
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
        if (!device) {
            return translations.validation.deviceRequired;
        }
        if (!deviceReady) {
            return translations.validation.sessionRequired;
        }
        return null;
    };

    const saveCollection = async () => {
        if (saving) {
            return;
        }

        const validationError = validateBeforeSave();
        setValidationMessage(validationError);
        if (validationError || !device) {
            return;
        }

        setFeedback({state: "saving"});
        try {
            const response = await ShipmentCollectService.collect({
                deviceInformation: {
                    version: device.version || "",
                    deviceId: device.deviceId,
                    responsibleUser: currentUser?.username || "",
                    departmentCode: device.departmentCode || currentUser?.departmentCode || "",
                    pairKey: device.pairKey,
                    deviceUserType: "SUPPLIER",
                    deviceType: device.deviceType || "SCANNER",
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
            browserDevice.handleFault(message);
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
                        color={deviceReady ? "success" : "warning"}
                        label={deviceReady ? translations.page.readyStatus : translations.page.deviceMissingStatus}
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

                            {browserDevice.error ? <Alert severity="error">{browserDevice.error}</Alert> : null}

                            {device ? (
                                <div className="shipment-collect-form">
                                    <div className="shipment-collect-process">
                                        <span>{translations.device.deviceIdLabel}</span>
                                        <code>{device.deviceId}</code>
                                    </div>
                                    <div className="shipment-collect-process">
                                        <span>{translations.device.departmentLabel}</span>
                                        <code>{device.departmentCode || pl.common.dash}</code>
                                    </div>
                                    {browserDevice.status === "starting" ? (
                                        <p className="shipment-collect-hint">{translations.device.sessionStarting}</p>
                                    ) : null}
                                    {deviceReady && browserDevice.sessionExpiresAt ? (
                                        <p className="shipment-collect-hint">
                                            {translations.device.sessionReady.replace("{time}",
                                                new Date(browserDevice.sessionExpiresAt).toLocaleString(pl.common.locale))}
                                        </p>
                                    ) : null}
                                    <div className="shipment-collect-device-links">
                                        {browserDevice.status === "error" ? (
                                            <Button disabled={saving} variant="outlined" onClick={browserDevice.retrySession}>
                                                {translations.device.retrySession}
                                            </Button>
                                        ) : null}
                                        <Button disabled={saving} variant="text" onClick={browserDevice.deregister}>
                                            {translations.device.deregister}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <form className="shipment-collect-form" onSubmit={activateBrowser}>
                                    <p className="shipment-collect-hint">{translations.device.activationDescription}</p>
                                    <Button
                                        disabled={browserDevice.activating}
                                        variant="contained"
                                        onClick={() => browserDevice.activate()}
                                    >
                                        {translations.device.activateBrowser}
                                    </Button>
                                    {adminCodeVisible ? (
                                        <>
                                        <TextField
                                            autoComplete="off"
                                            disabled={browserDevice.activating}
                                            label={translations.device.activationCodeLabel}
                                            placeholder="ABCD-EFGH"
                                            size="small"
                                            value={activationCode}
                                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setActivationCode(event.target.value)}
                                        />
                                        <Button disabled={browserDevice.activating || !activationCode.trim()} type="submit" variant="outlined">
                                            {translations.device.activate}
                                        </Button>
                                        </>
                                    ) : (
                                        <Button disabled={browserDevice.activating} variant="text" onClick={() => setAdminCodeVisible(true)}>
                                            {translations.device.adminCode}
                                        </Button>
                                    )}
                                    <Link className="shipment-collect-link" to="/device-pairing">{translations.device.devicesLink}</Link>
                                </form>
                            )}
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
