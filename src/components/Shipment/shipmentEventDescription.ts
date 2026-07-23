import pl from "../../i18n/translate";

const eventDescriptions = pl.shipments.routeHistory.eventDescriptions as Record<string, string>;
const statusEventDescriptions = pl.shipments.routeHistory.statusEventDescriptions as Record<string, string>;

export const shipmentEventDescription = (description?: string, shipmentStatus?: string): string => {
    if (!description) {
        return pl.shipments.routeHistory.noDescription;
    }

    if (description === "shipment.status.changed" && shipmentStatus) {
        return statusEventDescriptions[shipmentStatus] || eventDescriptions[description] || description;
    }

    return eventDescriptions[description] || description;
};
