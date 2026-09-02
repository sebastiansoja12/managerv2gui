import BackendClient from "../api/BackendClient";
import {ApiResult} from "../api/ApiResult";
import {
    DepartmentRelation,
    canonicalDepartmentRelation,
} from "../components/Departments/model/DepartmentRelation";
import http from "../http-common";

export type DeliveryNetworkWorkbook = {
    blob: Blob;
    filename: string;
};

type DepartmentIdApi = {
    value: string;
};

type DepartmentConnectionApi = {
    firstDepartmentId: DepartmentIdApi;
    secondDepartmentId: DepartmentIdApi;
};

type DeliveryNetworkApi = {
    connections: DepartmentConnectionApi[];
};

const client = new BackendClient(http);

const DEFAULT_WORKBOOK_FILENAME = "delivery-network.xlsx";

const filenameFromDisposition = (contentDisposition?: string) => {
    if (!contentDisposition) {
        return DEFAULT_WORKBOOK_FILENAME;
    }

    const encodedFilename = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    if (encodedFilename) {
        try {
            return decodeURIComponent(encodedFilename.replace(/^"|"$/g, ""));
        } catch {
            return encodedFilename.replace(/^"|"$/g, "");
        }
    }

    return contentDisposition.match(/filename\s*=\s*"?([^";]+)"?/i)?.[1]?.trim()
        || DEFAULT_WORKBOOK_FILENAME;
};

export const mapDeliveryNetworkFromApi = (deliveryNetwork: DeliveryNetworkApi): DepartmentRelation[] => (
    deliveryNetwork.connections.map((connection) => ({
        sourceDepartmentId: String(connection.firstDepartmentId.value),
        targetDepartmentId: String(connection.secondDepartmentId.value),
    }))
);

export const mapDeliveryNetworkToApi = (relations: DepartmentRelation[]): DeliveryNetworkApi => ({
    connections: relations.map((relation) => {
        const canonicalRelation = canonicalDepartmentRelation(relation);
        return {
            firstDepartmentId: {
                value: canonicalRelation.sourceDepartmentId,
            },
            secondDepartmentId: {
                value: canonicalRelation.targetDepartmentId,
            },
        };
    }),
});

const getCurrentNetwork = async (): Promise<ApiResult<DepartmentRelation[]>> => {
    const response = await client.get<DeliveryNetworkApi>("/delivery-networks/current");
    return {
        data: mapDeliveryNetworkFromApi(response.data),
        status: response.status,
    };
};

const replaceCurrentNetwork = async (
    relations: DepartmentRelation[],
): Promise<ApiResult<DepartmentRelation[]>> => {
    const response = await client.put<DeliveryNetworkApi, DeliveryNetworkApi>(
        "/delivery-networks/current",
        mapDeliveryNetworkToApi(relations),
    );
    return {
        data: mapDeliveryNetworkFromApi(response.data),
        status: response.status,
    };
};

const exportCurrentNetwork = async (): Promise<DeliveryNetworkWorkbook> => {
    const response = await http.request<Blob>({
        method: "GET",
        url: "/delivery-networks/current/export",
        responseType: "blob",
    });
    return {
        blob: response.data,
        filename: filenameFromDisposition(response.headers["content-disposition"]),
    };
};

const saveWorkbook = ({blob, filename}: DeliveryNetworkWorkbook) => {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
};

const importCurrentNetwork = async (file: File): Promise<ApiResult<DepartmentRelation[]>> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await http.request<DeliveryNetworkApi>({
        method: "PUT",
        url: "/delivery-networks/current/import",
        data: formData,
        headers: {"Content-Type": "multipart/form-data"},
    });
    return {
        data: mapDeliveryNetworkFromApi(response.data),
        status: response.status,
    };
};

const DeliveryNetworkService = {
    getCurrentNetwork,
    replaceCurrentNetwork,
    exportCurrentNetwork,
    importCurrentNetwork,
    saveWorkbook,
};

export default DeliveryNetworkService;
