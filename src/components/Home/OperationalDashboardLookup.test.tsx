import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import pl from "../../i18n/translate";
import {OperatorCapabilitiesContext} from "../AppShell/OperatorCapabilitiesContext";
import OperationalDashboard from "./OperationalDashboard";

test("opens shipment details from the operational dashboard using the selected lookup criterion", async () => {
    const onOpenTab = jest.fn();
    render(
        <MemoryRouter>
            <OperationalDashboard onOpenTab={onOpenTab} />
        </MemoryRouter>,
    );

    expect(screen.queryByText(pl.home.title)).not.toBeInTheDocument();
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

test("hides return dashboard sections when the operator cannot use returns", () => {
    render(
        <OperatorCapabilitiesContext.Provider value={{returnsStatus: "unavailable"}}>
            <MemoryRouter>
                <OperationalDashboard />
            </MemoryRouter>
        </OperatorCapabilitiesContext.Provider>,
    );

    expect(screen.queryByText(pl.home.dashboard.metrics.returns)).not.toBeInTheDocument();
    expect(screen.queryByText(pl.home.dashboard.returns.title)).not.toBeInTheDocument();
});
