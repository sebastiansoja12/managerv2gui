import http from "../http-common";
import {
    CurrentUserDevicePairRequest,
    DeviceCreateRequest,
    DeviceDto,
    DevicePairResponseDto,
} from "../components/Devices/dto/DeviceDto";

const currentUserDevices = () => {
    return http.get<DeviceDto[]>("/devices/current-user");
};

const pairCurrentUserDevice = (request: CurrentUserDevicePairRequest) => {
    return http.post<DevicePairResponseDto>("/devices/current-user/pairings", request);
};

const createDevice = (request: DeviceCreateRequest) => {
    return http.post<void>("/devices", request);
};

const DeviceService = {
    currentUserDevices,
    pairCurrentUserDevice,
    createDevice,
};

export default DeviceService;
