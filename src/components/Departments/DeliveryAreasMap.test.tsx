import React from "react";
import {act, render, screen} from "@testing-library/react";
import * as L from "leaflet";
import Department from "../../class/depots/Department";
import pl from "../../i18n/translate";
import {writeAreas} from "./deliveryAreaDraft";
import DeliveryAreasMap from "./DeliveryAreasMap";

jest.mock("leaflet", () => {
    const polygons: unknown[] = [];
    const bounds = {extend() { return this; }, isValid: () => true};
    const shape = () => ({addTo() { return this; }, bindTooltip() { return this; }, getBounds: () => bounds});
    return {
        map: () => ({fitBounds() { return this; }, invalidateSize() {}, remove() {}}),
        layerGroup: () => ({addTo() { return this; }, clearLayers() { polygons.length = 0; }}),
        tileLayer: shape,
        polyline: shape,
        circleMarker: shape,
        polygon: (...args: unknown[]) => { polygons.push(args); return shape(); },
        latLngBounds: () => bounds,
        __polygons: polygons,
    };
});

const department = {
    departmentId: 100,
    departmentCode: {value: "KT1"},
    status: "ACTIVE",
    coordinates: {latitude: 50.26, longitude: 19.02},
} as Department;
const area = {id: "1", name: "Centrum", points: [
    {latitude: 50, longitude: 19}, {latitude: 50, longitude: 20}, {latitude: 51, longitude: 20},
]};

describe("DeliveryAreasMap", () => {
    beforeEach(() => window.localStorage.clear());

    it("shows saved boundaries and updates after a draft is saved", () => {
        const polygons = (L as unknown as {__polygons: unknown[]}).__polygons;
        render(<DeliveryAreasMap departments={[department]} operatorId={7} />);
        expect(screen.getByText(pl.departments.deliveryArea.overviewEmpty)).toBeInTheDocument();
        expect(polygons).toHaveLength(0);

        act(() => writeAreas("manager.delivery-area-draft.v1.7.100", [area]));
        expect(screen.getByText(pl.departments.deliveryArea.overviewCount.replace("{count}", "1"))).toBeInTheDocument();
        expect(screen.queryByText(pl.departments.deliveryArea.overviewEmpty)).not.toBeInTheDocument();
        expect(polygons).toHaveLength(1);
    });
});
