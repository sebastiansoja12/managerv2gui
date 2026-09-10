# Manager 2.0 GUI

**Development Version 2026.3 - 10th September, 2026**

Manager 2.0 GUI is a React/TypeScript frontend for the Manager 2.0 logistics
backend. It provides warehouse, shipment, process, department, courier, user and
configuration screens, plus a separate super-admin area.

## Technology

- React 18 with TypeScript
- Create React App / `react-scripts`
- Material UI
- React Router
- Axios HTTP clients
- Leaflet for shipment route maps
- QR code generation for shipment labels
- Jest and React Testing Library

## Main Features

- Login flow and authenticated HTTP clients.
- Tabbed application shell with route-aware tab titles.
- Home dashboard with operational module tiles.
- Shipment list, create form, details/edit view and shipment history, including pickup and delivery methods.
- Pickup-point catalog with creation, editing, lifecycle actions, filters and a location map.
- Pickup-point selection from a searchable street/city map during shipment creation and editing; the selected point ID is stored on the shipment while its code is shown to users.
- Shipment history map with department routes and translated event labels.
- Dangerous goods form and shipment dangerous-good handling.
- Shipment document download, QR label preview and print support.
- Return registration, list and detail views, processing/completion/cancellation actions, reason updates and token validation.
- Department list and department creation.
- Courier list, details and courier creation.
- Process list and process details.
- User management with create, edit, role and permission dialogs.
- Organization chat backed by the real organization user directory and persistent REST conversations, with search and conversation bubbles grouped in the bottom-right dock.
- Device pairing.
- Global configuration, geocoding configuration and integration configuration panels.
- Software configuration list.
- Microservice status page.
- User profile page.
- Super-admin application with its own login and operator management UI.
- Polish, English and German translations.

Some routes are placeholders for planned modules, for example analytics,
vehicles, pallets, scanner, courier deliveries, suppliers, deals, billing and
support.

## Project Structure

| Path | Purpose |
| --- | --- |
| `src/components` | Application pages and UI modules. |
| `src/components/AppShell` | Main layout, routing, tabs and tab persistence. |
| `src/components/PickupPoints` | Pickup-point catalog, editor, map, selection models and feature styles. |
| `src/components/Chat` | Organization chat directory, docked conversations, message state and presence tracking. |
| `src/auth` | Authentication session and user profile types. |
| `src/hooks` | API service hooks and domain-specific HTTP wrappers. |
| `src/api` | Shared backend client and API result/error helpers. |
| `src/config` | Application version, environment and operational profile settings. |
| `src/i18n` | `pl`, `en`, `de` translations and language helpers. |
| `src/theme` | Shared visual theme. |
| `src/utils` | Small shared utilities. |
| `docker/nginx` | Nginx configuration used by the production Docker image. |

## Configuration

The project uses Create React App environment variables. Local defaults are kept
in `.env`.

Important variables:

- `REACT_APP_SERVER_URL` - main Manager API, default `http://localhost:8080/v2/api`
- `REACT_APP_MANAGER_API_URL` - manager API alias
- `REACT_APP_GATEWAY_URL` - gateway URL, default `http://localhost:8088/gateway`
- `REACT_APP_SOFTWARE_CONFIGURATION_URL` - software configuration service
- `REACT_APP_DELIVERY_PROTECTION_URL` - delivery protection service
- `REACT_APP_RETURNING_TRACK_MANAGER_URL` - returning service
- `REACT_APP_ROUTE_TRACKER_FLOW_URL` - route tracker service
- `REACT_APP_VERSION` - displayed application version
- `REACT_APP_MAP_TILE_URL` - Leaflet tile URL template
- `REACT_APP_MAP_TILE_ATTRIBUTION` - attribution displayed on the map

If the map tile variables are not set, the application uses
`https://tile.openstreetmap.org/{z}/{x}/{y}.png` with OpenStreetMap attribution.

## Available Scripts

UI styling is split between shared controls and feature-owned styles. See
[Technical UI](src/theme/technical/README.md) for file ownership and cascade rules.
Check stylesheet imports and core text contrast across saved skins with:

```bash
npm run check:styles
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

Run tests:

```bash
npm test -- --watchAll=false
```

Build production assets:

```bash
npm run build
```

## Docker

The Docker image builds the React app with Node 20 and serves the generated
static files with Nginx on port `80`.

```bash
docker build -t manager-v2-gui .
```

Relevant build arguments:

- `REACT_APP_SERVER_URL`
- `REACT_APP_GATEWAY_URL`
- `REACT_APP_VERSION`
- `REACT_APP_ENVIRONMENT`

## Backend Expectations

For local development the frontend expects the Manager backend on
`http://localhost:8080/v2/api` and the Gateway on `http://localhost:8088/gateway`.
Authentication is cookie/JWT based and the backend CORS configuration must allow
the GUI origin, usually `http://localhost:3000`.

Release notes are maintained in `CHANGELOG.md`.

## Pickup Points and Shipments

The `/pickup-points` route provides the operator's pickup-point catalog and map.
Search accepts names, codes, streets and cities, while moving the map requests
points inside the visible bounding box. Creating and editing a point sends its
address to the backend; coordinates are returned after server-side resolution.

Shipment create and edit forms open a delivery-point map for pickup-point or
locker methods. Selecting a marker stores the pickup-point identifier in the
shipment request. Shipment details resolve the identifier to a human-readable
pickup-point code. Eligibility requests include country, point type, shipment
size and dangerous-goods information.

## Returns

Return lists and the processing and completion actions use the Manager API under
`/shipments/returns`. A shipment without `RETURN` status does not request return
details, and unavailable optional return data hides only the return summary
instead of blocking the shipment view. Reason-code changes and token validation
continue to use the configured returning-service client.

## Chat Presence and Notifications

The green indicator means that a user has an active WebSocket connection from a
visible application tab. Every tab has its own STOMP session, and the backend
publishes the online-user list through `/user/queue/chat/presence`. Hiding a tab,
losing the connection or logging out removes presence through connection events
without REST polling. Unread conversation tiles remain highlighted until the
conversation is viewed, and notification counters are shared across views in the
current GUI session.
