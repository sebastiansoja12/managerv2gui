import pl from "../../i18n/translate";
import {AppTabDefinition} from "../AppShell/types";

export const palletDetailsPath = (trackingNumber: string) => `/pallets/tracking/${encodeURIComponent(trackingNumber)}`;

export const palletDetailsTab = (trackingNumber: string): AppTabDefinition => ({
    label: `${pl.pallets.details.title} ${trackingNumber}`,
    path: palletDetailsPath(trackingNumber),
});

export const palletCreateFromShipmentsTab = (): AppTabDefinition => ({
    label: pl.pallets.createFromShipments.title,
    path: "/pallets/create-from-shipments",
});
