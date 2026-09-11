import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import pl from "../../i18n/translate";
import HomeModuleTiles from "./HomeModuleTiles";

test("opens and closes the global module drawer from the compact edge handle", () => {
    render(
        <MemoryRouter>
            <HomeModuleTiles operationalProfile="warehouse" />
        </MemoryRouter>,
    );

    const trigger = screen.getByRole("button", {name: pl.home.dashboard.quickLinks.open});
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);

    expect(screen.queryByRole("button", {name: pl.home.dashboard.quickLinks.open})).not.toBeInTheDocument();
    expect(screen.getByText(pl.home.tiles.shipmentList.title)).toBeInTheDocument();

    fireEvent.keyDown(window, {key: "Escape"});

    expect(screen.getByRole("button", {name: pl.home.dashboard.quickLinks.open})).toHaveAttribute(
        "aria-expanded",
        "false",
    );
});
