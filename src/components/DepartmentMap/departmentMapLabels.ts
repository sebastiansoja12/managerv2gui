import {getBackendErrorMessage} from "../../api/errorMessage";
import {palletErrorCode, palletErrorDetail} from "../../hooks/PalletService";
import pl from "../../i18n/translate";
import {PalletMovementDto} from "./model/DepartmentMap";

export const departmentMapErrorCode = (error: unknown) => palletErrorCode(error);

export const isStaleStateRejection = (error: unknown) => {
    const code = palletErrorCode(error);
    return Boolean(code) && code !== "DEPARTMENT_MAP_INVALID";
};

export const departmentMapErrorMessage = (error: unknown, fallback: string) => {
    const code = palletErrorCode(error);
    const labels = pl.departmentMap.errors as unknown as Record<string, string>;
    const label = code ? labels[code] : null;
    const detail = palletErrorDetail(error);
    if (label) {
        return label;
    }
    return detail || getBackendErrorMessage(error, fallback);
};

export const formatMapDate = (value?: string | null) => {
    if (!value) {
        return pl.common.dash;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString(pl.common.locale);
};

export const movementDescription = (movement: PalletMovementDto) => {
    const template = pl.departmentMap.movements[movement.movementType] || movement.movementType;
    return template
        .replace("{from}", movement.fromLocationCode || pl.common.dash)
        .replace("{to}", movement.toLocationCode || pl.common.dash);
};
