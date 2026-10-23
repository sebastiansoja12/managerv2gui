import {DEVICE_ACTIVATION_QR_TYPE} from "./dto/DeviceDto";

export type DeviceActivationQrPayload = {
    type: typeof DEVICE_ACTIVATION_QR_TYPE;
    serverUrl: string;
    activationCode: string;
};

export const resolveActivationServerUrl = (configuredUrl: string | undefined, origin: string): string => {
    const absoluteUrl = new URL(configuredUrl || "/", origin).toString();
    return absoluteUrl.replace(/\/+$/, "");
};

export const buildActivationQrPayload = (activationCode: string, serverUrl: string): DeviceActivationQrPayload => ({
    type: DEVICE_ACTIVATION_QR_TYPE,
    serverUrl,
    activationCode,
});
