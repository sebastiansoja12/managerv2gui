import http from "../http-common";

export type PublicMaintenanceStatus = {
    enabled: boolean;
    message?: string | null;
};

const getPublicStatus = () => (
    http.get<PublicMaintenanceStatus>("/maintenance").then((response) => response.data)
);

const MaintenanceService = {
    getPublicStatus,
};

export default MaintenanceService;
