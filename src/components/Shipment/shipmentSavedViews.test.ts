import {
    createShipmentSavedView,
    loadShipmentSavedViews,
    SHIPMENT_SAVED_VIEWS_STORAGE_KEY,
    ShipmentListFilters,
    storeShipmentSavedViews,
} from "./shipmentSavedViews";

const filters: ShipmentListFilters = {
    status: "PREPARED",
    priority: "",
    senderName: "Anna",
    recipientName: "",
    minPrice: "",
    maxPrice: "",
    currency: "",
    locked: "ALL",
    createdFrom: "2026-11-01",
    createdTo: "",
};

describe("shipment saved views", () => {
    beforeEach(() => window.localStorage.clear());

    it("stores views per user", () => {
        const view = createShipmentSavedView("  Przygotowane  ", filters);
        storeShipmentSavedViews([view], "jnovak");

        expect(loadShipmentSavedViews("jnovak")).toEqual([{...view, name: "Przygotowane"}]);
        expect(loadShipmentSavedViews("akowalska")).toEqual([]);
    });

    it("ignores broken stored data", () => {
        window.localStorage.setItem(`${SHIPMENT_SAVED_VIEWS_STORAGE_KEY}.user.jnovak`, "{not json");
        expect(loadShipmentSavedViews("jnovak")).toEqual([]);

        window.localStorage.setItem(`${SHIPMENT_SAVED_VIEWS_STORAGE_KEY}.user.jnovak`, JSON.stringify([{id: 1}]));
        expect(loadShipmentSavedViews("jnovak")).toEqual([]);
    });
});
