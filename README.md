# Manager 2.0 GUI

**English** | [Polski](README.pl.md) | [Deutsch](README.de.md)

**Development Version 2026.4 - 10th September, 2026**

Manager 2.0 GUI is a React/TypeScript frontend for the Manager 2.0 logistics
backend. It provides warehouse, shipment, process, department, courier, user and
configuration screens, plus a separate super-admin area.

![Department dashboard](docs/screenshots/en/light/dashboard.png)

## About the Application

Manager 2.0 is a back-office application for parcel logistics companies. After
signing in, an employee sees the dashboard of their own department: shipment
counts, active returns, turnover, a 7/14/30-day volume chart and a map of
connected departments. From the top menu they register and track shipments,
handle deliveries and returns, build pallets, manage departments with their
delivery areas and warehouse floor plans, maintain pickup points and lockers,
review backend processes and talk to colleagues in the organization chat.
Every screen opens in its own tab, so several shipments or departments can be
worked on side by side. The interface is dense and table-driven, with maps
(OpenStreetMap/Leaflet) wherever location matters. It is available in Polish,
English and German and comes with a set of themes; the screenshots below show
Light, Graphite and Warehouse.

## Screenshots

The same screens in three of the available themes. Click a thumbnail or a theme link to open the full-size image.

<table>
  <tr>
    <th>Light</th>
    <th>Graphite</th>
    <th>Warehouse</th>
  </tr>
  <tr>
    <td><a href="docs/screenshots/en/light/dashboard.png"><img src="docs/screenshots/en/light/dashboard.png" alt="Dashboard – Light"></a></td>
    <td><a href="docs/screenshots/en/graphite/dashboard.png"><img src="docs/screenshots/en/graphite/dashboard.png" alt="Dashboard – Graphite"></a></td>
    <td><a href="docs/screenshots/en/warehouse/dashboard.png"><img src="docs/screenshots/en/warehouse/dashboard.png" alt="Dashboard – Warehouse"></a></td>
  </tr>
</table>

| Screen | What it shows | Light | Graphite | Warehouse |
| --- | --- | --- | --- | --- |
| Dashboard | Department KPIs, turnover chart, network map | [Light](docs/screenshots/en/light/dashboard.png) | [Graphite](docs/screenshots/en/graphite/dashboard.png) | [Warehouse](docs/screenshots/en/warehouse/dashboard.png) |
| Shipments | Shipment list with status tabs, filters and actions | [Light](docs/screenshots/en/light/shipments.png) | [Graphite](docs/screenshots/en/graphite/shipments.png) | [Warehouse](docs/screenshots/en/warehouse/shipments.png) |
| Shipment details | Data, delivery, history, costs, QR label and export | [Light](docs/screenshots/en/light/shipment-details.png) | [Graphite](docs/screenshots/en/graphite/shipment-details.png) | [Warehouse](docs/screenshots/en/warehouse/shipment-details.png) |
| Deliveries | Delivery register with route, state and steps | [Light](docs/screenshots/en/light/deliveries.png) | [Graphite](docs/screenshots/en/graphite/deliveries.png) | [Warehouse](docs/screenshots/en/warehouse/deliveries.png) |
| Returns | Return lookup and per-department return table | [Light](docs/screenshots/en/light/returns.png) | [Graphite](docs/screenshots/en/graphite/returns.png) | [Warehouse](docs/screenshots/en/warehouse/returns.png) |
| Pallets | Pallets with carrier, labels and transport documents | [Light](docs/screenshots/en/light/pallets.png) | [Graphite](docs/screenshots/en/graphite/pallets.png) | [Warehouse](docs/screenshots/en/warehouse/pallets.png) |
| Departments | Delivery boundary map and department list | [Light](docs/screenshots/en/light/departments.png) | [Graphite](docs/screenshots/en/graphite/departments.png) | [Warehouse](docs/screenshots/en/warehouse/departments.png) |
| Department map | Warehouse floor plan with pallet locations | [Light](docs/screenshots/en/light/department-map.png) | [Graphite](docs/screenshots/en/graphite/department-map.png) | [Warehouse](docs/screenshots/en/warehouse/department-map.png) |
| Delivery area | Drawing the area a department serves | [Light](docs/screenshots/en/light/delivery-area.png) | [Graphite](docs/screenshots/en/graphite/delivery-area.png) | [Warehouse](docs/screenshots/en/warehouse/delivery-area.png) |
| Pickup points | Pickup point and locker catalog on a map | [Light](docs/screenshots/en/light/pickup-points.png) | [Graphite](docs/screenshots/en/graphite/pickup-points.png) | [Warehouse](docs/screenshots/en/warehouse/pickup-points.png) |
| Processes | Microservice process log with status | [Light](docs/screenshots/en/light/processes.png) | [Graphite](docs/screenshots/en/graphite/processes.png) | [Warehouse](docs/screenshots/en/warehouse/processes.png) |
| Chat | Organization chat with employee directory | [Light](docs/screenshots/en/light/chat.png) | [Graphite](docs/screenshots/en/graphite/chat.png) | [Warehouse](docs/screenshots/en/warehouse/chat.png) |
| Global configuration | Operator-wide settings by section | [Light](docs/screenshots/en/light/global-configuration.png) | [Graphite](docs/screenshots/en/graphite/global-configuration.png) | [Warehouse](docs/screenshots/en/warehouse/global-configuration.png) |

