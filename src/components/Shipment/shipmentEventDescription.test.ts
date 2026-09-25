import {setLanguage} from "../../i18n/languageStore";
import {shipmentEventDescription} from "./shipmentEventDescription";

describe("shipmentEventDescription", () => {
    beforeEach(() => {
        setLanguage("pl");
    });

    it("translates a shipment event name", () => {
        expect(shipmentEventDescription("ShipmentSent")).toBe("Przesyłka wysłana");
    });

    it("translates an integration event key", () => {
        expect(shipmentEventDescription("shipment.created")).toBe("Przesyłka utworzona");
    });

    it("uses shipment status for a status changed event", () => {
        expect(shipmentEventDescription("shipment.status.changed", "DELIVERY"))
            .toBe("Przesyłka w doręczeniu");
    });

    it("uses a generic label when a status changed event has no recognized status", () => {
        expect(shipmentEventDescription("shipment.status.changed", "NEW_STATUS"))
            .toBe("Zaktualizowano status przesyłki");
    });

    it("keeps an unknown event name visible", () => {
        expect(shipmentEventDescription("ShipmentNewEvent")).toBe("ShipmentNewEvent");
    });

    it("shows the empty description label", () => {
        expect(shipmentEventDescription()).toBe("Brak opisu operacji");
    });
});
