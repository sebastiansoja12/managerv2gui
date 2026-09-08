import React from "react";
import {render, screen} from "@testing-library/react";
import pl from "../../i18n/translate";
import {PickupPointSummary} from "./model/PickupPoint";
import PickupPointMap from "./PickupPointMap";

const point: PickupPointSummary = {
    pickupPointId: {value: "11f6a9b0-e529-4ff4-bf40-865d246f6138"},
    code: "WAW-001",
    name: "Punkt Centrum",
    type: "SERVICE_POINT",
    status: "ACTIVE",
    capabilities: ["DROP_OFF", "COLLECTION"],
    address: {
        countryCode: "PL",
        postalCode: "00-001",
        city: "Warszawa",
        street: "Marszałkowska",
        buildingNumber: "1",
    },
    coordinates: {latitude: 52.23, longitude: 21.01},
    department: {departmentId: {value: "1"}, code: "WAW"},
    availability: {selectable: true, reasonCodes: [], isOpenNow: true},
    version: 0,
};

test("renders pickup point marker on the map", () => {
    const {container} = render(
        <PickupPointMap points={[point]} selectedPointId={null} onSelect={jest.fn()}/>,
    );

    expect(screen.getByRole("region", {name: pl.pickupPoints.map.label})).toBeInTheDocument();
    expect(container.querySelector(".leaflet-container")).toBeInTheDocument();
    expect(container.querySelectorAll(".pickup-point-map-marker")).toHaveLength(1);
});
