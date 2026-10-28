import React from "react";
import {fireEvent, render, screen, within} from "@testing-library/react";
import AppTabs from "./AppTabs";
import {AppTabDefinition} from "./types";

const openTabs: AppTabDefinition[] = [
    {label: "Strona startowa", path: "/", pinned: true},
    {label: "Procesy", path: "/processes"},
    {label: "Czat", path: "/chat", preview: true},
];

const renderTabs = () => {
    const handlers = {
        onCloseAllTabs: jest.fn(),
        onCloseOtherTabs: jest.fn(),
        onCloseTab: jest.fn(),
        onCloseTabsToRight: jest.fn(),
        onKeepTab: jest.fn(),
        onSelectTab: jest.fn(),
        onTogglePinnedTab: jest.fn(),
    };
    render(<AppTabs activePath="/processes" openTabs={openTabs} {...handlers} />);
    return handlers;
};

describe("AppTabs", () => {
    it("selects, keeps and closes tabs from the tab row", () => {
        const handlers = renderTabs();

        fireEvent.click(screen.getByRole("button", {name: "Czat"}));
        expect(handlers.onSelectTab).toHaveBeenCalledWith("/chat");

        fireEvent.doubleClick(screen.getByRole("button", {name: "Czat"}));
        expect(handlers.onKeepTab).toHaveBeenCalledWith("/chat");

        fireEvent.click(screen.getByRole("button", {name: "Zamknij kartę: Procesy"}));
        expect(handlers.onCloseTab).toHaveBeenCalledWith("/processes");
    });

    it("does not offer closing a pinned tab directly", () => {
        renderTabs();

        expect(screen.queryByRole("button", {name: "Zamknij kartę: Strona startowa"})).not.toBeInTheDocument();
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
