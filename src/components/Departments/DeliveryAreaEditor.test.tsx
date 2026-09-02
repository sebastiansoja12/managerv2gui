import React from "react";
import {act, fireEvent, render, screen} from "@testing-library/react";
import * as L from "leaflet";
import Department from "../../class/depots/Department";
import pl from "../../i18n/translate";
import DeliveryAreaEditor from "./DeliveryAreaEditor";

jest.mock("leaflet", () => {
    const mockListeners = new Map();
    const mockCircles: Array<{options: {className?: string}; click: () => void}> = [];
    const map = {
        setView() { return this; },
        fitBounds() { return this; },
        on(name: string, listener: (mockEvent: unknown) => void) { mockListeners.set(name, listener); },
        off(name: string) { mockListeners.delete(name); },
        invalidateSize() {},
        stop() {},
        remove() {},
    };
    const layer = {
        addTo() { return this; },
        clearLayers() {},
    };
    const shape = () => {
        const mockShapeListeners = new Map();
        const instance = {
            bindTooltip() { return this; },
            addTo() { return this; },
            on(name: string, listener: () => void) { mockShapeListeners.set(name, listener); return this; },
            setLatLngs() {},
            click() { mockShapeListeners.get("click")?.(); },
        };
        return instance;
    };
    return {
        map: () => map,
        layerGroup: () => layer,
        tileLayer: shape,
        circleMarker: (...mockArgs: unknown[]) => {
            const mockShape = shape();
            mockCircles.push({options: mockArgs[1] as {className?: string}, click: () => mockShape.click()});
            return mockShape;
        },
        polygon: shape,
        polyline: shape,
        marker: shape,
        divIcon: () => ({}),
        latLngBounds: () => ({}),
        __click: (latitude: number, longitude: number) => {
            mockListeners.get("click")?.({latlng: {lat: latitude, lng: longitude}});
        },
        __clickStart: () => {
            mockCircles.slice().reverse().find((mockCircle) => (
                mockCircle.options.className === "delivery-area-start-point"
            ))?.click();
        },
    };
});

const clickMap = (latitude: number, longitude: number) => {
    (L as unknown as {__click: (lat: number, lng: number) => void}).__click(latitude, longitude);
};

const clickStart = () => {
    (L as unknown as {__clickStart: () => void}).__clickStart();
};

const editor = () => <DeliveryAreaEditor departmentId="100" departmentCode="KT1"
                                         coordinates={{latitude: 50, longitude: 19}} operatorId={7}
                                         canEdit active />;

describe("DeliveryAreaEditor", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("draws an area, saves the draft locally and restores it", () => {
        const view = render(editor());
        expect(screen.queryByRole("button", {name: pl.departments.deliveryArea.automatic})).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", {name: pl.departments.deliveryArea.newArea}));

        act(() => clickMap(50, 19));
        act(() => clickMap(50, 20));
        act(() => clickMap(51, 20));
        fireEvent.click(screen.getByRole("button", {name: pl.departments.deliveryArea.finishArea}));
        expect(screen.getByText(pl.departments.deliveryArea.pointCount.replace("{count}", "3"))).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", {name: pl.departments.deliveryArea.saveDraft}));
        const saved = JSON.parse(window.localStorage.getItem("manager.delivery-area-draft.v1.7.100") || "{}");
        expect(saved.areas).toHaveLength(1);
        expect(saved.areas[0].points).toHaveLength(3);

        view.unmount();
        render(editor());
        expect(screen.getByText(pl.departments.deliveryArea.pointCount.replace("{count}", "3"))).toBeInTheDocument();
    });

    it("offers a larger map and closes a boundary by clicking its starting point", () => {
        render(editor());
        fireEvent.click(screen.getByRole("button", {name: pl.departments.deliveryArea.fullScreen}));
        expect(screen.getByRole("button", {name: pl.departments.deliveryArea.exitFullScreen})).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByRole("button", {name: pl.departments.deliveryArea.exitFullScreen})
            .closest(".delivery-area-editor")).toHaveClass("expanded");

        fireEvent.click(screen.getByRole("button", {name: pl.departments.deliveryArea.newArea}));
        act(() => clickMap(50, 19));
        act(() => clickMap(50, 20));
        act(() => clickMap(51, 20));
        act(clickStart);

        expect(screen.getByText(pl.departments.deliveryArea.pointCount.replace("{count}", "3"))).toBeInTheDocument();
        expect(screen.getByRole("button", {name: pl.departments.deliveryArea.saveDraft})).toBeEnabled();
    });

    it("previews automatic boundaries and saves drafts for selected departments", async () => {
        const automaticDepartments = [
            {departmentId: 100, departmentCode: {value: "KT1"},
                address: {city: "Katowice", countryCode: "PL"}, coordinates: {latitude: 50.26, longitude: 19.02}, status: "ACTIVE"},
            {departmentId: 200, departmentCode: {value: "WA1"},
                address: {city: "Warszawa", countryCode: "PL"}, coordinates: {latitude: 52.23, longitude: 21.01}, status: "ACTIVE"},
            {departmentId: 300, departmentCode: {value: "ZZ1"},
                address: {city: "Berlin", countryCode: "DE"}, coordinates: {latitude: 52.52, longitude: 13.4}, status: "ACTIVE"},
        ] as Department[];
        const onAutomaticApplied = jest.fn();
        render(<DeliveryAreaEditor departmentId="" departmentCode="" operatorId={7} canEdit active
                                   automaticOnly automaticDepartments={automaticDepartments}
                                   onAutomaticApplied={onAutomaticApplied} />);
        expect(screen.getByText(pl.departments.deliveryArea.automaticSelected
            .replace("{count}", "2"))).toBeInTheDocument();
        expect(screen.getByText(pl.departments.deliveryArea.automaticExcluded
            .replace("{count}", "1"))).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", {name: pl.departments.deliveryArea.automaticPreview}));
        expect(screen.getByText(pl.departments.deliveryArea.automaticPreviewTitle)).toBeInTheDocument();
        expect(window.localStorage.getItem("manager.delivery-area-draft.v1.7.200")).toBeNull();
        fireEvent.click(screen.getByRole("button", {name: pl.departments.deliveryArea.automaticApply}));

        const current = JSON.parse(window.localStorage.getItem("manager.delivery-area-draft.v1.7.100") || "{}");
        const second = JSON.parse(window.localStorage.getItem("manager.delivery-area-draft.v1.7.200") || "{}");
        expect(current.areas.length).toBeGreaterThan(0);
        expect(second.areas.length).toBeGreaterThan(0);
        expect(window.localStorage.getItem("manager.delivery-area-draft.v1.7.300")).toBeNull();
        expect(onAutomaticApplied).toHaveBeenCalledWith(2);
    });
});
