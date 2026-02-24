import http from "../http-common";
import {
    CurrentUserDevicePairRequest,
    DeviceDto,
    DevicePairResponseDto,
} from "../components/Devices/dto/DeviceDto";

const currentUserDevices = () => {
    return http.get<DeviceDto[]>("/devices/current-user");
};

const pairCurrentUserDevice = (request: CurrentUserDevicePairRequest) => {
    return http.post<DevicePairResponseDto>("/devices/current-user/pairings", request);
};

const DeviceService = {
    currentUserDevices,
    pairCurrentUserDevice,
};

export default DeviceService;
