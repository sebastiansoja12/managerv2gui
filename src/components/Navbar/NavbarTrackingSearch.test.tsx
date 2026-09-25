import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import {NavbarTrackingSearch} from "./Navbar";

describe("NavbarTrackingSearch", () => {
    it("opens shipment details for the entered tracking number", () => {
        const onClose = jest.fn();
        const onOpenTab = jest.fn();
        render(<NavbarTrackingSearch onClose={onClose} onOpenTab={onOpenTab} open />);

        const input = screen.getByRole("searchbox", {name: "Numer trackingowy przesyłki"});
        fireEvent.change(input, {target: {value: "  MGR/2026  "}});
        fireEvent.submit(screen.getByRole("form", {name: "Szybkie wyszukiwanie przesyłki"}));

        expect(onOpenTab).toHaveBeenCalledWith({
            label: "Szczegóły przesyłki MGR/2026",
            path: "/shipments/tracking/MGR%2F2026/edit",
        });
        expect(onClose).toHaveBeenCalled();
    });

    it("closes after a pointer interaction outside the search field", () => {
        const onClose = jest.fn();
        render(<NavbarTrackingSearch onClose={onClose} onOpenTab={jest.fn()} open />);

        fireEvent.pointerDown(document.body);

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes when Escape is pressed", () => {
        const onClose = jest.fn();
        render(<NavbarTrackingSearch onClose={onClose} onOpenTab={jest.fn()} open />);

        fireEvent.keyDown(document, {key: "Escape"});

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
