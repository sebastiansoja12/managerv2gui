import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import pl from "../../i18n/translate";
import HomeDashboard from "./HomeDashboard";

test("opens shipment details using the selected lookup criterion", async () => {
    const onOpenTab = jest.fn();
    render(
        <MemoryRouter>
            <HomeDashboard onOpenTab={onOpenTab} operationalProfile="warehouse" />
        </MemoryRouter>,
    );

    fireEvent.mouseDown(screen.getByLabelText(pl.home.trackingLookup.criterionLabel));
    fireEvent.click(await screen.findByRole("option", {name: pl.home.trackingLookup.criteria.shipmentId}));
    fireEvent.change(screen.getByPlaceholderText(pl.home.trackingLookup.shipmentIdPlaceholder), {
        target: {value: "123"},
    });
    fireEvent.click(screen.getByRole("button", {name: pl.home.trackingLookup.search}));

    expect(onOpenTab).toHaveBeenCalledWith({
        label: "Szczegóły przesyłki #123",
        path: "/shipments/123/edit",
    });
});
