import {AxiosResponse} from "axios";
import BackendClient from "../api/BackendClient";
import {ApiErrorResponse, QueryParams} from "../api/ApiResult";
import http from "../http-common";
import {
    CreatePalletRequestApi,
    PalletDepartmentsRequestApi,
    PalletDto,
    PalletPageDto,
    PalletScanRequestApi,
    PalletUpdateRequestApi,
    PalletScanResponseDto,
    PalletSearchParams,
    PalletCarrierRequestApi,
    PalletDocumentFile,
    PalletDocumentKind,
    PalletHistoryEntryDto,
    PalletManualStatusDto,
    PalletMaxWeightRequestApi,
} from "../components/Pallets/model/Pallet";

const client = new BackendClient(http);

const searchParams = ({variant, page, size}: PalletSearchParams): QueryParams => ({
    status: variant === "cancelled" ? "CANCELLED" : undefined,
    empty: variant === "empty" ? true : undefined,
    page,
    size,
});

const createEmpty = () => client.post<Record<string, never>, PalletDto>("/pallets", {});

const createFromShipments = (shipmentIds: string[]) =>
    client.post<CreatePalletRequestApi, PalletDto>("/pallets/shipments", {shipmentIds});

const search = (params: PalletSearchParams) =>
    client.get<PalletPageDto>("/pallets", {params: searchParams(params)});

const getByTrackingNumber = (trackingNumber: string) =>
    client.get<PalletDto>(`/pallets/tracking/${encodeURIComponent(trackingNumber)}`);

const cancel = (palletId: string) =>
    client.put<undefined, PalletDto>(`/pallets/${encodeURIComponent(palletId)}/cancel`);

const addShipments = (palletId: string, shipmentIds: string[]) =>
    client.put<CreatePalletRequestApi, PalletDto>(`/pallets/${encodeURIComponent(palletId)}/shipments`, {shipmentIds});

const removeShipment = (palletId: string, shipmentId: string) =>
    client.delete<undefined, PalletDto>(
        `/pallets/${encodeURIComponent(palletId)}/shipments/${encodeURIComponent(shipmentId)}`, undefined);

const setMaxWeight = (palletId: string, maxGrossWeight: number) =>
    client.put<PalletMaxWeightRequestApi, PalletDto>(`/pallets/${encodeURIComponent(palletId)}/max-weight`, {maxGrossWeight});

const getHistory = (palletId: string) =>
    client.get<PalletHistoryEntryDto[]>(`/pallets/${encodeURIComponent(palletId)}/history`);

const changeDepartments = (palletId: string, request: PalletDepartmentsRequestApi) =>
    client.put<PalletDepartmentsRequestApi, PalletDto>(`/pallets/${encodeURIComponent(palletId)}/departments`, request);

const assignCarrier = (palletId: string, request: PalletCarrierRequestApi) =>
    client.put<PalletCarrierRequestApi, PalletDto>(`/pallets/${encodeURIComponent(palletId)}/carrier`, request);

const changeStatus = (palletId: string, palletStatus: PalletManualStatusDto) =>
    client.put<{palletStatus: PalletManualStatusDto}, PalletDto>(`/pallets/${encodeURIComponent(palletId)}/status`, {palletStatus});

const update = (palletId: string, request: PalletUpdateRequestApi) =>
    client.put<PalletUpdateRequestApi, PalletDto>(`/pallets/${encodeURIComponent(palletId)}`, request);

const DOCUMENT_PATHS: Record<PalletDocumentKind, string> = {
    label: "label",
    transport: "documents/transport",
};

const DOCUMENT_FALLBACK_NAMES: Record<PalletDocumentKind, string> = {
    label: "etykieta",
    transport: "list-przewozowy",
};

const filenameFromDisposition = (contentDisposition?: string) =>
    contentDisposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)?.[1];

const safeDecode = (value: string) => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

const getDocument = async (trackingNumber: string, kind: PalletDocumentKind): Promise<PalletDocumentFile> => {
    const response: AxiosResponse<Blob> = await http.get<Blob>(
        `/pallets/tracking/${encodeURIComponent(trackingNumber)}/${DOCUMENT_PATHS[kind]}`,
        {responseType: "blob"},
    );
    const blob = response.data.type === "application/pdf" ? response.data : new Blob([response.data], {type: "application/pdf"});
    const rawFilename = filenameFromDisposition(response.headers?.["content-disposition"]);
    const filename = rawFilename ? safeDecode(rawFilename) : rawFilename;
    return {blob, filename: filename || `${DOCUMENT_FALLBACK_NAMES[kind]}-${trackingNumber}.pdf`};
};

export const savePalletDocument = ({blob, filename}: PalletDocumentFile) => {
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

const scan = (trackingNumber: string) =>
    client.post<PalletScanRequestApi, PalletScanResponseDto>("/pallets/scan", {trackingNumber});

type PalletProblemDetails = {
    code?: unknown;
    detail?: unknown;
    properties?: {code?: unknown} | null;
};

const problemDetails = (error: unknown): PalletProblemDetails | null => {
    const details = (error as ApiErrorResponse | undefined)?.details;
    return details && typeof details === "object" ? details as PalletProblemDetails : null;
};

export const palletErrorCode = (error: unknown): string | null => {
    const details = problemDetails(error);
    const code = details?.properties?.code ?? details?.code;
    return typeof code === "string" ? code : null;
};

export const palletErrorDetail = (error: unknown): string | null => {
    const detail = problemDetails(error)?.detail;
    return typeof detail === "string" && detail ? detail : null;
};

const PalletService = {
    createEmpty,
    createFromShipments,
    search,
    getByTrackingNumber,
    cancel,
    scan,
    addShipments,
    removeShipment,
    setMaxWeight,
    assignCarrier,
    changeStatus,
    update,
    getDocument,
    getHistory,
    changeDepartments,
};

export default PalletService;
