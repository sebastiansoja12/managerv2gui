import pl from "../../../i18n/translate";
import {PickupPointDetails, PickupPointSummary} from "../../PickupPoints/model/PickupPoint";

export const pickupPointName = (point: PickupPointSummary) => `${point.code} · ${point.name}`;

export const pickupPointAddress = (point: PickupPointSummary) => {
    const address = point.address;
    if (!address) {
        return pl.common.dash;
    }
    return `${address.street} ${address.buildingNumber}${address.unitNumber ? `/${address.unitNumber}` : ""}, `
        + `${address.postalCode} ${address.city}`;
};

export const pickupPointLabel = (pickupPoints: Record<string, PickupPointDetails>, pickupPointId?: string | null) => {
    if (!pickupPointId) {
        return pl.common.dash;
    }
    const point = pickupPoints[pickupPointId];
    return point ? pickupPointName(point) : pickupPointId;
};
