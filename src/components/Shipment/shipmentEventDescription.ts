import pl from "../../i18n/translate";

const eventDescriptions = pl.shipments.routeHistory.eventDescriptions as Record<string, string>;

export const shipmentEventDescription = (description?: string): string => {
    if (!description) {
        return pl.shipments.routeHistory.noDescription;
    }

    return eventDescriptions[description] || description;
};
