import React, {FormEvent, useEffect, useMemo, useRef, useState} from "react";
import {
    AccessTime,
    CheckCircleOutline,
    DocumentScanner,
    ErrorOutline,
    Inventory2Outlined,
    Loop,
    QrCodeScanner,
    SettingsOutlined,
    WarningAmberOutlined,
} from "components/ui/icons";
import pl from "../../i18n/translate";
import "./styles/shipment-scanner.css";

type ScanStatus = "ready" | "loading" | "success" | "error" | "duplicate";

type MockShipment = {
    code: string;
    recipient: string;
    destination: string;
    shipmentStatus: string;
};

type ScanRecord = {
    code: string;
    destination: string;
    message: string;
    recipient?: string;
    scannedAt: string;
    status: Exclude<ScanStatus, "ready" | "loading">;
};

const mockShipments: Record<string, MockShipment> = {
    "FTM-2026-001284": {
        code: "FTM-2026-001284",
        recipient: "Jan Kowalski",
        destination: "Warszawa",
        shipmentStatus: "accepted",
    },
    "FTM-2026-001283": {
        code: "FTM-2026-001283",
        recipient: "Katarzyna Nowak",
        destination: "Krakow",
        shipmentStatus: "accepted",
    },
    "FTM-2026-001281": {
        code: "FTM-2026-001281",
        recipient: "Adam Zielinski",
        destination: "Gdansk",
        shipmentStatus: "accepted",
    },
    "FTM-2026-001280": {
        code: "FTM-2026-001280",
        recipient: "Marta Wisniewska",
        destination: "Poznan",
        shipmentStatus: "accepted",
    },
};

const initialRecords: ScanRecord[] = [
    {code: "FTM-2026-001284", destination: "Warszawa", message: "success", recipient: "Jan Kowalski", scannedAt: "14:32:08", status: "success"},
    {code: "FTM-2026-001283", destination: "Krakow", message: "success", recipient: "Katarzyna Nowak", scannedAt: "14:31:54", status: "success"},
    {code: "FTM-2026-001282", destination: "alreadyScanned", message: "duplicate", scannedAt: "14:31:41", status: "duplicate"},
    {code: "FTM-2026-001281", destination: "Gdansk", message: "success", recipient: "Adam Zielinski", scannedAt: "14:31:12", status: "success"},
    {code: "BAD-CODE", destination: "invalidCode", message: "invalidCode", scannedAt: "14:30:58", status: "error"},
];

const initiallyScannedCodes = new Set(initialRecords
    .filter((record) => record.status === "success")
    .map((record) => record.code));

const formatScanTime = () => new Date().toLocaleTimeString(pl.common.locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
});

const normalizeCode = (value: string) => value.trim().toUpperCase();

const isInvalidCode = (code: string) => !code || code.length < 6 || !/^[A-Z0-9-]+$/.test(code);

const fallbackShipment = (code: string): MockShipment => {
    const destinations = ["Wroclaw", "Lodz", "Szczecin", "Lublin", "Katowice"];
    const recipients = ["Piotr Mazur", "Anna Wozniak", "Tomasz Lewandowski", "Ewa Kaminska", "Michal Dabrowski"];
    const index = Math.abs(code.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0)) % destinations.length;

    return {
        code,
        recipient: recipients[index],
        destination: destinations[index],
        shipmentStatus: "accepted",
    };
};

