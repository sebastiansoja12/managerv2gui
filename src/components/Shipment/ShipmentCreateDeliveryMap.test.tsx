import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import PickupPointService from "../../hooks/PickupPointService";
import ShipmentService from "../../hooks/ShipmentService";
import ShipmentCreate from "./ShipmentCreate";
import pl from "../../i18n/translate";

jest.mock("../../hooks/ShipmentService", () => ({
    __esModule: true,
    default: {create: jest.fn()},
}));

jest.mock("../../hooks/PickupPointService", () => ({
    __esModule: true,
    default: {findEligible: jest.fn()},
}));

beforeEach(() => {
    jest.clearAllMocks();
    (ShipmentService.create as jest.Mock).mockReturnValue(new Promise(() => undefined));
    (PickupPointService.findEligible as jest.Mock).mockResolvedValue({
        data: {
            items: [{
                pickupPointId: {value: "11f6a9b0-e529-4ff4-bf40-865d246f6138"},
                code: "BER-001",
                name: "Berlin Zentrum",
                type: "SERVICE_POINT",
                status: "ACTIVE",
                capabilities: ["COLLECTION"],
                address: {
                    countryCode: "DE",
                    postalCode: "10115",
                    city: "Berlin",
                    street: "Invalidenstraße",
                    buildingNumber: "1",
                },
                coordinates: {latitude: 52.53, longitude: 13.38},
                availability: {selectable: true, reasonCodes: [], isOpenNow: true},
                version: 0,
            }],
            page: 0,
            size: 100,
            totalElements: 1,
            totalPages: 1,
        },
    });
});

const selectOption = (label: string, option: string) => {
    fireEvent.click(screen.getByRole("combobox", {name: label}));
    fireEvent.click(screen.getByRole("option", {name: option}));
};

const renderForm = () => render(<MemoryRouter><ShipmentCreate /></MemoryRouter>);

describe("shipment delivery map", () => {
    it("offers a map based on delivery method, independently of pickup method", () => {
        renderForm();
        expect(screen.queryByRole("button", {name: pl.shipments.deliveryPointMap.open})).not.toBeInTheDocument();
        selectOption(pl.shipments.form.fields.pickupMethod, pl.shipments.pickupMethod.LOCKER);
        expect(screen.queryByRole("button", {name: pl.shipments.deliveryPointMap.open})).not.toBeInTheDocument();
        selectOption(pl.shipments.form.fields.deliveryMethod, pl.shipments.deliveryMethod.PICKUP_POINT);
        expect(screen.getByRole("button", {name: pl.shipments.deliveryPointMap.open})).toBeInTheDocument();
        selectOption(pl.shipments.form.fields.deliveryMethod, pl.shipments.deliveryMethod.COURIER);
        expect(screen.queryByRole("button", {name: pl.shipments.deliveryPointMap.open})).not.toBeInTheDocument();
    });

    it.each(["LOCKER", "PICKUP_POINT"] as const)(
        "loads points and reopens the %s map without changing the form",
        async (method) => {
        renderForm();
        fireEvent.change(screen.getByLabelText(pl.shipments.form.fields.amount), {target: {value: "37"}});
        selectOption(pl.shipments.form.fields.deliveryMethod, pl.shipments.deliveryMethod[method]);
        const trigger = screen.getByRole("button", {name: pl.shipments.deliveryPointMap.open});
        trigger.focus();
        fireEvent.click(trigger);

        const title = method === "LOCKER" ? pl.shipments.deliveryPointMap.lockerTitle : pl.shipments.deliveryPointMap.pickupTitle;
        const dialog = screen.getByRole("dialog", {name: title});
        const map = within(dialog).getByRole("region", {name: pl.shipments.deliveryPointMap.mapLabel});
        const close = within(dialog).getByRole("button", {name: pl.common.close});
        expect(close).toHaveFocus();
        expect(map).toHaveClass("leaflet-container");
        expect(map.querySelector(".leaflet-tile-pane")).toBeInTheDocument();
        await waitFor(() => expect(map.querySelectorAll(".leaflet-marker-icon")).toHaveLength(1));
        expect(PickupPointService.findEligible).toHaveBeenCalledWith({
            capability: "COLLECTION",
            type: method === "LOCKER" ? "PARCEL_LOCKER" : "SERVICE_POINT",
            countryCode: "PL",
            shipmentSize: "SMALL",
            hasDangerousGoods: false,
            query: undefined,
            size: 100,
            page: 0,
        });
        expect(within(dialog).getByText(
            pl.shipments.deliveryPointMap.loaded.replace("{count}", "1"),
        )).toBeInTheDocument();
        fireEvent.keyDown(close, {key: "Escape"});
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
        expect(screen.getByLabelText(pl.shipments.form.fields.amount)).toHaveValue(37);
        expect(screen.getByRole("combobox", {name: pl.shipments.form.fields.deliveryMethod}))
            .toHaveTextContent(pl.shipments.deliveryMethod[method]);

        fireEvent.click(trigger);
        const reopenedMap = screen.getByRole("region", {name: pl.shipments.deliveryPointMap.mapLabel});
        expect(reopenedMap).toHaveClass("leaflet-container");
        await waitFor(() => expect(reopenedMap.querySelectorAll(".leaflet-marker-icon")).toHaveLength(1));
        fireEvent.click(screen.getByRole("button", {name: pl.common.close}));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        },
    );

    it("searches by address and selects a delivery point", async () => {
        renderForm();
        selectOption(pl.shipments.form.fields.deliveryMethod, pl.shipments.deliveryMethod.PICKUP_POINT);
        fireEvent.click(screen.getByRole("button", {name: pl.shipments.deliveryPointMap.open}));

        const dialog = screen.getByRole("dialog", {name: pl.shipments.deliveryPointMap.pickupTitle});
        await waitFor(() => expect(within(dialog).getByText("BER-001 · Berlin Zentrum")).toBeInTheDocument());
        fireEvent.change(within(dialog).getByLabelText(pl.shipments.deliveryPointMap.searchLabel), {
            target: {value: "Invalidenstraße Berlin"},
        });
        const searchButton = within(dialog).getByRole("button", {name: pl.shipments.deliveryPointMap.search});
        fireEvent.click(searchButton);

        await waitFor(() => expect(PickupPointService.findEligible).toHaveBeenLastCalledWith(
            expect.objectContaining({query: "Invalidenstraße Berlin", page: 0}),
        ));
        await waitFor(() => expect(searchButton).toBeEnabled());
        const map = within(dialog).getByRole("region", {name: pl.shipments.deliveryPointMap.mapLabel});
        await waitFor(() => expect(map.querySelector(".leaflet-marker-icon")).toBeInTheDocument());
        fireEvent.click(map.querySelector(".leaflet-marker-icon")!);
        fireEvent.click(within(dialog).getByRole("button", {name: pl.shipments.deliveryPointMap.select}));

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.getByText(pl.shipments.deliveryPointMap.selected)).toBeInTheDocument();
        expect(screen.getByText("BER-001 · Berlin Zentrum")).toBeInTheDocument();
        expect(screen.getByText("Invalidenstraße 1, Berlin")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", {name: pl.shipments.actions.create}));
        await waitFor(() => expect(ShipmentService.create).toHaveBeenCalledWith(
            expect.objectContaining({
                deliveryPickupPointId: {value: "11f6a9b0-e529-4ff4-bf40-865d246f6138"},
            }),
        ));
    });
});
