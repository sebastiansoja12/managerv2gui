import React from "react";
import {fireEvent, render, screen, within} from "@testing-library/react";
import AppTabs from "./AppTabs";
import {AppTabDefinition} from "./types";

const openTabs: AppTabDefinition[] = [
    {label: "Strona startowa", path: "/"},
    {label: "Procesy", path: "/processes"},
    {label: "Czat", path: "/chat"},
];

const renderTabs = () => {
    const handlers = {
        onCloseAllTabs: jest.fn(),
        onCloseOtherTabs: jest.fn(),
        onCloseTab: jest.fn(),
        onCloseTabsToRight: jest.fn(),
        onSelectTab: jest.fn(),
        onTogglePinnedTab: jest.fn(),
    };
    render(<AppTabs activePath="/processes" openTabs={openTabs} {...handlers} />);
    return handlers;
};

describe("AppTabs", () => {
    it("selects and closes tabs from the tab row", () => {
        const handlers = renderTabs();

        fireEvent.click(screen.getByRole("button", {name: "Czat"}));
        expect(handlers.onSelectTab).toHaveBeenCalledWith("/chat");

        fireEvent.click(screen.getByRole("button", {name: "Zamknij kartę: Procesy"}));
        expect(handlers.onCloseTab).toHaveBeenCalledWith("/processes");
    });

    it("never offers closing or pinning the home tab", () => {
        const handlers = renderTabs();

        expect(screen.queryByRole("button", {name: "Zamknij kartę: Strona startowa"})).not.toBeInTheDocument();
        fireEvent(
            screen.getByRole("button", {name: "Strona startowa"}),
            new MouseEvent("auxclick", {bubbles: true, button: 1}),
        );
        expect(handlers.onCloseTab).not.toHaveBeenCalled();

        fireEvent.contextMenu(screen.getByRole("button", {name: "Strona startowa"}), {clientX: 40, clientY: 30});
        const menu = screen.getByRole("menu", {name: "Akcje karty: Strona startowa"});
        expect(within(menu).queryByRole("menuitem", {name: "Przypnij kartę"})).not.toBeInTheDocument();
        expect(within(menu).queryByRole("menuitem", {name: "Zamknij kartę"})).not.toBeInTheDocument();
        expect(within(menu).getByRole("menuitem", {name: "Zamknij pozostałe"})).toBeEnabled();
    });

    it("closes a tab with the middle mouse button", () => {
        const handlers = renderTabs();

        fireEvent(
            screen.getByRole("button", {name: "Czat"}),
            new MouseEvent("auxclick", {bubbles: true, button: 1}),
        );
        expect(handlers.onCloseTab).toHaveBeenCalledWith("/chat");
    });

    it("runs tab actions from the context menu", () => {
        const handlers = renderTabs();

        fireEvent.contextMenu(screen.getByRole("button", {name: "Czat"}), {clientX: 40, clientY: 30});
        const menu = screen.getByRole("menu", {name: "Akcje karty: Czat"});
        expect(within(menu).getByRole("menuitem", {name: "Zamknij karty po prawej"})).toBeDisabled();

        fireEvent.click(within(menu).getByRole("menuitem", {name: "Przypnij kartę"}));
        expect(handlers.onTogglePinnedTab).toHaveBeenCalledWith("/chat");
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();

        fireEvent.contextMenu(screen.getByRole("button", {name: "Procesy"}), {clientX: 40, clientY: 30});
        fireEvent.click(screen.getByRole("menuitem", {name: "Zamknij pozostałe"}));
        expect(handlers.onCloseOtherTabs).toHaveBeenCalledWith("/processes");
    });

    it("filters every open tab in the all tabs list", () => {
        const handlers = renderTabs();

        fireEvent.click(screen.getByRole("button", {name: "Wszystkie otwarte karty: 3"}));
        const panel = screen.getByRole("dialog", {name: "Wszystkie karty"});
        fireEvent.change(within(panel).getByRole("searchbox"), {target: {value: "cza"}});

        expect(within(panel).queryByRole("button", {name: /^Procesy/})).not.toBeInTheDocument();
        fireEvent.click(within(panel).getByRole("button", {name: /^Czat/}));
        expect(handlers.onSelectTab).toHaveBeenCalledWith("/chat");
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
});
