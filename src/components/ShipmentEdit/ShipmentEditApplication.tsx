import React, {FormEvent, useCallback, useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {Alert, Button, Chip, MenuItem, TextField, Typography} from "components/ui";
import {CheckCircleOutline, LocalShipping, Refresh, Save, Send} from "components/ui/icons";
import ShipmentEditService from "../../hooks/ShipmentEditService";
import {ApiErrorResponse} from "../../api/ApiResult";
import pl from "../../i18n/translate";
import {countryCodes} from "../Shipment/dto/ShipmentDto";
import {
    ShipmentEditDetails,
    ShipmentEditParty,
    shipmentEditPartyFields,
    ShipmentEditSummary,
    ShipmentEditTokenIssued,
} from "./dto/ShipmentEdit";
import "./styles/shipment-edit.css";

type ShipmentEditStep = "summary" | "token" | "edit" | "done";

type PartyType = "sender" | "recipient";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const resolveShipmentEditError = (error: unknown): string => {
    const apiError = error as ApiErrorResponse;
    const messages = pl.shipmentEdit.errors;
    switch (apiError?.status) {
        case 400:
            return apiError.message && apiError.message !== "Backend request failed" ? apiError.message : messages.validation;
        case 403:
            return messages.invalidToken;
        case 404:
            return messages.notFound;
        case 409:
            return messages.notEditable;
        case 410:
            return messages.tokenExpired;
        case 422:
            return messages.missingEmail;
        case 429:
            return messages.attemptsExceeded;
        default:
            return messages.generic;
    }
};

export const validateShipmentEditParty = (party: ShipmentEditParty): Array<keyof ShipmentEditParty> => (
    shipmentEditPartyFields.filter((field) => {
        const value = party[field]?.trim() || "";
        if (!value) {
            return true;
        }
        if (field === "email") {
            return !EMAIL_PATTERN.test(value);
        }
        if (field === "countryCode") {
            return !(countryCodes as readonly string[]).includes(value);
        }
        return false;
    })
);

const statusLabel = (status: string) => pl.shipments.status[status as keyof typeof pl.shipments.status] || status;

function TrackingNumberLookup() {
    const navigate = useNavigate();
    const [trackingNumber, setTrackingNumber] = useState("");

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (trackingNumber.trim()) {
            navigate(`/shipment-edit/${encodeURIComponent(trackingNumber.trim())}`);
        }
    };

    return (
        <form className="shipment-edit-form" onSubmit={submit}>
            <TextField
                label={pl.shipmentEdit.lookup.trackingNumber}
                value={trackingNumber}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTrackingNumber(event.target.value)}
            />
            <Button disabled={!trackingNumber.trim()} type="submit" variant="contained">
                {pl.shipmentEdit.lookup.submit}
            </Button>
        </form>
    );
}

