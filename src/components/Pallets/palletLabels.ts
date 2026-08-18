import pl from "../../i18n/translate";
import {getBackendErrorMessage} from "../../api/errorMessage";
import {palletErrorCode, palletErrorDetail} from "../../hooks/PalletService";
import {PalletDto, PalletStatusDto, TransportTypeDto} from "./model/Pallet";

export const palletStatusLabel = (status?: PalletStatusDto | null) =>
    status ? pl.pallets.status[status] || status : pl.common.dash;

export const palletErrorLabel = (code?: string | null) => {
    if (!code) {
        return null;
    }
    const labels = pl.pallets.errors as unknown as Record<string, string>;
    return labels[code] || null;
};

export const palletErrorMessage = (error: unknown, fallback: string) =>
    palletErrorLabel(palletErrorCode(error)) || palletErrorDetail(error) || getBackendErrorMessage(error, fallback);

export const shipmentIdValue = (shipmentId: string | number | {value: string | number} | null | undefined) => {
    if (shipmentId === null || shipmentId === undefined) {
        return pl.common.dash;
    }
    return typeof shipmentId === "object" ? String(shipmentId.value) : String(shipmentId);
};

export const formatPalletWeight = (value?: number | string | null, unit?: string | null) =>
    value === null || value === undefined || value === "" ? pl.common.dash : `${value} ${unit || ""}`.trim();

export const formatPalletDate = (value?: string | null) =>
    value ? new Date(value).toLocaleString(pl.common.locale) : pl.common.dash;

export const palletStatusTone = (pallet: Pick<PalletDto, "palletStatus">) => {
    switch (pallet.palletStatus) {
        case "READY":
        case "LOADED":
        case "DELIVERED":
            return "success";
        case "NOT_READY":
        case "PREPARING":
            return "warning";
        case "CANCELLED":
            return "error";
        default:
            return "default";
    }
};

export const transportTypeLabel = (type?: TransportTypeDto | string | null) =>
    type ? (pl.pallets.transportType as Record<string, string>)[type] || type : pl.common.dash;
