import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import AppTabs, {getVisibleTabIndexes} from "./AppTabs";

describe("getVisibleTabIndexes", () => {
    it("shows every tab when they fit in the strip", () => {
        expect(getVisibleTabIndexes([100, 100, 100], 310, 54, 0)).toEqual([0, 1, 2]);
    });

    it("reserves room for the overflow control", () => {
        expect(getVisibleTabIndexes([100, 100, 100, 100], 270, 54, 0)).toEqual([0, 1]);
    });

    it("keeps the selected tab visible when a later tab is active", () => {
        expect(getVisibleTabIndexes([100, 100, 100, 100], 270, 54, 3)).toEqual([0, 3]);
    });

    it("moves all tabs to the overflow menu when the strip is too narrow", () => {
        expect(getVisibleTabIndexes([100, 100], 120, 54, 1)).toEqual([]);
    });

    it("opens a list containing only the tabs that do not fit", async () => {
        const rectSpy = jest.spyOn(HTMLElement.prototype, "getBoundingClientRect")
            .mockImplementation(function (this: HTMLElement) {
                const width = this.classList.contains("app-tab-measure")
                    ? 100
                    : this.classList.contains("app-tabs-overflow-measure")
                        ? 54
                        : this.classList.contains("app-tab-strip")
                            ? 170
                            : 0;
                return {bottom: 0, height: 0, left: 0, right: width, top: 0, width, x: 0, y: 0, toJSON: () => ({})};
            });
        const onSelectTab = jest.fn();

        render(
            <AppTabs
                activePath="/"
                onCloseAllTabs={jest.fn()}
                onCloseTab={jest.fn()}
                onSelectTab={onSelectTab}
                openTabs={[
                    {label: "Strona startowa", path: "/"},
                    {label: "Procesy", path: "/processes"},
                    {label: "Czat", path: "/chat"},
                ]}
            />,
        );
        fireEvent(window, new Event("resize"));

        const overflowTrigger = await screen.findByRole("button", {
            name: "Pokaż pozostałe otwarte karty: 2",
        });
        fireEvent.click(overflowTrigger);

        const overflowGroup = screen.getByRole("group", {name: "Pozostałe otwarte karty"});
        expect(within(overflowGroup).getByRole("button", {name: "Procesy"})).toBeInTheDocument();
        expect(within(overflowGroup).getByRole("button", {name: "Czat"})).toBeInTheDocument();
        expect(within(overflowGroup).queryByRole("button", {name: "Strona startowa"})).not.toBeInTheDocument();

        fireEvent.click(within(overflowGroup).getByRole("button", {name: "Procesy"}));
        expect(onSelectTab).toHaveBeenCalledWith("/processes");
        await waitFor(() => expect(screen.queryByRole("group", {name: "Pozostałe otwarte karty"})).not.toBeInTheDocument());

        rectSpy.mockRestore();
    });
});
