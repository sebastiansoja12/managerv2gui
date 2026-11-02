import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import {NavbarTrackingSearch} from "./Navbar";

describe("NavbarTrackingSearch", () => {
    it("opens shipment details for the entered tracking number", () => {
        const onOpenTab = jest.fn();
        render(<NavbarTrackingSearch onOpenTab={onOpenTab} />);

        const input = screen.getByRole("searchbox", {name: "Numer trackingowy przesyłki"});
        fireEvent.change(input, {target: {value: "  MGR/2026  "}});
        fireEvent.submit(screen.getByRole("form", {name: "Szybkie wyszukiwanie przesyłki"}));

        expect(onOpenTab).toHaveBeenCalledWith({
            label: "Szczegóły przesyłki MGR/2026",
            path: "/shipments/tracking/MGR%2F2026/edit",
        });
        expect(input).toHaveValue("");
    });

    it("ignores an empty submission", () => {
        const onOpenTab = jest.fn();
        render(<NavbarTrackingSearch onOpenTab={onOpenTab} />);

        fireEvent.submit(screen.getByRole("form", {name: "Szybkie wyszukiwanie przesyłki"}));

        expect(onOpenTab).not.toHaveBeenCalled();
    });

    it("focuses the field on Ctrl+K", () => {
        render(<NavbarTrackingSearch onOpenTab={jest.fn()} />);

        fireEvent.keyDown(document, {key: "k", ctrlKey: true});

        expect(screen.getByRole("searchbox", {name: "Numer trackingowy przesyłki"})).toHaveFocus();
    });

    it("clears the field when Escape is pressed", () => {
        render(<NavbarTrackingSearch onOpenTab={jest.fn()} />);

        const input = screen.getByRole("searchbox", {name: "Numer trackingowy przesyłki"});
        fireEvent.change(input, {target: {value: "MGR"}});
        fireEvent.keyDown(input, {key: "Escape"});

        expect(input).toHaveValue("");
    });
});
