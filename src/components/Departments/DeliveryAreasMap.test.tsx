import React from "react";
import {act, render, screen, waitFor} from "@testing-library/react";
import * as L from "leaflet";
import Department from "../../class/depots/Department";
import DeliveryAreaService from "../../hooks/DeliveryAreaService";
import pl from "../../i18n/translate";
import DeliveryAreasMap from "./DeliveryAreasMap";
import {notifyDeliveryAreasChanged} from "./model/DeliveryArea";

jest.mock("../../hooks/DeliveryAreaService", () => ({
    __esModule: true,
    default: {getAll: jest.fn()},
}));

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
const area = {deliveryAreaId: 1, departmentId: 100, name: "Centrum", source: "MANUAL" as const, updatedAt: "", points: [
    {latitude: 50, longitude: 19}, {latitude: 50, longitude: 20}, {latitude: 51, longitude: 20},
]};
const service = DeliveryAreaService as jest.Mocked<typeof DeliveryAreaService>;

describe("DeliveryAreasMap", () => {
    it("shows saved boundaries and reloads them after a change", async () => {
        const polygons = (L as unknown as {__polygons: unknown[]}).__polygons;
        service.getAll.mockResolvedValueOnce({data: [], status: 200});
        render(<DeliveryAreasMap departments={[department]} />);
        await waitFor(() => expect(service.getAll).toHaveBeenCalledTimes(1));
        expect(screen.getByText(pl.departments.deliveryArea.overviewEmpty)).toBeInTheDocument();
        expect(polygons).toHaveLength(0);

        service.getAll.mockResolvedValueOnce({data: [area], status: 200});
        act(() => notifyDeliveryAreasChanged());
        expect(await screen.findByText(pl.departments.deliveryArea.overviewCount.replace("{count}", "1"))).toBeInTheDocument();
        expect(screen.queryByText(pl.departments.deliveryArea.overviewEmpty)).not.toBeInTheDocument();
        expect(polygons).toHaveLength(1);
    });
});
