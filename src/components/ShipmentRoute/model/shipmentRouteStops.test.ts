import Department from "../../../class/depots/Department";
import {buildShipmentRouteStops} from "./shipmentRouteStops";

const department = (code: string, latitude?: number, longitude?: number) => ({
    departmentId: 1,
    departmentCode: {value: code},
    address: {city: "Katowice", street: "Mariacka 1", postalCode: "40-001", countryCode: "PL"},
    coordinates: latitude === undefined ? null : {latitude, longitude},
} as unknown as Department);

describe("buildShipmentRouteStops", () => {
    it("assigns roles and leg distances in travel order", () => {
        const stops = buildShipmentRouteStops({
            shipmentId: "100",
            trackingNumber: "TN-1",
            distanceInKilometers: null,
            departments: [
                {departmentId: "1", departmentCode: "KT1", departmentType: "BRANCH"},
                {departmentId: "2", departmentCode: "NCS", departmentType: "SORTING_FACILITY"},
                {departmentId: "3", departmentCode: "WA1", departmentType: "BRANCH"},
            ],
        }, [
            department("kt1", 50.2649, 19.0238),
            department("NCS", 51.7592, 19.4560),
            department("WA1"),
        ]);

        expect(stops.map((stop) => stop.role)).toEqual(["origin", "transfer", "destination"]);
        expect(stops[0].distanceFromPreviousInKilometers).toBeNull();
        expect(stops[1].distanceFromPreviousInKilometers).toBeGreaterThan(160);
        expect(stops[1].distanceFromPreviousInKilometers).toBeLessThan(175);
        expect(stops[2].position).toBeNull();
        expect(stops[2].distanceFromPreviousInKilometers).toBeNull();
    });
});
