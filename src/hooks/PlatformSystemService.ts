import http from "../http-super-admin";
import {
    ChangeMaintenanceModeRequest,
    MaintenanceMode,
    SystemStatus,
} from "../components/SuperAdmin/system/model/SystemStatus";

const getStatus = () => http.get<SystemStatus>("/platform/system/status").then((response) => response.data);

const getMaintenance = () => (
    http.get<MaintenanceMode>("/platform/system/maintenance").then((response) => response.data)
);

const updateMaintenance = (request: ChangeMaintenanceModeRequest) => (
    http.put<MaintenanceMode>("/platform/system/maintenance", request).then((response) => response.data)
);

const PlatformSystemService = {
    getStatus,
    getMaintenance,
    updateMaintenance,
};

export default PlatformSystemService;
