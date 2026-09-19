import React from "react";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import * as L from "leaflet";
import Department from "../../class/depots/Department";
import DeliveryAreaService from "../../hooks/DeliveryAreaService";
import pl from "../../i18n/translate";
import DeliveryAreaEditor from "./DeliveryAreaEditor";

jest.mock("../../hooks/DeliveryAreaService", () => ({
    __esModule: true,
    default: {
        getByDepartment: jest.fn(),
        replaceDepartmentAreas: jest.fn(),
        previewAutomatic: jest.fn(),
        applyAutomatic: jest.fn(),
    },
}));

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

const service = DeliveryAreaService as jest.Mocked<typeof DeliveryAreaService>;

const triangle = [{latitude: 50, longitude: 19}, {latitude: 50, longitude: 20}, {latitude: 51, longitude: 20}];

const savedArea = (deliveryAreaId: number, departmentId: number) => ({
    deliveryAreaId, departmentId, name: "Obszar 1", source: "MANUAL" as const, points: triangle, updatedAt: "",
});

const editor = () => <DeliveryAreaEditor departmentId="100" departmentCode="KT1"
                                         coordinates={{latitude: 50, longitude: 19}} canEdit active />;

const drawTriangle = () => {
    fireEvent.click(screen.getByRole("button", {name: pl.departments.deliveryArea.newArea}));
    act(() => clickMap(50, 19));
    act(() => clickMap(50, 20));
    act(() => clickMap(51, 20));
};

describe("DeliveryAreaEditor", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        service.getByDepartment.mockResolvedValue({data: [], status: 200});
    });

    it("draws an area and saves it on the server", async () => {
        service.replaceDepartmentAreas.mockResolvedValue({data: [savedArea(5, 100)], status: 200});
        render(editor());
        await waitFor(() => expect(service.getByDepartment).toHaveBeenCalledWith("100"));
        expect(screen.queryByRole("button", {name: pl.departments.deliveryArea.automatic})).not.toBeInTheDocument();

        drawTriangle();
        fireEvent.click(screen.getByRole("button", {name: pl.departments.deliveryArea.finishArea}));
        expect(screen.getByText(pl.departments.deliveryArea.pointCount.replace("{count}", "3"))).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", {name: pl.departments.deliveryArea.save}));

        await waitFor(() => expect(screen.getByText(pl.departments.deliveryArea.saved)).toBeInTheDocument());
        expect(service.replaceDepartmentAreas).toHaveBeenCalledWith("100", [
            {deliveryAreaId: null, name: `${pl.departments.deliveryArea.areaName} 1`, points: triangle},
        ]);
    });

    it("loads saved areas and sends their identifiers when edited", async () => {
        service.getByDepartment.mockResolvedValue({data: [savedArea(5, 100)], status: 200});
        render(editor());

        expect(await screen.findByText(pl.departments.deliveryArea.pointCount.replace("{count}", "3"))).toBeInTheDocument();
    });

    it("shows a translated backend validation error", async () => {
        service.replaceDepartmentAreas.mockRejectedValue({message: "Bad", details: {properties: {code: "INVALID_BOUNDARY"}}});
        render(editor());
        await waitFor(() => expect(service.getByDepartment).toHaveBeenCalled());
        drawTriangle();
        fireEvent.click(screen.getByRole("button", {name: pl.departments.deliveryArea.finishArea}));
        fireEvent.click(screen.getByRole("button", {name: pl.departments.deliveryArea.save}));

        expect(await screen.findByText(pl.departments.deliveryArea.errors.INVALID_BOUNDARY)).toBeInTheDocument();
    });

    it("offers a larger map and closes a boundary by clicking its starting point", async () => {
        render(editor());
        await waitFor(() => expect(service.getByDepartment).toHaveBeenCalled());
        fireEvent.click(screen.getByRole("button", {name: pl.departments.deliveryArea.fullScreen}));
        expect(screen.getByRole("button", {name: pl.departments.deliveryArea.exitFullScreen})).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByRole("button", {name: pl.departments.deliveryArea.exitFullScreen})
            .closest(".delivery-area-editor")).toHaveClass("expanded");

        drawTriangle();
        act(clickStart);

        expect(screen.getByText(pl.departments.deliveryArea.pointCount.replace("{count}", "3"))).toBeInTheDocument();
        expect(screen.getByRole("button", {name: pl.departments.deliveryArea.save})).toBeEnabled();
    });

    it("previews automatic boundaries on the server and applies them to selected departments", async () => {
        const automaticDepartments = [
            {departmentId: 100, departmentCode: {value: "KT1"},
                address: {city: "Katowice", countryCode: "PL"}, coordinates: {latitude: 50.26, longitude: 19.02}, status: "ACTIVE"},
            {departmentId: 200, departmentCode: {value: "WA1"},
                address: {city: "Warszawa", countryCode: "PL"}, coordinates: {latitude: 52.23, longitude: 21.01}, status: "ACTIVE"},
            {departmentId: 300, departmentCode: {value: "ZZ1"},
                address: {city: "Berlin", countryCode: "DE"}, coordinates: {latitude: 52.52, longitude: 13.4}, status: "ACTIVE"},
        ] as Department[];
        const generated = [
            {departmentId: 100, departmentCode: "KT1", areas: [savedArea(1, 100)]},
            {departmentId: 200, departmentCode: "WA1", areas: [savedArea(2, 200)]},
        ];
        service.previewAutomatic.mockResolvedValue({data: generated, status: 200});
        service.applyAutomatic.mockResolvedValue({data: generated, status: 200});
        const onAutomaticApplied = jest.fn();
        render(<DeliveryAreaEditor departmentId="" departmentCode="" canEdit active
                                   automaticOnly automaticDepartments={automaticDepartments}
                                   onAutomaticApplied={onAutomaticApplied} />);
        expect(screen.getByText(pl.departments.deliveryArea.automaticSelected
            .replace("{count}", "2"))).toBeInTheDocument();
        expect(screen.getByText(pl.departments.deliveryArea.automaticExcluded
            .replace("{count}", "1"))).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", {name: pl.departments.deliveryArea.automaticPreview}));
        expect(await screen.findByText(pl.departments.deliveryArea.automaticPreviewTitle)).toBeInTheDocument();
        expect(service.previewAutomatic).toHaveBeenCalledWith([100, 200]);
        expect(service.applyAutomatic).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", {name: pl.departments.deliveryArea.automaticApply}));

        await waitFor(() => expect(onAutomaticApplied).toHaveBeenCalledWith(2));
        expect(service.applyAutomatic).toHaveBeenCalledWith([100, 200]);
    });
});
