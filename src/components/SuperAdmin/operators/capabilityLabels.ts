import pl from "../../../i18n/translate";
import {ShippingCapabilities} from "../../Operators/model/Operator";

const capabilityKeys: Array<keyof ShippingCapabilities> = [
    "supportsDomesticShipping",
    "supportsInternationalShipping",
    "supportsExpressShipping",
    "supportsSameDayDelivery",
    "supportsCashOnDelivery",
    "supportsParcelLockers",
    "supportsPickupPoints",
    "supportsHomeDelivery",
    "supportsSaturdayDelivery",
    "supportsSundayDelivery",
    "supportsReturnShipments",
    "providesTracking",
    "providesInsurance",
];

export const getCapabilityLabels = () => capabilityKeys.map((key) => ({
    key,
    label: pl.superAdmin.capabilities[key].label,
    hint: pl.superAdmin.capabilities[key].hint,
}));