<details>
<summary>All screens in the Light theme</summary>

<p>
  <img src="docs/screenshots/en/light/dashboard.png" alt="Dashboard – Light" width="49%">
  <img src="docs/screenshots/en/light/shipments.png" alt="Shipments – Light" width="49%">
  <img src="docs/screenshots/en/light/shipment-details.png" alt="Shipment details – Light" width="49%">
  <img src="docs/screenshots/en/light/deliveries.png" alt="Deliveries – Light" width="49%">
  <img src="docs/screenshots/en/light/returns.png" alt="Returns – Light" width="49%">
  <img src="docs/screenshots/en/light/pallets.png" alt="Pallets – Light" width="49%">
  <img src="docs/screenshots/en/light/departments.png" alt="Departments – Light" width="49%">
  <img src="docs/screenshots/en/light/department-map.png" alt="Department map – Light" width="49%">
  <img src="docs/screenshots/en/light/delivery-area.png" alt="Delivery area – Light" width="49%">
  <img src="docs/screenshots/en/light/pickup-points.png" alt="Pickup points – Light" width="49%">
  <img src="docs/screenshots/en/light/processes.png" alt="Processes – Light" width="49%">
  <img src="docs/screenshots/en/light/chat.png" alt="Chat – Light" width="49%">
  <img src="docs/screenshots/en/light/global-configuration.png" alt="Global configuration – Light" width="49%">
</p>
</details>

<details>
<summary>All screens in the Graphite theme</summary>

<p>
  <img src="docs/screenshots/en/graphite/dashboard.png" alt="Dashboard – Graphite" width="49%">
  <img src="docs/screenshots/en/graphite/shipments.png" alt="Shipments – Graphite" width="49%">
  <img src="docs/screenshots/en/graphite/shipment-details.png" alt="Shipment details – Graphite" width="49%">
  <img src="docs/screenshots/en/graphite/deliveries.png" alt="Deliveries – Graphite" width="49%">
  <img src="docs/screenshots/en/graphite/returns.png" alt="Returns – Graphite" width="49%">
  <img src="docs/screenshots/en/graphite/pallets.png" alt="Pallets – Graphite" width="49%">
  <img src="docs/screenshots/en/graphite/departments.png" alt="Departments – Graphite" width="49%">
  <img src="docs/screenshots/en/graphite/department-map.png" alt="Department map – Graphite" width="49%">
  <img src="docs/screenshots/en/graphite/delivery-area.png" alt="Delivery area – Graphite" width="49%">
  <img src="docs/screenshots/en/graphite/pickup-points.png" alt="Pickup points – Graphite" width="49%">
  <img src="docs/screenshots/en/graphite/processes.png" alt="Processes – Graphite" width="49%">
  <img src="docs/screenshots/en/graphite/chat.png" alt="Chat – Graphite" width="49%">
  <img src="docs/screenshots/en/graphite/global-configuration.png" alt="Global configuration – Graphite" width="49%">
</p>
</details>

<details>
<summary>All screens in the Warehouse theme</summary>

