import React, {FormEvent, useRef, useState} from "react";
import {Alert, Button, Chip, TextField, Typography} from "components/ui";
import {QrCodeScanner} from "components/ui/icons";
import PalletService from "../../hooks/PalletService";
import pl from "../../i18n/translate";
import {PalletScanResponseDto} from "./model/Pallet";
import {palletErrorLabel, palletErrorMessage, palletStatusLabel, shipmentIdValue} from "./palletLabels";
import {AppTabDefinition} from "../AppShell/types";
import {palletDetailsTab} from "./palletNavigation";
import "./styles/pallets.css";

type ScanState = "idle" | "scanning" | "loaded" | "alreadyLoaded" | "partial" | "rejected" | "error";

const scanSeverity: Record<Exclude<ScanState, "idle">, "success" | "warning" | "error" | "info"> = {
    scanning: "info",
    loaded: "success",
    alreadyLoaded: "success",
    partial: "warning",
    rejected: "error",
    error: "error",
};

export const resolveScanState = (response: PalletScanResponseDto): ScanState => {
    if (response.success) {
        return response.alreadyLoaded ? "alreadyLoaded" : "loaded";
    }
    return response.shipments.length ? "partial" : "rejected";
};

type PalletScannerProps = {
    onOpenTab?: (tab: AppTabDefinition) => void;
};

function PalletScanner({onOpenTab}: PalletScannerProps) {
    const translations = pl.pallets.scanner;
    const inputRef = useRef<HTMLInputElement>(null);
    const [trackingNumber, setTrackingNumber] = useState("");
    const [state, setState] = useState<ScanState>("idle");
    const [errorDescription, setErrorDescription] = useState<string | null>(null);
    const [scanResponse, setScanResponse] = useState<PalletScanResponseDto | null>(null);

    const focusInput = () => window.setTimeout(() => inputRef.current?.focus(), 0);

    const scanPallet = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalizedTrackingNumber = trackingNumber.trim().toUpperCase();
        if (!normalizedTrackingNumber || state === "scanning") {
            if (!normalizedTrackingNumber) {
                setState("error");
                setErrorDescription(translations.validation.trackingNumberRequired);
            }
            return;
        }

        setState("scanning");
        setErrorDescription(null);
        try {
            const response = await PalletService.scan(normalizedTrackingNumber);
            setScanResponse(response.data);
            setState(resolveScanState(response.data));
            setErrorDescription(palletErrorLabel(response.data.errorCode) || response.data.errorMessage || null);
            setTrackingNumber("");
        } catch (error) {
            setScanResponse(null);
            setState("error");
            setErrorDescription(palletErrorMessage(error, translations.feedback.error));
        } finally {
            focusInput();
        }
    };

    const loadedCount = scanResponse?.shipments.filter((shipment) => shipment.success).length || 0;

    return (
        <main className="pallet-page">
            <div className="pallet-shell">
                <section className="pallet-header">
                    <div className="pallet-title">
                        <span className="pallet-title-icon"><QrCodeScanner /></span>
                        <div>
                            <Typography variant="h4">{translations.title}</Typography>
                            <p>{translations.subtitle}</p>
                        </div>
                    </div>
                </section>

                <section className="pallet-grid">
                    <div className="pallet-panel">
                        <form className="pallet-scan-form" onSubmit={scanPallet}>
                            <TextField
                                autoComplete="off"
                                autoFocus
                                disabled={state === "scanning"}
                                inputProps={{ref: inputRef}}
                                label={translations.inputLabel}
                                placeholder={translations.placeholder}
                                size="small"
                                value={trackingNumber}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTrackingNumber(event.target.value)}
                            />
                            <Button disabled={state === "scanning"} startIcon={<QrCodeScanner />} type="submit">
                                {translations.submit}
                            </Button>
                        </form>

                        {state === "idle" ? (
                            <p className="pallet-hint">{translations.feedback.idle}</p>
                        ) : (
                            <Alert className="pallet-feedback" severity={scanSeverity[state]}>
                                <strong>{translations.feedback[state]}</strong>
                                {errorDescription ? <span className="pallet-feedback-detail">{errorDescription}</span> : null}
                            </Alert>
                        )}

                        <div className="pallet-table-wrap">
                            <table className="pallet-table">
                                <thead>
                                    <tr>
                                        <th>{translations.columns.shipmentId}</th>
                                        <th>{translations.columns.status}</th>
                                        <th>{translations.columns.result}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scanResponse?.shipments.length ? scanResponse.shipments.map((shipment) => (
                                        <tr key={shipmentIdValue(shipment.shipmentId)}>
                                            <td className="pallet-code">{shipmentIdValue(shipment.shipmentId)}</td>
                                            <td>{shipment.shipmentStatus
                                                ? pl.shipments.status[shipment.shipmentStatus as keyof typeof pl.shipments.status] || shipment.shipmentStatus
                                                : pl.common.dash}</td>
                                            <td>
                                                {shipment.success
                                                    ? <Chip color="success" label={translations.shipmentLoaded} size="small" />
                                                    : <span>{shipment.errorMessage || translations.shipmentFailed}</span>}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td className="pallet-empty" colSpan={3}>{translations.noShipments}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="pallet-panel">
                        <div className="pallet-panel-header">
                            <div>
                                <Typography variant="h5">{translations.resultTitle}</Typography>
                                <p>{scanResponse
                                    ? translations.resultSummary
                                        .replace("{loaded}", String(loadedCount))
                                        .replace("{total}", String(scanResponse.shipments.length))
                                    : translations.resultEmpty}</p>
                            </div>
                        </div>
                        {scanResponse ? (
                            <div className="pallet-summary">
                                <div className="pallet-summary-item">
                                    <span>{pl.pallets.summary.trackingNumber}</span>
                                    <strong className="pallet-tracking-number">{scanResponse.trackingNumber}</strong>
                                </div>
                                <div className="pallet-summary-item">
                                    <span>{pl.pallets.summary.status}</span>
                                    <strong>{palletStatusLabel(scanResponse.palletStatus)}</strong>
                                </div>
                            </div>
                        ) : null}
                        {scanResponse?.palletId && onOpenTab ? (
                            <div className="pallet-actions">
                                <Button variant="outlined" onClick={() => onOpenTab(palletDetailsTab(scanResponse.trackingNumber))}>
                                    {translations.openPallet}
                                </Button>
                            </div>
                        ) : null}
                        <p className="pallet-hint">{translations.asyncHint}</p>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default PalletScanner;
