import {setLanguage} from "../../i18n/languageStore";
import {shipmentEventDescription} from "./shipmentEventDescription";

describe("shipmentEventDescription", () => {
    beforeEach(() => {
        setLanguage("pl");
    });

    it("translates a shipment event name", () => {
        expect(shipmentEventDescription("ShipmentSent")).toBe("Przesyłka wysłana");
    });

    it("keeps an unknown event name visible", () => {
        expect(shipmentEventDescription("ShipmentNewEvent")).toBe("ShipmentNewEvent");
    });

    it("shows the empty description label", () => {
        expect(shipmentEventDescription()).toBe("Brak opisu operacji");
    });
});
