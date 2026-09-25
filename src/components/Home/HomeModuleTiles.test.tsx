import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import pl from "../../i18n/translate";
import {OperatorCapabilitiesContext} from "../AppShell/OperatorCapabilitiesContext";
import HomeModuleTiles from "./HomeModuleTiles";

test("opens the module menu on demand from the navbar button and closes it again", () => {
    render(
        <MemoryRouter>
            <HomeModuleTiles operationalProfile="warehouse" />
        </MemoryRouter>,
    );

    const trigger = screen.getByRole("button", {name: pl.home.dashboard.quickLinks.open});
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("complementary", {name: pl.home.dashboard.quickLinks.title})).not.toBeInTheDocument();

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("complementary", {name: pl.home.dashboard.quickLinks.title})).toBeInTheDocument();
    expect(screen.getByText(pl.home.tiles.shipmentList.title)).toBeInTheDocument();

    fireEvent.keyDown(window, {key: "Escape"});
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("opens a tile as a tab and closes the menu", () => {
    const onOpenTab = jest.fn();
    render(
        <MemoryRouter>
            <HomeModuleTiles onOpenTab={onOpenTab} operationalProfile="warehouse" />
        </MemoryRouter>,
    );

    const trigger = screen.getByRole("button", {name: pl.home.dashboard.quickLinks.open});
    fireEvent.click(trigger);
    fireEvent.click(screen.getByText(pl.home.tiles.shipmentList.title));

    expect(onOpenTab).toHaveBeenCalledWith({label: pl.home.tiles.shipmentList.title, path: "/shipments/list"});
    expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("hides returns when the operator has no return capability", () => {
    render(
        <OperatorCapabilitiesContext.Provider value={{returnsStatus: "unavailable"}}>
            <MemoryRouter>
                <HomeModuleTiles operationalProfile="warehouse" />
            </MemoryRouter>
        </OperatorCapabilitiesContext.Provider>,
    );

    fireEvent.click(screen.getByRole("button", {name: pl.home.dashboard.quickLinks.open}));

    expect(screen.queryByText(pl.home.tiles.returns.title)).not.toBeInTheDocument();
});
