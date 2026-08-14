import http from "../http-super-admin";
import {
    OperatorApiKey,
    OperatorDataErasure,
    OperatorDevice,
    OperatorOnboarding,
} from "../components/SuperAdmin/operators/model/OperatorOperations";

const operatorPath = (operatorId: string) => `/operators/${encodeURIComponent(operatorId)}`;

const getOnboarding = (operatorId: string) => (
    http.get<OperatorOnboarding>(`${operatorPath(operatorId)}/onboarding`).then((response) => response.data)
);

const getDevices = (operatorId: string) => (
    http.get<OperatorDevice[]>(`${operatorPath(operatorId)}/devices`).then((response) => response.data)
);

const revokeDevice = (operatorId: string, deviceId: string) => (
    http.post<void>(`${operatorPath(operatorId)}/devices/${encodeURIComponent(deviceId)}/revoke`).then(() => undefined)
);

const changeDeviceStatus = (operatorId: string, deviceId: string, status: "ACTIVE" | "BLOCKED") => (
    http.put<void>(`${operatorPath(operatorId)}/devices/${encodeURIComponent(deviceId)}/status`, {status})
        .then(() => undefined)
);

const getApiKeys = (operatorId: string) => (
    http.get<OperatorApiKey[]>(`${operatorPath(operatorId)}/api-keys`).then((response) => response.data)
);

const revokeApiKey = (operatorId: string, userId: number) => (
    http.delete<void>(`${operatorPath(operatorId)}/api-keys/${userId}`).then(() => undefined)
);

const fileNameFromDisposition = (disposition: string | undefined, fallback: string) => {
    const match = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    return match ? decodeURIComponent(match[1]) : fallback;
};

const downloadExport = async (operatorId: string) => {
    const response = await http.get<Blob>(`${operatorPath(operatorId)}/data-export`, {responseType: "blob"});
    const fileName = fileNameFromDisposition(
        response.headers?.["content-disposition"] as string | undefined,
        `operator-${operatorId}-export.json`,
    );
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return fileName;
};

const getLastErasure = (operatorId: string) => (
    http.get<OperatorDataErasure | "">(`${operatorPath(operatorId)}/data-erasure`)
        .then((response) => (response.status === 200 && response.data ? response.data : null))
);

const eraseData = (operatorId: string, confirmation: string) => (
    http.post<OperatorDataErasure>(`${operatorPath(operatorId)}/data-erasure`, {confirmation})
        .then((response) => response.data)
);

const OperatorOperationsService = {
    getOnboarding,
    getDevices,
    revokeDevice,
    changeDeviceStatus,
    getApiKeys,
    revokeApiKey,
    downloadExport,
    getLastErasure,
    eraseData,
};

export default OperatorOperationsService;
