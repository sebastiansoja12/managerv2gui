import React from "react";
import {fireEvent, render, screen, within} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import pl from "../../i18n/translate";
import {AppThemeProvider} from "../../theme/ThemeProvider";
import Navbar from "./Navbar";

const renderNavbar = (onOpenTab = jest.fn()) => render(
    <MemoryRouter>
        <AppThemeProvider>
            <Navbar
                activePath="/"
                language="pl"
                onLanguageChange={jest.fn()}
                onOpenTab={onOpenTab}
                onOperationalProfileChange={jest.fn()}
                operationalProfile="warehouse"
            />
        </AppThemeProvider>
    </MemoryRouter>
);

describe("Navbar warehouse menu", () => {
    it("expands pallet submenu on hover and opens selected pallet screen", () => {
        const onOpenTab = jest.fn();
        renderNavbar(onOpenTab);

        fireEvent.click(screen.getByRole("button", {name: pl.navigation.warehouse}));
        const warehouseMenu = screen.getByRole("navigation", {name: pl.navigation.warehouse});
        fireEvent.mouseEnter(within(warehouseMenu).getByRole("button", {name: pl.navigation.pallets}));
        fireEvent.click(within(warehouseMenu).getByRole("button", {name: pl.navigation.palletsCancelled}));

        expect(onOpenTab).toHaveBeenCalledWith(expect.objectContaining({path: "/pallets/cancelled"}));
    });

    it("shows shipments group first with existing shipment screens", () => {
        renderNavbar();

        fireEvent.click(screen.getByRole("button", {name: pl.navigation.warehouse}));
        const warehouseMenu = screen.getByRole("navigation", {name: pl.navigation.warehouse});

        expect(within(warehouseMenu).getByRole("button", {name: pl.navigation.shipments})).toHaveAttribute("aria-expanded", "true");
        expect(within(warehouseMenu).getByRole("button", {name: pl.navigation.shipmentList})).toBeInTheDocument();
        expect(within(warehouseMenu).queryByRole("button", {name: pl.navigation.palletScanner})).not.toBeInTheDocument();
    });

    it("opens create pallet dialog with empty and from-shipments options", () => {
        const onOpenTab = jest.fn();
        renderNavbar(onOpenTab);

        fireEvent.click(screen.getByRole("button", {name: pl.navigation.warehouse}));
        const warehouseMenu = screen.getByRole("navigation", {name: pl.navigation.warehouse});
        fireEvent.mouseEnter(within(warehouseMenu).getByRole("button", {name: pl.navigation.pallets}));
        fireEvent.click(within(warehouseMenu).getByRole("button", {name: pl.navigation.palletCreate}));

        const dialog = screen.getByRole("dialog");
        expect(within(dialog).getByText(pl.pallets.createOptions.empty.title)).toBeInTheDocument();
        fireEvent.click(within(dialog).getByText(pl.pallets.createOptions.fromShipments.title));

        expect(onOpenTab).toHaveBeenCalledWith({
            label: pl.pallets.createFromShipments.title,
            path: "/pallets/create-from-shipments",
        });
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("lists pallet screens in the main navigation panel", () => {
        renderNavbar();

        fireEvent.click(screen.getByRole("button", {name: pl.navigation.mainAriaLabel}));

        expect(screen.getByRole("button", {name: pl.navigation.palletCreate})).toBeInTheDocument();
        expect(screen.getByRole("button", {name: pl.navigation.palletsEmpty})).toBeInTheDocument();
    });
});
