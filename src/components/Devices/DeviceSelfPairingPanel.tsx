import React, {useEffect, useState} from "react";
import QRCode from "qrcode";
import {Alert, Button, Typography} from "components/ui";
import {QrCode2, Refresh} from "components/ui/icons";
import DeviceService from "../../hooks/DeviceService";
import {getBackendErrorMessage} from "../../api/errorMessage";
import pl from "../../i18n/translate";
import {DeviceActivationCodeResponseDto} from "./dto/DeviceDto";
import {buildActivationQrPayload, resolveActivationServerUrl} from "./deviceActivationQr";

type PairingState = {
    code: DeviceActivationCodeResponseDto;
    qrCodeUrl: string;
};

const translations = pl.devices.selfPairing;

function DeviceSelfPairingPanel() {
    const [pairing, setPairing] = useState<PairingState | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [now, setNow] = useState(() => Date.now());

    const serverUrl = resolveActivationServerUrl(process.env.REACT_APP_SERVER_URL, window.location.origin);

    useEffect(() => {
        if (!pairing) {
            return undefined;
        }
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [pairing]);

    const generate = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await DeviceService.issuePairingCode();
            const payload = buildActivationQrPayload(response.data.activationCode, serverUrl);
            const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(payload), {
                errorCorrectionLevel: "M",
                margin: 1,
                width: 260,
            });
            setNow(Date.now());
            setPairing({code: response.data, qrCodeUrl});
        } catch (exception) {
            setError(getBackendErrorMessage(exception, translations.error));
        } finally {
            setLoading(false);
        }
    };

    const expired = pairing ? new Date(pairing.code.expiresAt).getTime() <= now : false;

    return (
        <section className="device-pairing-grid">
            <div className="device-pairing-panel">
                <Typography variant="h5">{translations.title}</Typography>
                <p>{translations.description}</p>
                <div className="device-pairing-form">
                    {error ? <Alert severity="error">{error}</Alert> : null}
                    <Button
                        disabled={loading}
                        startIcon={pairing ? <Refresh/> : <QrCode2/>}
                        variant="contained"
                        onClick={generate}
                    >
                        {pairing ? translations.regenerate : translations.generate}
                    </Button>
                    {pairing ? <p>{translations.nextStep}</p> : null}
                </div>
            </div>

            <div className="device-pairing-panel device-pairing-qr-panel">
                {pairing ? (
                    <>
                        {expired ? (
                            <Alert severity="warning">{translations.expired}</Alert>
                        ) : (
                            <img alt={translations.qrAlt} className="device-pairing-qr" src={pairing.qrCodeUrl}/>
                        )}
                        <div className="device-pairing-pair-details">
                            <span>{translations.code}</span>
                            <strong>{pairing.code.activationCode}</strong>
                        </div>
                        <div className="device-pairing-pair-details">
                            <span>{translations.serverUrl}</span>
                            <strong>{serverUrl}</strong>
                        </div>
                        <p>{translations.expiresAt.replace("{time}",
                            new Date(pairing.code.expiresAt).toLocaleTimeString(pl.common.locale))}</p>
                    </>
                ) : (
                    <div className="device-pairing-empty-qr">
                        <QrCode2/>
                        <span>{translations.generate}</span>
                    </div>
                )}
            </div>
        </section>
    );
}

export default DeviceSelfPairingPanel;