<p>
  <img src="docs/screenshots/en/warehouse/dashboard.png" alt="Dashboard – Warehouse" width="49%">
  <img src="docs/screenshots/en/warehouse/shipments.png" alt="Shipments – Warehouse" width="49%">
  <img src="docs/screenshots/en/warehouse/shipment-details.png" alt="Shipment details – Warehouse" width="49%">
  <img src="docs/screenshots/en/warehouse/deliveries.png" alt="Deliveries – Warehouse" width="49%">
  <img src="docs/screenshots/en/warehouse/returns.png" alt="Returns – Warehouse" width="49%">
  <img src="docs/screenshots/en/warehouse/pallets.png" alt="Pallets – Warehouse" width="49%">
  <img src="docs/screenshots/en/warehouse/departments.png" alt="Departments – Warehouse" width="49%">
  <img src="docs/screenshots/en/warehouse/department-map.png" alt="Department map – Warehouse" width="49%">
  <img src="docs/screenshots/en/warehouse/delivery-area.png" alt="Delivery area – Warehouse" width="49%">
  <img src="docs/screenshots/en/warehouse/pickup-points.png" alt="Pickup points – Warehouse" width="49%">
  <img src="docs/screenshots/en/warehouse/processes.png" alt="Processes – Warehouse" width="49%">
  <img src="docs/screenshots/en/warehouse/chat.png" alt="Chat – Warehouse" width="49%">
  <img src="docs/screenshots/en/warehouse/global-configuration.png" alt="Global configuration – Warehouse" width="49%">
</p>
</details>

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
- Department-aware home dashboard with shipment and return metrics, a 7/14/30-day
  turnover chart, recent operational activity and a map of direct department
  connections; module navigation tiles remain a separate reusable component.
- Shipment list, create form, details/edit view and shipment history, including pickup and delivery methods.
- Pickup-point catalog with creation, editing, lifecycle actions, filters and a location map.
- Pickup-point selection from a searchable street/city map during shipment creation and editing; the selected point ID is stored on the shipment while its code is shown to users.
- Shipment history map with department routes and translated event labels.
- Shipment document download, QR label preview and print support.
- Return registration, list and detail views, processing/completion/cancellation actions, reason updates and token validation.
- Delivery register with recent deliveries, an edit screen with step history and delivery method, and a cancel action. It uses Manager `GET /deliveries`, `GET /deliveries/{id}`, `PUT /deliveries/{id}/method`, and `POST /deliveries/{id}/cancel`.
- Department list and department creation. The list shows a map of saved delivery boundaries and department locations, following the list filters. Clicking a department opens its own tab (`/departments/:departmentId`) with editable details, users, the department map and a delivery area editor.
- Delivery area editor: draw multiple boundaries on a large Leaflet map (with an expanded view), close a boundary at its starting point, add or drag vertices and save a draft in this browser's local storage. Under Global configuration → Departments, the automatic delivery area setting divides Poland among active departments with valid coordinates on save and after department creation. It replaces local drafts for participating departments. The same configuration section can connect each newly created department to its nearest active sorting facility and hide department deletion or archiving in the GUI. These configuration flags and area drafts are browser local; restrictions are not enforced by the API. Network connections are saved through the delivery network API. Area drafts do not affect shipment assignment. Distance uses an approximate planar map projection; roads and driving times are not considered. The bundled, approximate Polish outline is derived from [Natural Earth 1:10m Admin-0](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) through the [geo-countries GeoJSON dataset](https://github.com/datasets/geo-countries) (public domain).
- Department map: SVG top-view editor for rooms, walls, aisles, zones, racks and storage locations (zoom, pan, grid, move, rotate, resize, undo) and an operational mode for placing, moving, reserving, searching and tracking pallet locations. It uses Manager `/department-maps` endpoints.
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
- Operator subscription plans (`MINI`, `BASIC`, `ENTERPRISE`) managed in the super-admin operator workspace; operators
  without a plan or with an expired or not yet started plan see a screen asking them to contact support.
- Polish, English and German translations.

Some routes are placeholders for planned modules, for example analytics,
vehicles, pallets, scanner, courier deliveries, suppliers, deals, billing and
support.

## Project Structure

| Path | Purpose |
| --- | --- |
| `src/components` | Application pages and UI modules. |
| `src/components/AppShell` | Main layout, routing, tabs and tab persistence. |
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

- `REACT_APP_SERVER_URL` - main Manager API, default `http://localhost:8080/v1/api`
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
`http://localhost:8080/v1/api` and the Gateway on `http://localhost:8088/gateway`.
Authentication is cookie/JWT based and the backend CORS configuration must allow
the GUI origin, usually `http://localhost:3000`.

Release notes are maintained in `CHANGELOG.md`.
