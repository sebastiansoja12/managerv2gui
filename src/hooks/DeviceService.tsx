import http from "../http-common";
import {
    DeviceActivationCodeResponseDto,
    DeviceActivationRequest,
    DeviceActivationResponseDto,
    DeviceCreateRequest,
    DeviceDto,
    DeviceHeartbeatRequest,
    DeviceHeartbeatResponseDto,
    DeviceOperatorSessionResponseDto,
    DeviceOwnershipUpdateRequest,
} from "../components/Devices/dto/DeviceDto";

const HEADER_DEVICE_PAIR_KEY = "X-DEVICE-PAIR-KEY";

const pairKeyHeaders = (pairKey: string) => ({headers: {[HEADER_DEVICE_PAIR_KEY]: pairKey}});

const currentUserDevices = () => {
    return http.get<DeviceDto[]>("/devices/current-user");
};

const createDevice = (request: DeviceCreateRequest) => {
    return http.post<void>("/devices", request);
};

const allDevices = () => {
    return http.get<DeviceDto[]>("/devices");
};

const issueActivationCode = (deviceId: string) => {
    return http.post<DeviceActivationCodeResponseDto>(`/devices/${encodeURIComponent(deviceId)}/activation-codes`);
};

const revokePairing = (deviceId: string) => {
    return http.delete<void>(`/devices/${encodeURIComponent(deviceId)}/pairings`);
};

const updateOwnership = (deviceId: string, request: DeviceOwnershipUpdateRequest) => {
    return http.put<void>(`/devices/${encodeURIComponent(deviceId)}/ownerships`, request);
};

const issuePairingCode = () => {
    return http.post<DeviceActivationCodeResponseDto>("/devices/current-user/pairing-codes");
};

const activateDevice = (request: DeviceActivationRequest) => {
    return http.post<DeviceActivationResponseDto>("/internal/device-activations", request);
};

const startOperatorSession = (pairKey: string) => {
    return http.post<DeviceOperatorSessionResponseDto>("/devices/current-user/sessions", undefined, pairKeyHeaders(pairKey));
};

const endOperatorSession = (pairKey: string) => {
    return http.delete<void>("/devices/current-user/sessions", pairKeyHeaders(pairKey));
};

const heartbeat = (pairKey: string, request: DeviceHeartbeatRequest) => {
    return http.post<DeviceHeartbeatResponseDto>("/internal/device-pairing-verifications/heartbeats", request,
        pairKeyHeaders(pairKey));
};

const DeviceService = {
    currentUserDevices,
    createDevice,
    allDevices,
    issueActivationCode,
    revokePairing,
    updateOwnership,
    issuePairingCode,
    activateDevice,
    startOperatorSession,
    endOperatorSession,
    heartbeat,
};

export default DeviceService;
