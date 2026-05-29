# Manager v2 GUI - AI Agent Instructions

This file describes how AI agents should work in the `managerv2gui` repository.
Follow it together with the general repository instructions from the parent
workspace.

## 1. Project Context

- This is a React 18 / TypeScript application generated with Create React App.
- The UI is an operational logistics dashboard for Manager 2.0.
- The project uses Material UI, React Router, Axios, Leaflet and Jest/React Testing Library.
- The app talks to the Manager backend through typed service wrappers in `src/hooks`.
- Default language is Polish, but UI copy must exist in Polish, English and German.
- The main app profile is `warehouse`; some routes are also available for the `courier` profile.

## 2. Do Not Overwrite User Work

- Check `git status --short` before editing when the task touches existing files.
- Do not revert or remove unrelated changes, especially files with `AD`, `M` or untracked status.
- If a file already has user changes, read it before editing and keep your patch tightly scoped.
- Never run destructive Git commands unless the user explicitly asks for them.

## 3. Code Style

- Use TypeScript and React function components.
- Prefer existing local patterns over new abstractions.
- Keep component state local unless the feature already has a shared service/store pattern.
- Create reusable model/types in separate files when the data is shared between components or services.
- Keep API DTOs close to the feature that owns them, following existing folders such as `src/components/Shipment/dto`.
- Avoid hardcoded labels, statuses and user-facing messages.
- Keep imports sorted by local style: React first, libraries next, local modules after that.
- Use explicit domain names for variables and functions; avoid vague names like `data2`, `itemTemp` or `handleClick2`.

## 4. Internationalization

- Always use `src/i18n/translate.ts` for UI text:
  - Import it as `pl` because that is the existing convention.
  - Example: `import pl from "../../i18n/translate";`
- Add every new UI string to all translation files:
  - `src/i18n/pl.ts`
  - `src/i18n/en.ts`
  - `src/i18n/de.ts`
- Keep the same object path in all languages.
- Do not use Polish strings directly in JSX, alerts, placeholders, button labels, tooltips or aria labels.
- If a backend value needs a readable label, add a translation map instead of displaying raw enum text.

## 5. API and Data Access

- Prefer existing services in `src/hooks` before creating a new one.
- For backend calls use `BackendClient` from `src/api/BackendClient.ts`.
- Use the configured Axios clients instead of raw `axios`:
  - `src/http-common.ts` for the main Manager API.
  - `src/http-gateway.ts` for gateway calls.
  - `src/http-software-common.ts` for software configuration.
  - `src/http-super-admin.ts` for super-admin calls.
- Do not duplicate CSRF, cookie or refresh-token logic. It belongs in `src/auth/configureAuthenticatedClient.ts`.
- Ask the backend only when the data is not already available in component state, props or an existing response.
- Handle backend errors with `getBackendErrorMessage` from `src/api/errorMessage.ts`.
- Keep bigint-like shipment identifiers as strings. The main HTTP client already normalizes shipment IDs.

## 6. Routing and Navigation

- Main routes live in `src/components/AppShell/AppRoutes.tsx`.
- Tab titles and dynamic titles live in `src/components/AppShell/tabConfig.ts`.
- Profile access rules live in `src/config/operationalProfile.ts`.
- When adding a route, update all related places:
  - route definition,
  - tab title,
  - translations,
  - operational profile access if needed,
  - dashboard/navigation entry if the screen should be discoverable.
- Use `ModulePlaceholder` for planned modules that do not have a real implementation yet.

## 7. Components and Styling

- Put feature components under `src/components/<FeatureName>`.
- Put feature-specific CSS under `src/components/<FeatureName>/styles`.
- Reuse the existing CSS files and class naming style for the feature being edited.
- Use Material UI components where the project already uses them for the same pattern.
- Prefer icon buttons with labels/tooltips for compact actions.
- Keep operational screens dense, readable and workflow-oriented.
- Do not introduce large landing-page sections, marketing copy or decorative-only UI.
- Make loading, empty, success and error states explicit for data-driven screens.
- Ensure controls have accessible labels, especially icon buttons and form fields.

## 8. Forms and Validation

- Keep form state typed.
- Use existing DTO/model types when possible.
- Do not submit incomplete requests silently. Validate required UI fields before calling services.
- For dialogs, reset stale errors and success messages when opening or switching edited records.
- Keep create/edit request objects close to the feature model or service that uses them.

## 9. Tests

- Existing test stack is Jest and React Testing Library.
- Add or update focused tests when changing:
  - routing behavior,
  - service-facing data mapping,
  - translated status/event labels,
  - form validation,
  - conditional rendering for loading/error/empty states.
- Prefer component-level tests next to the feature, following files such as:
  - `HomeDashboardLookup.test.tsx`
  - `DangerousGoodForm.test.tsx`
  - `shipmentEventDescription.test.ts`
- Run targeted tests when practical:

```bash
npm test -- --watchAll=false <test-name-or-path>
```

- Run a production build after broad TypeScript, routing or dependency changes:

```bash
npm run build
```

## 10. Environment and Configuration

- Local defaults are in `.env`.
- Create React App requires public build-time variables to start with `REACT_APP_`.
- Important variables include:
  - `REACT_APP_SERVER_URL`
  - `REACT_APP_MANAGER_API_URL`
  - `REACT_APP_GATEWAY_URL`
  - `REACT_APP_SOFTWARE_CONFIGURATION_URL`
  - `REACT_APP_DELIVERY_PROTECTION_URL`
  - `REACT_APP_RETURNING_TRACK_MANAGER_URL`
  - `REACT_APP_ROUTE_TRACKER_FLOW_URL`
  - `REACT_APP_VERSION`
  - `REACT_APP_MAP_TILE_URL`
  - `REACT_APP_MAP_TILE_ATTRIBUTION`
- Do not commit secrets. `.env` should contain only local development defaults.
- The Docker image serves the built app through Nginx using `docker/nginx/default.conf`.

## 11. Documentation

- Update `README.md` when adding a meaningful new area, script, service dependency or environment variable.
- Update `CHANGELOG.md` when the user asks for release notes or when work clearly belongs in release documentation.
- Keep documentation short and factual; describe what exists in this project, not intended future behavior.

## 12. Completion Checklist

Before finishing a task, verify the relevant items:

- UI text is translated in `pl`, `en` and `de`.
- API calls go through the proper service and authenticated HTTP client.
- New routes are registered in routing, tab titles and profile access rules if needed.
- Loading, error and empty states are handled.
- Focused tests were added or updated for behavior changes.
- `npm test -- --watchAll=false <target>` or `npm run build` was run when practical.
- `git diff --check` passes for edited files.
