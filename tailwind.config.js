/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                surface: "var(--surface)",
                "surface-secondary": "var(--surface-secondary)",
                elevated: "var(--surface-elevated)",
                card: "var(--card)",
                "card-foreground": "var(--card-foreground)",
                muted: "var(--muted)",
                "muted-foreground": "var(--muted-foreground)",
                border: "var(--border)",
                "border-strong": "var(--border-strong)",
                primary: "var(--primary)",
                "primary-hover": "var(--primary-hover)",
                "primary-foreground": "var(--primary-foreground)",
                secondary: "var(--secondary)",
                "secondary-foreground": "var(--secondary-foreground)",
                accent: "var(--accent)",
                "accent-foreground": "var(--accent-foreground)",
                success: "var(--success)",
                warning: "var(--warning)",
                danger: "var(--danger)",
                info: "var(--info)",
                input: "var(--input)",
                ring: "var(--ring)",
            },
            boxShadow: {
                panel: "var(--shadow-panel)",
                floating: "var(--shadow-floating)",
            },
        },
    },
    plugins: [],
};