function ShipmentScanner() {
    const inputRef = useRef<HTMLInputElement>(null);
    const feedbackTimerRef = useRef<number>();
    const processingTimerRef = useRef<number>();
    const [inputValue, setInputValue] = useState("");
    const [scanState, setScanState] = useState<ScanStatus>("ready");
    const [lastRecord, setLastRecord] = useState<ScanRecord>();
    const [recentRecords, setRecentRecords] = useState<ScanRecord[]>(initialRecords);
    const [sessionCount, setSessionCount] = useState(24);
    const [scannedCodes, setScannedCodes] = useState<Set<string>>(initiallyScannedCodes);

    const scannerTranslations = pl.shipmentScanner;

    const successfulRecords = useMemo(
        () => recentRecords.filter((record) => record.status === "success").length,
        [recentRecords],
    );

    const focusInput = () => {
        window.setTimeout(() => inputRef.current?.focus(), 0);
    };

    useEffect(() => {
        focusInput();

        return () => {
            if (feedbackTimerRef.current) {
                window.clearTimeout(feedbackTimerRef.current);
            }
            if (processingTimerRef.current) {
                window.clearTimeout(processingTimerRef.current);
            }
        };
    }, []);

    const clearFeedbackLater = () => {
        if (feedbackTimerRef.current) {
            window.clearTimeout(feedbackTimerRef.current);
        }

        feedbackTimerRef.current = window.setTimeout(() => {
            setScanState("ready");
            setLastRecord(undefined);
            focusInput();
        }, 2800);
    };

    const pushRecord = (record: ScanRecord) => {
        setRecentRecords((currentRecords) => [record, ...currentRecords].slice(0, 8));
        setLastRecord(record);
    };

    const registerScanResult = (code: string) => {
        const scannedAt = formatScanTime();

        if (isInvalidCode(code)) {
            const record: ScanRecord = {
                code: code || scannerTranslations.fallbackCode,
                destination: "invalidCode",
                message: "invalidCode",
                scannedAt,
                status: "error",
            };
            setScanState("error");
            pushRecord(record);
            clearFeedbackLater();
            return;
        }

        if (code.includes("404") || code.includes("NOTFOUND")) {
            const record: ScanRecord = {
                code,
                destination: "notFound",
                message: "notFound",
                scannedAt,
                status: "error",
            };
            setScanState("error");
            pushRecord(record);
            clearFeedbackLater();
            return;
        }

        if (code.includes("ERR") || code.includes("500")) {
            const record: ScanRecord = {
                code,
                destination: "cannotRegister",
                message: "cannotRegister",
                scannedAt,
                status: "error",
            };
            setScanState("error");
            pushRecord(record);
            clearFeedbackLater();
            return;
        }

        if (scannedCodes.has(code)) {
            const record: ScanRecord = {
                code,
                destination: "alreadyScanned",
                message: "duplicate",
                scannedAt,
                status: "duplicate",
            };
            setScanState("duplicate");
            pushRecord(record);
            clearFeedbackLater();
            return;
        }

        const shipment = mockShipments[code] || fallbackShipment(code);
        const record: ScanRecord = {
            code: shipment.code,
            destination: shipment.destination,
            message: "success",
            recipient: shipment.recipient,
            scannedAt,
            status: "success",
        };

        setScannedCodes((currentCodes) => new Set(currentCodes).add(code));
        setSessionCount((currentCount) => currentCount + 1);
        setScanState("success");
        pushRecord(record);
        clearFeedbackLater();
    };

    const submitScan = (event?: FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        if (scanState === "loading") {
            return;
        }

        const code = normalizeCode(inputValue);
        setInputValue("");
        setLastRecord(undefined);
        setScanState("loading");

        if (processingTimerRef.current) {
            window.clearTimeout(processingTimerRef.current);
        }

        processingTimerRef.current = window.setTimeout(() => {
            registerScanResult(code);
            focusInput();
        }, 520);
    };

    const feedbackIcon = () => {
        if (scanState === "loading") {
            return <Loop />;
        }
        if (scanState === "success") {
            return <CheckCircleOutline />;
        }
        if (scanState === "duplicate") {
            return <WarningAmberOutlined />;
        }
        if (scanState === "error") {
            return <ErrorOutline />;
        }
        return <QrCodeScanner />;
    };

    const feedbackTitle = () => {
        if (scanState === "loading") {
            return scannerTranslations.feedback.loading;
        }
        if (!lastRecord) {
            return scannerTranslations.feedback.readyTitle;
        }
        return scannerTranslations.feedback[lastRecord.message as keyof typeof scannerTranslations.feedback] || scannerTranslations.feedback.cannotRegister;
    };

    const feedbackDescription = () => {
        if (scanState === "loading") {
            return scannerTranslations.feedback.loadingDescription;
        }
        if (!lastRecord) {
            return scannerTranslations.feedback.readyDescription;
        }
        return lastRecord.code;
    };

    const recordMessage = (record: ScanRecord) => scannerTranslations.feedback[record.message as keyof typeof scannerTranslations.feedback]
        || record.destination;

    const recordDestination = (record: ScanRecord) => scannerTranslations.recordDestinations[record.destination as keyof typeof scannerTranslations.recordDestinations]
        || record.destination;

    return (
        <main className="shipment-scanner-page" onClick={focusInput}>
            <section className="shipment-scanner-header">
                <div className="shipment-scanner-heading">
                    <span className="shipment-scanner-kicker">
                        <SettingsOutlined fontSize="small" />
                        {scannerTranslations.page.kicker}
                    </span>
                    <h1>{scannerTranslations.page.title}</h1>
                    <p>{scannerTranslations.page.subtitle}</p>
                </div>
                <div className="shipment-scanner-status">
                    <span />
                    {scannerTranslations.page.readyStatus}
                </div>
            </section>

            <section className="shipment-scanner-layout">
                <div className="shipment-scanner-main-card">
                    <div className="shipment-scanner-card-icon">
                        <QrCodeScanner />
                    </div>
                    <div className="shipment-scanner-card-copy">
                        <h2>{scannerTranslations.scanCard.title}</h2>
                        <p>{scannerTranslations.scanCard.description}</p>
                    </div>

                    <form className="shipment-scanner-form" onSubmit={submitScan}>
                        <div className="shipment-scanner-input-shell">
                            <DocumentScanner />
                            <input
                                aria-label={scannerTranslations.scanCard.inputLabel}
                                disabled={scanState === "loading"}
                                placeholder={scannerTranslations.scanCard.placeholder}
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(event) => setInputValue(event.target.value)}
                                onBlur={focusInput}
                            />
                        </div>
                        <button disabled={scanState === "loading"} type="submit">
                            {scanState === "loading" ? scannerTranslations.scanCard.processing : scannerTranslations.scanCard.submit}
                        </button>
                    </form>

                    <div className={`shipment-scanner-feedback shipment-scanner-feedback-${scanState}`}>
                        <span className="shipment-scanner-feedback-icon">{feedbackIcon()}</span>
                        <div>
                            <strong>{feedbackTitle()}</strong>
                            <span>{feedbackDescription()}</span>
                        </div>
                    </div>

                    {lastRecord?.status === "success" ? (
                        <dl className="shipment-scanner-result-grid">
                            <div>
                                <dt>{scannerTranslations.result.recipient}</dt>
                                <dd>{lastRecord.recipient}</dd>
                            </div>
                            <div>
                                <dt>{scannerTranslations.result.destination}</dt>
                                <dd>{recordDestination(lastRecord)}</dd>
                            </div>
                            <div>
                                <dt>{scannerTranslations.result.status}</dt>
                                <dd>{scannerTranslations.result.accepted}</dd>
                            </div>
                            <div>
                                <dt>{scannerTranslations.result.time}</dt>
                                <dd>{lastRecord.scannedAt}</dd>
                            </div>
                        </dl>
                    ) : null}
                </div>

                <aside className="shipment-scanner-side">
                    <div className="shipment-scanner-side-header">
                        <div>
                            <span>{scannerTranslations.recent.kicker}</span>
                            <h2>{scannerTranslations.recent.title}</h2>
                        </div>
                        <strong>{scannerTranslations.recent.count.replace("{count}", String(sessionCount))}</strong>
                    </div>

                    <div className="shipment-scanner-mini-stats">
                        <div>
                            <Inventory2Outlined fontSize="small" />
                            <span>{scannerTranslations.recent.visibleSuccess}</span>
                            <strong>{successfulRecords}</strong>
                        </div>
                        <div>
                            <AccessTime fontSize="small" />
                            <span>{scannerTranslations.recent.lastScan}</span>
                            <strong>{recentRecords[0]?.scannedAt || pl.common.dash}</strong>
                        </div>
                    </div>

                    <ol className="shipment-scanner-recent-list">
                        {recentRecords.map((record, index) => (
                            <li className={`shipment-scanner-record shipment-scanner-record-${record.status}`} key={`${record.code}-${record.scannedAt}-${index}`}>
                                <span className="shipment-scanner-record-icon">
                                    {record.status === "success" ? <CheckCircleOutline /> : record.status === "duplicate" ? <WarningAmberOutlined /> : <ErrorOutline />}
                                </span>
                                <div>
                                    <strong>{record.code}</strong>
                                    <span>{record.status === "success" ? recordDestination(record) : recordMessage(record)}</span>
                                </div>
                                <time>{record.scannedAt}</time>
                            </li>
                        ))}
                    </ol>

                    <div className="shipment-scanner-help">
                        <strong>{scannerTranslations.help.title}</strong>
                        <span>{scannerTranslations.help.description}</span>
                    </div>
                </aside>
            </section>
        </main>
    );
}

export default ShipmentScanner;
