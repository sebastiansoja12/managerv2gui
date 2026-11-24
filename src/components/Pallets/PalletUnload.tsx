import React, {FormEvent, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useParams} from "react-router-dom";
import {
    Alert,
    Button,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel,
    IconButton,
    TextField,
    Typography,
} from "components/ui";
import {CheckCircle, QrCodeScanner, UnarchiveOutlined, Undo, VolumeOff, VolumeUp} from "components/ui/icons";
import PalletService from "../../hooks/PalletService";
import ShipmentService from "../../hooks/ShipmentService";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "../AppShell/types";
import {playScanFeedback} from "../ShipmentScanner/scanFeedbackSound";
import {readScannerPreferences, saveScannerPreferences, ScannerPreferences} from "../ShipmentScanner/scannerPreferences";
import {PalletDto} from "./model/Pallet";
import {palletErrorMessage, palletStatusLabel} from "./palletLabels";
import {palletDetailsTab} from "./palletNavigation";
import {missingShipments, normalizeUnloadCode, resolveUnloadScan, UnloadShipment} from "./palletUnloadScan";
import "./styles/pallets.css";

type FeedbackState = "ready" | "scanned" | "duplicate" | "notOnPallet" | "invalidCode" | "allScanned"
    | "loadingPallet" | "loadError" | "unloading" | "unloaded" | "unloadedWithMissing" | "error";

type Feedback = {
    state: FeedbackState;
    description?: string;
};

const feedbackSeverity: Record<FeedbackState, "success" | "warning" | "error" | "info"> = {
    ready: "info",
    scanned: "success",
    allScanned: "success",
    unloaded: "success",
    duplicate: "warning",
    unloadedWithMissing: "warning",
    notOnPallet: "error",
    invalidCode: "error",
    loadError: "error",
    error: "error",
    loadingPallet: "info",
    unloading: "info",
};

const SILENT_STATES: FeedbackState[] = ["ready", "loadingPallet", "unloading"];

const scanTime = () => new Date().toLocaleTimeString(pl.common.locale, {hour: "2-digit", minute: "2-digit", second: "2-digit"});

type PalletUnloadProps = {
    onOpenTab?: (tab: AppTabDefinition) => void;
};

