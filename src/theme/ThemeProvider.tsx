import React from "react";

export type AppTheme =
    | "system"
    | "logistics-light"
    | "operations-dark"
    | "warehouse"
    | "night-shift"
    | "neon-dark"
    | "cyberpunk"
    | "terminal-green"
    | "arctic-dark"
    | "graphite-red"
    | "electric-blue"
    | "ultraviolet"
    | "graphite-deep"
    | "acid-lime"
    | "deep-ocean"
    | "aubergine"
    | "midnight-blue"
    | "carbon"
    | "courier-blue";

type ThemeContextValue = {
    theme: AppTheme;
    resolvedTheme: Exclude<AppTheme, "system">;
    setTheme: (theme: AppTheme) => void;
};

export const THEME_STORAGE_KEY = "manager.theme";

const defaultTheme: AppTheme = "system";
const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

const isTheme = (value: string | null): value is AppTheme => Boolean(value && [
    "system",
    "logistics-light",
    "operations-dark",
    "warehouse",
    "night-shift",
    "neon-dark",
    "cyberpunk",
    "terminal-green",
    "arctic-dark",
    "graphite-red",
    "electric-blue",
    "ultraviolet",
    "graphite-deep",
    "acid-lime",
    "deep-ocean",
    "aubergine",
    "midnight-blue",
    "carbon",
    "courier-blue",
].includes(value));

const prefersDarkMode = () => typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-color-scheme: dark)").matches;

const systemTheme = (): Exclude<AppTheme, "system"> => prefersDarkMode()
    ? "warehouse"
    : "logistics-light";

const resolveTheme = (theme: AppTheme): Exclude<AppTheme, "system"> => theme === "system" ? systemTheme() : theme;

const readInitialTheme = (): AppTheme => {
    try {
        const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
        return isTheme(storedTheme) ? storedTheme : defaultTheme;
    } catch {
        return defaultTheme;
    }
};

const applyTheme = (theme: Exclude<AppTheme, "system">) => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme =
        [
            "warehouse",
            "night-shift",
            "neon-dark",
            "cyberpunk",
            "terminal-green",
            "arctic-dark",
            "graphite-red",
            "electric-blue",
            "ultraviolet",
            "graphite-deep",
            "acid-lime",
            "deep-ocean",
            "aubergine",
            "midnight-blue",
            "carbon",
        ].includes(theme) ? "dark" : "light";
};

export function AppThemeProvider({children}: {children: React.ReactNode}) {
    const [theme, setThemeState] = React.useState<AppTheme>(readInitialTheme);
    const [resolvedTheme, setResolvedTheme] = React.useState<Exclude<AppTheme, "system">>(() => resolveTheme(readInitialTheme()));

    React.useEffect(() => {
        const nextResolvedTheme = resolveTheme(theme);
        setResolvedTheme(nextResolvedTheme);
        applyTheme(nextResolvedTheme);

        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch {
            // The selected theme still works for this browser session when storage is unavailable.
        }
    }, [theme]);

    React.useEffect(() => {
        if (typeof window.matchMedia !== "function") {
            return undefined;
        }

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const updateSystemTheme = () => {
            if (theme === "system") {
                const nextResolvedTheme = systemTheme();
                setResolvedTheme(nextResolvedTheme);
                applyTheme(nextResolvedTheme);
            }
        };

        mediaQuery.addEventListener?.("change", updateSystemTheme);
        return () => mediaQuery.removeEventListener?.("change", updateSystemTheme);
    }, [theme]);

    const value = React.useMemo(() => ({
        theme,
        resolvedTheme,
        setTheme: setThemeState,
    }), [resolvedTheme, theme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useAppTheme = () => {
    const context = React.useContext(ThemeContext);
    if (!context) {
        throw new Error("useAppTheme must be used inside AppThemeProvider");
    }
    return context;
};
