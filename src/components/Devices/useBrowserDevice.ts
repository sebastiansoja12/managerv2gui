import {useCallback, useEffect, useRef, useState} from "react";
import axios from "axios";
import DeviceService from "../../hooks/DeviceService";
import {getBackendErrorMessage} from "../../api/errorMessage";
import pl from "../../i18n/translate";
import {
    BrowserDevice,
    browserInstallationId,
    clearBrowserDevice,
    readBrowserDevice,
    saveBrowserDevice,
    toBrowserDevice,
} from "./browserDeviceStore";

export type BrowserDeviceStatus = "inactive" | "starting" | "ready" | "error";

const BROWSER_APP_VERSION = process.env.REACT_APP_VERSION || "web";

export const isDeviceCredentialFault = (message: string) => (
    /pair key|invalid device credentials|device.*(not found|inactive|not active)/i.test(message)
);

export const isOperatorSessionFault = (message: string) => /no operator signed in/i.test(message);

const isUnauthorized = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 401;

export function useBrowserDevice() {
    const translations = pl.shipmentScanner.device;
    const [device, setDevice] = useState<BrowserDevice | null>(() => readBrowserDevice());
    const [status, setStatus] = useState<BrowserDeviceStatus>(device ? "starting" : "inactive");
    const [sessionExpiresAt, setSessionExpiresAt] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activating, setActivating] = useState(false);
    const initialDevice = useRef(device);

    const forget = useCallback((message: string | null) => {
        clearBrowserDevice();
        setDevice(null);
        setSessionExpiresAt(null);
        setStatus("inactive");
        setError(message);
    }, []);

    const startSession = useCallback(async (current: BrowserDevice) => {
        setStatus("starting");
        setError(null);
        try {
            const response = await DeviceService.startOperatorSession(current.pairKey);
            const refreshed = toBrowserDevice(response.data.device, current.pairKey);
            saveBrowserDevice(refreshed);
            setDevice(refreshed);
            setSessionExpiresAt(response.data.sessionExpiresAt);
            setStatus("ready");
        } catch (exception) {
            if (isUnauthorized(exception)) {
                forget(translations.credentialsRevoked);
                return;
            }
            setStatus("error");
            setError(getBackendErrorMessage(exception, translations.sessionError));
        }
    }, [forget, translations.credentialsRevoked, translations.sessionError]);

    useEffect(() => {
        const storedDevice = initialDevice.current;
        if (!storedDevice) {
            return;
        }
        DeviceService.heartbeat(storedDevice.pairKey, {
            version: BROWSER_APP_VERSION,
            manufacturer: null,
            model: null,
            osName: null,
            osVersion: null,
        }).catch(() => undefined);
        startSession(storedDevice);
    }, [startSession]);

    const activate = useCallback(async (activationCode?: string) => {
        setActivating(true);
        setError(null);
        try {
            const code = activationCode?.trim() || (await DeviceService.issuePairingCode()).data.activationCode;
            const response = await DeviceService.activateDevice({
                activationCode: code,
                installationId: browserInstallationId(),
                deviceType: "SCANNER",
                appVersion: BROWSER_APP_VERSION,
            });
            const activated = toBrowserDevice(response.data.device, response.data.pairKey);
            saveBrowserDevice(activated);
            setDevice(activated);
            await startSession(activated);
        } catch (exception) {
            setStatus("inactive");
            setError(isUnauthorized(exception)
                ? translations.activationError
                : getBackendErrorMessage(exception, translations.activationError));
        } finally {
            setActivating(false);
        }
    }, [startSession, translations.activationError]);

    const deregister = useCallback(async () => {
        if (device) {
            await DeviceService.endOperatorSession(device.pairKey).catch(() => undefined);
        }
        forget(null);
    }, [device, forget]);

    const handleFault = useCallback((message: string) => {
        if (isDeviceCredentialFault(message)) {
            forget(translations.credentialsRevoked);
            return;
        }
        if (isOperatorSessionFault(message) && device) {
            startSession(device);
        }
    }, [device, forget, startSession, translations.credentialsRevoked]);

    return {
        device,
        status,
        sessionExpiresAt,
        error,
        activating,
        activate,
        retrySession: () => device && startSession(device),
        deregister,
        handleFault,
    };
}
