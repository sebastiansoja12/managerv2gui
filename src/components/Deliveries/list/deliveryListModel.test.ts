import {activeFilterCount, defaultDeliveryListFilters, deliveryStatusTone, lifecycleTone, toggleSort} from "./deliveryListModel";

describe("delivery list model", () => {
    it("counts only filters that differ from defaults", () => {
        expect(activeFilterCount(defaultDeliveryListFilters)).toBe(0);
        expect(activeFilterCount({...defaultDeliveryListFilters, hideCanceled: false, text: "abc",
            deliveryStatuses: []})).toBe(2);
    });

    it("toggles sort direction for the same column and picks a default for a new one", () => {
        expect(toggleSort({field: "CREATED", direction: "desc"}, "CREATED")).toEqual({field: "CREATED", direction: "asc"});
        expect(toggleSort({field: "CREATED", direction: "desc"}, "TYPE")).toEqual({field: "TYPE", direction: "asc"});
        expect(toggleSort({field: "TYPE", direction: "asc"}, "DELIVERED_AT"))
            .toEqual({field: "DELIVERED_AT", direction: "desc"});
    });

    it("maps statuses to tones", () => {
        expect(deliveryStatusTone("DELIVERED")).toBe("success");
        expect(deliveryStatusTone("REJECTED")).toBe("danger");
        expect(deliveryStatusTone("DELIVERY")).toBe("warning");
        expect(deliveryStatusTone(null)).toBe("neutral");
        expect(lifecycleTone("CANCELED")).toBe("danger");
        expect(lifecycleTone("MODIFIED")).toBe("warning");
    });
});
