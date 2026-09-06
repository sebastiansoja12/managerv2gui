# Technical UI

`../technical-refresh.css` is an ordered import manifest, not a place for rules.
It is loaded once by `src/index.tsx`, after the original feature styles and
`theme-overrides.css`. Keep this order: it preserves the existing cascade while
the legacy components are being migrated.

## Ownership

- Skin colors remain in `src/index.css`; `ThemeProvider.tsx` selects the skin.
- This directory owns shared typography, controls, dialogs, tables and statuses.
- Feature styling belongs in `src/components/<Feature>/styles/technical-*.css`.
  Shipment catalog, creation, details and history have separate files; courier
  list, details, dialogs and responsive rules are also separated.
- `legacy-surfaces.css` and `legacy-feature-bridge.css` adapt old markup. They are
  compatibility layers, not a pattern for new components.
- `external-shells-and-responsive.css` preserves the earlier login/shell cascade.

## Changing a screen

1. Change its feature sheet; change a shared file only for a genuinely shared rule.
2. Reuse `--foreground`, `--background`, `--card`, `--surface`, `--border` and
   semantic status tokens. Never introduce a light-only hex color for UI chrome.
   Map tiles and QR-code pixels are deliberate exceptions.
3. Keep page headings in `--font-display`, body/section headings in `--font-ui`,
   and metadata in `--font-mono`. Primary actions use foreground/background;
   destructive actions keep their semantic color.
4. Avoid new `!important` overrides and selectors based on class-name suffixes.
   Existing ones are retained for compatibility with legacy feature sheets.
5. Register a new feature sheet in the manifest, not inside a route component.
   This keeps styles independent of which page was opened first.
6. Run `npm run check:styles`, the component tests and `npm run build`.
   Visually check a light and dark skin, narrow widths and long dialogs.

The initial split was verified byte-for-byte against the original concatenated
stylesheet before the UI corrections were applied.