function PalletUnload({onOpenTab}: PalletUnloadProps) {
    const translations = pl.pallets.unload;
    const {trackingNumber: trackingNumberParam = ""} = useParams();
    const palletInputRef = useRef<HTMLInputElement>(null);
    const shipmentInputRef = useRef<HTMLInputElement>(null);
    const [palletCode, setPalletCode] = useState("");
    const [shipmentCode, setShipmentCode] = useState("");
    const [pallet, setPallet] = useState<PalletDto | null>(null);
    const [shipments, setShipments] = useState<UnloadShipment[]>([]);
    const [scannedAt, setScannedAt] = useState<Map<string, string>>(new Map());
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [palletOnly, setPalletOnly] = useState(false);
    const palletOnlyRef = useRef(palletOnly);
    palletOnlyRef.current = palletOnly;
    const [palletOnlyConfirmOpen, setPalletOnlyConfirmOpen] = useState(false);
    const [finished, setFinished] = useState(false);
    const [preferences, setPreferences] = useState<ScannerPreferences>(readScannerPreferences);

    const busy = feedback?.state === "loadingPallet" || feedback?.state === "unloading";
    const scannedIds = useMemo(() => new Set(scannedAt.keys()), [scannedAt]);
    const missing = useMemo(() => missingShipments(shipments, scannedIds), [shipments, scannedIds]);

    const focus = (ref: React.RefObject<HTMLInputElement>) => window.setTimeout(() => ref.current?.focus(), 0);

    useEffect(() => {
        if (feedback && !SILENT_STATES.includes(feedback.state)) {
            const severity = feedbackSeverity[feedback.state];
            playScanFeedback(severity === "info" ? "success" : severity, preferences.soundEnabled);
        }
        // Only a new scan result should sound, not a sound toggle.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feedback]);

    const loadPallet = useCallback(async (rawTrackingNumber: string) => {
        const trackingNumber = normalizeUnloadCode(rawTrackingNumber);
        if (!trackingNumber) {
            setFeedback({state: "loadError", description: translations.palletRequired});
            return;
        }
        setFeedback({state: "loadingPallet"});
        setPallet(null);
        setShipments([]);
        setScannedAt(new Map());
        setFinished(false);
        try {
            const loadedPallet = (await PalletService.getByTrackingNumber(trackingNumber)).data;
            if (loadedPallet.palletStatus !== "IN_TRANSIT") {
                setFeedback({
                    state: "loadError",
                    description: translations.invalidStatus.replace("{status}", palletStatusLabel(loadedPallet.palletStatus)),
                });
                focus(palletInputRef);
                return;
            }
            const shipmentIds = loadedPallet.shipmentIds.map(String);
            const details = await Promise.allSettled(shipmentIds.map((shipmentId) => ShipmentService.getControlCenter(shipmentId)));
            setShipments(shipmentIds.map((shipmentId, index) => {
                const result = details[index];
                return {
                    shipmentId,
                    trackingNumber: result.status === "fulfilled" ? result.value.data.shipment?.trackingNumber?.value || null : null,
                };
            }));
            setPallet(loadedPallet);
            setPalletCode("");
            setFeedback({state: "ready", description: loadedPallet.trackingNumber});
            if (palletOnlyRef.current && shipmentIds.length) {
                setPalletOnlyConfirmOpen(true);
                return;
            }
            focus(shipmentInputRef);
        } catch (error) {
            setFeedback({state: "loadError", description: palletErrorMessage(error, translations.loadError)});
            focus(palletInputRef);
        }
    }, [translations]);

    useEffect(() => {
        if (trackingNumberParam) {
            loadPallet(decodeURIComponent(trackingNumberParam));
        } else {
            focus(palletInputRef);
        }
    }, [trackingNumberParam, loadPallet]);

    const submitPallet = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!busy) {
            loadPallet(palletCode);
        }
    };

    const submitShipment = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (busy || finished) {
            return;
        }
        const result = resolveUnloadScan(shipmentCode, shipments, scannedIds);
        setShipmentCode("");
        focus(shipmentInputRef);
        if (result.state === "invalidCode") {
            setFeedback({state: "invalidCode"});
            return;
        }
        if (result.state === "notOnPallet") {
            setFeedback({state: "notOnPallet", description: result.code});
            return;
        }
        const label = result.shipment.trackingNumber || result.shipment.shipmentId;
        if (result.state === "duplicate") {
            setFeedback({state: "duplicate", description: label});
            return;
        }
        setScannedAt((current) => new Map(current).set(result.shipment.shipmentId, scanTime()));
        setFeedback({state: missing.length === 1 ? "allScanned" : "scanned", description: label});
    };

    const undoScan = (shipment: UnloadShipment) => {
        setScannedAt((current) => {
            const next = new Map(current);
            next.delete(shipment.shipmentId);
            return next;
        });
        setFeedback(null);
        focus(shipmentInputRef);
    };

    const unload = async (missingIds: string[] = missing.map((shipment) => shipment.shipmentId)) => {
        if (!pallet || busy) {
            return;
        }
        setConfirmOpen(false);
        setFeedback({state: "unloading"});
        try {
            const unloadedPallet = (await PalletService.unload(pallet.palletId, missingIds)).data;
            setPallet(unloadedPallet);
            setFinished(true);
            setFeedback(missingIds.length
                ? {state: "unloadedWithMissing", description: translations.missingCount.replace("{count}", String(missingIds.length))}
                : {state: "unloaded", description: unloadedPallet.trackingNumber});
        } catch (error) {
            setFeedback({state: "error", description: palletErrorMessage(error, translations.feedback.error)});
        }
    };

    const finish = () => (missing.length ? setConfirmOpen(true) : unload());

    const acceptAllShipments = () => {
        setPalletOnlyConfirmOpen(false);
        const time = scanTime();
        setScannedAt(new Map(shipments.map((shipment) => [shipment.shipmentId, time])));
        unload([]);
    };

    const scanShipmentsInstead = () => {
        setPalletOnlyConfirmOpen(false);
        focus(shipmentInputRef);
    };

    const startOver = () => {
        setPallet(null);
        setShipments([]);
        setScannedAt(new Map());
        setFinished(false);
        setFeedback(null);
        focus(palletInputRef);
    };

    const toggleSound = () => setPreferences((current) => {
        const next = {...current, soundEnabled: !current.soundEnabled};
        saveScannerPreferences(next);
        return next;
    });

    const scannedCount = shipments.length - missing.length;

    return (
        <main className="pallet-page">
            <div className="pallet-shell">
                <section className="pallet-header">
                    <div className="pallet-title">
                        <span className="pallet-title-icon"><UnarchiveOutlined /></span>
                        <div>
                            <Typography variant="h4">{translations.title}</Typography>
                            <p>{translations.subtitle}</p>
                        </div>
                    </div>
                    <Button
                        aria-pressed={preferences.soundEnabled}
                        startIcon={preferences.soundEnabled ? <VolumeUp /> : <VolumeOff />}
                        variant="outlined"
                        onClick={toggleSound}
                    >
                        {preferences.soundEnabled ? pl.shipmentScanner.tablet.soundOn : pl.shipmentScanner.tablet.soundOff}
                    </Button>
                </section>

                <section className="pallet-grid">
                    <div className="pallet-panel">
                        {pallet ? (
                            <form className="pallet-scan-form" onSubmit={submitShipment}>
                                <TextField
                                    autoComplete="off"
                                    disabled={busy || finished}
                                    inputProps={{ref: shipmentInputRef}}
                                    label={translations.shipmentInputLabel}
                                    placeholder={translations.shipmentPlaceholder}
                                    size="small"
                                    value={shipmentCode}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setShipmentCode(event.target.value)}
                                />
                                <Button disabled={busy || finished} startIcon={<QrCodeScanner />} type="submit">
                                    {translations.shipmentSubmit}
                                </Button>
                            </form>
                        ) : (
                            <form className="pallet-scan-form" onSubmit={submitPallet}>
                                <TextField
                                    autoComplete="off"
                                    disabled={busy}
                                    inputProps={{ref: palletInputRef}}
                                    label={translations.palletInputLabel}
                                    placeholder={translations.palletPlaceholder}
                                    size="small"
                                    value={palletCode}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPalletCode(event.target.value)}
                                />
                                <Button disabled={busy} startIcon={<QrCodeScanner />} type="submit">
                                    {translations.palletSubmit}
                                </Button>
                                <FormControlLabel
                                    className="pallet-scan-form-option"
                                    control={<Checkbox checked={palletOnly} disabled={busy} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPalletOnly(event.target.checked)} />}
                                    label={translations.palletOnly.label}
                                />
                            </form>
                        )}

                        <div aria-live="assertive" role="status">
                            {feedback ? (
                                <Alert className="pallet-feedback" severity={feedbackSeverity[feedback.state]}>
                                    <strong>{translations.feedback[feedback.state]}</strong>
                                    {feedback.description ? <span className="pallet-feedback-detail">{feedback.description}</span> : null}
                                </Alert>
                            ) : (
                                <p className="pallet-hint">{pallet ? translations.feedback.ready : translations.idle}</p>
                            )}
                        </div>

                        {pallet ? (
                            <div className="pallet-table-wrap">
                                <table className="pallet-table">
                                    <thead>
                                        <tr>
                                            <th>{translations.columns.trackingNumber}</th>
                                            <th>{translations.columns.state}</th>
                                            <th>{translations.columns.scannedAt}</th>
                                            <th aria-label={translations.columns.actions} />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shipments.length ? shipments.map((shipment) => {
                                            const time = scannedAt.get(shipment.shipmentId);
                                            const label = shipment.trackingNumber || shipment.shipmentId;
                                            return (
                                                <tr className={time ? "pallet-unload-row-scanned" : undefined} key={shipment.shipmentId}>
                                                    <td className="pallet-code">{label}</td>
                                                    <td>
                                                        <Chip
                                                            color={time ? "success" : finished ? "warning" : "default"}
                                                            label={time ? translations.states.scanned : finished ? translations.states.missing : translations.states.pending}
                                                            size="small"
                                                        />
                                                    </td>
                                                    <td>{time || pl.common.dash}</td>
                                                    <td>
                                                        {time && !finished ? (
                                                            <IconButton
                                                                aria-label={translations.undo.replace("{trackingNumber}", label)}
                                                                size="small"
                                                                title={translations.undo.replace("{trackingNumber}", label)}
                                                                onClick={() => undoScan(shipment)}
                                                            >
                                                                <Undo fontSize="small" />
                                                            </IconButton>
                                                        ) : null}
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td className="pallet-empty" colSpan={4}>{translations.noShipments}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : null}
                    </div>

                    <div className="pallet-panel">
                        <div className="pallet-panel-header">
                            <div>
                                <Typography variant="h5">{translations.progressTitle}</Typography>
                                <p>{pallet ? translations.progress
                                    .replace("{scanned}", String(scannedCount))
                                    .replace("{total}", String(shipments.length)) : translations.progressEmpty}</p>
                            </div>
                        </div>
                        {pallet ? (
                            <>
                                <progress className="pallet-unload-progress" max={shipments.length || 1} value={scannedCount} />
                                <div className="pallet-summary">
                                    <div className="pallet-summary-item">
                                        <span>{pl.pallets.summary.trackingNumber}</span>
                                        <strong className="pallet-tracking-number">{pallet.trackingNumber}</strong>
                                    </div>
                                    <div className="pallet-summary-item">
                                        <span>{pl.pallets.summary.status}</span>
                                        <strong>{palletStatusLabel(pallet.palletStatus)}</strong>
                                    </div>
                                    <div className="pallet-summary-item">
                                        <span>{translations.missingLabel}</span>
                                        <strong>{missing.length}</strong>
                                    </div>
                                </div>
                                <div className="pallet-actions">
                                    {finished ? (
                                        <>
                                            {onOpenTab ? (
                                                <Button variant="outlined" onClick={() => onOpenTab(palletDetailsTab(pallet.trackingNumber))}>
                                                    {translations.openPallet}
                                                </Button>
                                            ) : null}
                                            <Button startIcon={<QrCodeScanner />} onClick={startOver}>{translations.nextPallet}</Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button disabled={busy} variant="outlined" onClick={startOver}>{translations.changePallet}</Button>
                                            <Button disabled={busy} startIcon={<CheckCircle />} onClick={finish}>{translations.finish}</Button>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : null}
                        <p className="pallet-hint">{translations.missingHint}</p>
                    </div>
                </section>
            </div>

            <Dialog fullWidth maxWidth="xs" open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>{translations.confirmTitle}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{translations.confirmMessage.replace("{count}", String(missing.length))}</DialogContentText>
                    <ul className="pallet-unload-missing-list">
                        {missing.map((shipment) => (
                            <li className="pallet-code" key={shipment.shipmentId}>{shipment.trackingNumber || shipment.shipmentId}</li>
                        ))}
                    </ul>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={() => {
                        setConfirmOpen(false);
                        focus(shipmentInputRef);
                    }}>{translations.backToScanning}</Button>
                    <Button onClick={() => unload()}>{translations.confirmFinish}</Button>
                </DialogActions>
            </Dialog>

            <Dialog fullWidth maxWidth="sm" open={palletOnlyConfirmOpen} onClose={scanShipmentsInstead}>
                <DialogTitle>{translations.palletOnly.confirmTitle}</DialogTitle>
                <DialogContent>
                    <Alert severity="warning">
                        {translations.palletOnly.confirmWarning.replace("{count}", String(shipments.length))}
                    </Alert>
                    <DialogContentText>{translations.palletOnly.confirmRecommendation}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={scanShipmentsInstead}>{translations.palletOnly.scanShipments}</Button>
                    <Button onClick={acceptAllShipments}>{translations.palletOnly.acceptAll}</Button>
                </DialogActions>
            </Dialog>
        </main>
    );
}

export default PalletUnload;
