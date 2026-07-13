import React from "react";
import {render, screen, waitFor} from "@testing-library/react";
import {AppThemeProvider, THEME_STORAGE_KEY, useAppTheme} from "./ThemeProvider";

function ThemeProbe() {
    const {resolvedTheme, theme} = useAppTheme();

    return <span>{`${theme}:${resolvedTheme}`}</span>;
}

describe("AppThemeProvider", () => {
    afterEach(() => {
        window.localStorage.clear();
        delete document.documentElement.dataset.theme;
        document.documentElement.style.colorScheme = "";
    });

    it.each([
        "electric-blue",
        "ultraviolet",
        "graphite-deep",
        "acid-lime",
    ])("restores and applies the %s theme", async (theme) => {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);

        render(
            <AppThemeProvider>
                <ThemeProbe />
            </AppThemeProvider>,
        );

        expect(screen.getByText(`${theme}:${theme}`)).toBeInTheDocument();
        await waitFor(() => expect(document.documentElement.dataset.theme).toBe(theme));
        expect(document.documentElement.style.colorScheme).toBe("dark");
    });

    it.each([
        "volcanic",
        "dispatch-teal",
        "graphite-soft",
        "graphite-steel",
        "graphite-contrast",
    ])("rejects the removed %s theme", async (theme) => {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);

        render(
            <AppThemeProvider>
                <ThemeProbe />
            </AppThemeProvider>,
        );

        expect(screen.getByText("system:logistics-light")).toBeInTheDocument();
        await waitFor(() => expect(document.documentElement.dataset.theme).toBe("logistics-light"));
        expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
    });
});