function ShipmentEditApplication() {
    const {trackingNumber = ""} = useParams<{trackingNumber: string}>();
    const translations = pl.shipmentEdit;
    const [step, setStep] = useState<ShipmentEditStep>("summary");
    const [summary, setSummary] = useState<ShipmentEditSummary | null>(null);
    const [tokenIssued, setTokenIssued] = useState<ShipmentEditTokenIssued | null>(null);
    const [token, setToken] = useState("");
    const [details, setDetails] = useState<ShipmentEditDetails | null>(null);
    const [sender, setSender] = useState<ShipmentEditParty | null>(null);
    const [recipient, setRecipient] = useState<ShipmentEditParty | null>(null);
    const [invalidFields, setInvalidFields] = useState<Record<PartyType, Array<keyof ShipmentEditParty>>>({
        sender: [],
        recipient: [],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const loadSummary = useCallback(async () => {
        if (!trackingNumber) {
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await ShipmentEditService.getShipment(trackingNumber);
            setSummary(response.data);
        } catch (loadError) {
            setError(resolveShipmentEditError(loadError));
        } finally {
            setLoading(false);
        }
    }, [trackingNumber]);

    useEffect(() => {
        setStep("summary");
        setSummary(null);
        setDetails(null);
        setToken("");
        loadSummary();
    }, [loadSummary]);

    const requestToken = async () => {
        setLoading(true);
        setError(null);
        setNotice(null);
        try {
            const response = await ShipmentEditService.requestToken(trackingNumber);
            setTokenIssued(response.data);
            setToken("");
            setStep("token");
            setNotice(translations.token.sent.replace("{email}", response.data.maskedEmail || ""));
        } catch (requestError) {
            setError(resolveShipmentEditError(requestError));
        } finally {
            setLoading(false);
        }
    };

    const verifyToken = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!/^\d{6}$/.test(token.trim())) {
            setError(translations.errors.tokenFormat);
            return;
        }
        setLoading(true);
        setError(null);
        setNotice(null);
        try {
            const response = await ShipmentEditService.verifyToken(trackingNumber, token.trim());
            setDetails(response.data);
            setSender(response.data.sender);
            setRecipient(response.data.recipient);
            setInvalidFields({sender: [], recipient: []});
            setStep("edit");
        } catch (verifyError) {
            setError(resolveShipmentEditError(verifyError));
        } finally {
            setLoading(false);
        }
    };

    const updateParty = (partyType: PartyType, field: keyof ShipmentEditParty, value: string) => {
        const update = (party: ShipmentEditParty | null) => (party ? {...party, [field]: value} : party);
        if (partyType === "sender") {
            setSender(update);
        } else {
            setRecipient(update);
        }
    };

    const saveShipment = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!sender || !recipient) {
            return;
        }
        const nextInvalidFields = {
            sender: validateShipmentEditParty(sender),
            recipient: validateShipmentEditParty(recipient),
        };
        setInvalidFields(nextInvalidFields);
        if (nextInvalidFields.sender.length || nextInvalidFields.recipient.length) {
            setError(translations.errors.validation);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await ShipmentEditService.updateShipment(trackingNumber, {
                token: token.trim(),
                sender,
                recipient,
            });
            setStep("done");
        } catch (saveError) {
            setError(resolveShipmentEditError(saveError));
        } finally {
            setLoading(false);
        }
    };

    const renderParty = (partyType: PartyType, party: ShipmentEditParty) => (
        <fieldset className="shipment-edit-party">
            <legend>{translations.form[partyType]}</legend>
            <div className="shipment-edit-grid">
                {shipmentEditPartyFields.map((field) => field === "countryCode" ? (
                    <TextField
                        key={field}
                        select
                        required
                        error={invalidFields[partyType].includes(field)}
                        id={`shipment-edit-${partyType}-${field}`}
                        label={translations.fields[field]}
                        value={party[field] || ""}
                        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => updateParty(partyType, field, event.target.value)}
                    >
                        {countryCodes.map((countryCode) => (
                            <MenuItem key={countryCode} value={countryCode}>{countryCode}</MenuItem>
                        ))}
                    </TextField>
                ) : (
                    <TextField
                        key={field}
                        required
                        error={invalidFields[partyType].includes(field)}
                        id={`shipment-edit-${partyType}-${field}`}
                        label={translations.fields[field]}
                        type={field === "email" ? "email" : "text"}
                        value={party[field] || ""}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateParty(partyType, field, event.target.value)}
                    />
                ))}
            </div>
        </fieldset>
    );

    return (
        <main className="shipment-edit-page login-page grid min-h-screen place-items-center bg-background px-4 py-10">
            <section className={`shipment-edit-card login-card rounded-3xl border border-border bg-card p-6 text-left shadow-floating sm:p-8 ${step === "edit" ? "shipment-edit-card-wide" : ""}`}>
                <header className="shipment-edit-header">
                    <span className="shipment-edit-brand"><LocalShipping /></span>
                    <div>
                        <Typography component="h1" variant="h4">{translations.page.title}</Typography>
                        <p>{translations.page.subtitle}</p>
                    </div>
                </header>

                {!trackingNumber ? <TrackingNumberLookup /> : (
                    <>
                        <div className="shipment-edit-meta">
                            <span>{translations.page.trackingNumber}</span>
                            <code>{trackingNumber}</code>
                            {summary || details ? (
                                <Chip
                                    color={(details || summary)?.reroutable ? "success" : "warning"}
                                    label={statusLabel((details || summary)!.status)}
                                    size="small"
                                />
                            ) : null}
                        </div>

                        {error ? <Alert severity="error">{error}</Alert> : null}
                        {notice ? <Alert severity="info">{notice}</Alert> : null}
                        {loading && !summary ? <p className="shipment-edit-hint">{translations.page.loading}</p> : null}

                        {step === "summary" && summary ? (
                            summary.reroutable ? (
                                <div className="shipment-edit-step">
                                    <p>{translations.summary.description}</p>
                                    {summary.maskedEmail ? (
                                        <p className="shipment-edit-hint">
                                            {translations.summary.emailHint.replace("{email}", summary.maskedEmail)}
                                        </p>
                                    ) : null}
                                    <Button disabled={loading} startIcon={<Send />} variant="contained" onClick={requestToken}>
                                        {translations.summary.requestToken}
                                    </Button>
                                </div>
                            ) : (
                                <Alert severity="warning">{translations.summary.notEditable}</Alert>
                            )
                        ) : null}

                        {step === "token" ? (
                            <form className="shipment-edit-form" onSubmit={verifyToken}>
                                <TextField
                                    autoComplete="one-time-code"
                                    autoFocus
                                    helperText={tokenIssued?.expiresAt
                                        ? translations.token.validUntil.replace("{time}",
                                            new Date(tokenIssued.expiresAt).toLocaleTimeString(pl.common.locale, {hour: "2-digit", minute: "2-digit"}))
                                        : undefined}
                                    inputProps={{inputMode: "numeric", maxLength: 6}}
                                    label={translations.token.label}
                                    value={token}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setToken(event.target.value.replace(/\D/g, ""))}
                                />
                                <div className="shipment-edit-actions">
                                    <Button disabled={loading} startIcon={<Refresh />} variant="outlined" onClick={requestToken}>
                                        {translations.token.resend}
                                    </Button>
                                    <Button disabled={loading || token.length !== 6} type="submit" variant="contained">
                                        {translations.token.submit}
                                    </Button>
                                </div>
                            </form>
                        ) : null}

                        {step === "edit" && sender && recipient ? (
                            <form className="shipment-edit-form" noValidate onSubmit={saveShipment}>
                                <p className="shipment-edit-hint">{translations.form.description}</p>
                                {renderParty("sender", sender)}
                                {renderParty("recipient", recipient)}
                                <div className="shipment-edit-actions">
                                    <Button disabled={loading} startIcon={<Save />} type="submit" variant="contained">
                                        {translations.form.submit}
                                    </Button>
                                </div>
                            </form>
                        ) : null}

                        {step === "done" ? (
                            <div className="shipment-edit-step shipment-edit-done">
                                <CheckCircleOutline />
                                <Typography component="h2" variant="h5">{translations.done.title}</Typography>
                                <p>{translations.done.description}</p>
                            </div>
                        ) : null}
                    </>
                )}
            </section>
        </main>
    );
}

export default ShipmentEditApplication;
