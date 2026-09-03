import React from "react";
import {render, screen} from "@testing-library/react";
import * as L from "leaflet";
import PostalCodeService from "../../hooks/PostalCodeService";
import pl from "../../i18n/translate";
import ShipmentAddressRouteMap, {findRoutePoint} from "./ShipmentAddressRouteMap";
import {PersonApi} from "./dto/ShipmentDto";

jest.mock("../../hooks/PostalCodeService", () => ({
    __esModule: true,
    default: {search: jest.fn()},
}));

const person = (postalCode: string, city: string): PersonApi => ({
    firstName: "Jan", lastName: "Kowalski", email: "jan@example.com", telephoneNumber: "123456789",
    street: "Długa 1", postalCode, city,
});

const postalCode = (code: string, city: string, latitude: number, longitude: number) => ({
    countryCode: "PL", postalCode: code, city, regionCode: "78", latitude, longitude,
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe("shipment address route", () => {
    it("prefers the postal code row matching the city", () => {
        const rows = [postalCode("05-077", "Warszawa", 52.2, 21.2), postalCode("05-077", "Wesoła", 52.25, 21.23)];
        expect(findRoutePoint(rows, person("05-077", "wesoła"))).toEqual({latitude: 52.25, longitude: 21.23});
    });

    it("falls back to the first row with the same postal code", () => {
        const rows = [postalCode("60-149", "Poznań", 52.39, 16.87)];
        expect(findRoutePoint(rows, person("60-149", "Unknown"))).toEqual({latitude: 52.39, longitude: 16.87});
        expect(findRoutePoint(rows, person("60-150", "Poznań"))).toBeNull();
    });

    it("draws sender and recipient points with straight-line distance", async () => {
        (PostalCodeService.search as jest.Mock).mockImplementation((query: string) => Promise.resolve({
            data: query === "60-149"
                ? [postalCode("60-149", "Poznań", 52.39, 16.87)]
                : [postalCode("44-213", "Książenice", 50.08, 18.66)],
        }));

        const polyline = jest.spyOn(L, "polyline").mockReturnValue({addTo: jest.fn()} as unknown as L.Polyline);

        render(<ShipmentAddressRouteMap sender={person("60-149", "Poznań")} recipient={person("44-213", "Książenice")} />);

        expect(await screen.findByTitle(`${pl.shipments.addressRoute.sender}: 60-149 Poznań`)).toBeInTheDocument();
        expect(screen.getByTitle(`${pl.shipments.addressRoute.recipient}: 44-213 Książenice`)).toBeInTheDocument();
        expect(screen.getByRole("region", {name: pl.shipments.addressRoute.mapLabel})).toBeInTheDocument();
        expect(polyline).toHaveBeenCalledWith([[52.39, 16.87], [50.08, 18.66]], expect.anything());
        expect(screen.getByText(/285 km/)).toBeInTheDocument();
        polyline.mockRestore();
    });

    it("explains when the recipient postal code cannot be located", async () => {
        (PostalCodeService.search as jest.Mock).mockImplementation((query: string) => Promise.resolve({
            data: query === "60-149" ? [postalCode("60-149", "Poznań", 52.39, 16.87)] : [],
        }));

        render(<ShipmentAddressRouteMap sender={person("60-149", "Poznań")} recipient={person("99-999", "Nowhere")} />);

        expect(await screen.findByText(pl.shipments.addressRoute.recipientNotFound)).toBeInTheDocument();
    });
});
