## [2026.3] - 2026-09-10

### Added
- Pickup-point catalog with create/edit dialogs, lifecycle actions, filters and a map showing point locations.
- Street, city and visible-map-bound searches for pickup points.
- Eligible pickup-point and locker selection from a map in shipment create and edit forms, with the selected point identifier sent in the shipment request.
- Human-readable pickup-point codes in shipment details instead of raw identifiers.
- Shipment pickup and delivery method fields and recipient delivery pickup-point support.
- Return summary on shipment details and return list actions for starting and completing processing.
- Persistent organization chat with an organization-user directory, docked conversations, unread notifications and WebSocket presence indicators.
- Operational-profile routes, navigation entries and translations for pickup points and chat.
- Theme provider and technical styles for the new maps, catalogs, return summaries, chat dock and status states.
- Super admin application with standalone routing, login, layout and management panel.
- Operator management models, API service, metrics, list, editor, capabilities and dialog flows.
- Operator-aware authentication data in user profile and device requests.
- Courier creation request, dialog and form styling.
- Department creation request, dialog and form styling.
- Shipment document download service with PDF label preview, download and print support.
- Auth session state and authenticated HTTP client configuration.
- Gateway HTTP client and shared application theme.
- Geocoding model, service, panel and styles.
- User management page with create/edit flows, roles, permissions, service and styles.
- Operator/user translations in Polish, English and German.
- Dangerous goods form, shipment client, create flow, details, list filters and translations.
- Department identifiers and map coordinates for shipment views.
- Leaflet map dependency and tile configuration.
- Translated shipment map labels, event labels and event descriptions.
- Real department routes on the shipment map.
- Readable route details in shipment history.
- InPost integration page and related UI changes.

### Changed
- Routed return listing, processing and completion through the Manager shipment API.
- Updated shipment creation and editing so pickup-point selection is driven by address and map search rather than manual coordinates.
- Updated shipment detail loading so an unavailable optional return component does not block the rest of the shipment view.
- Extended Polish, English and German translations for pickup points, shipment methods, chat and return processing.
- Updated the application shell, tabs, navbar and home dashboard for the new operational modules.
- Refactored global routing and operator editor.
- Reworked application shell, app routes, navbar, tab configuration and shared component setup.
- Updated styles for app, couriers, departments, device pairing, global configuration, home dashboard, microservice status, processes, shipments, super admin and user profile views.
- Updated common, software and super-admin HTTP clients.
- Updated authentication services and login screens.
- Updated shipment status display.
- Updated Docker configuration.

### Fixed
- Pickup points not loading or responding to street/city searches in the shipment creation map.
- Selected recipient pickup-point identifiers not being included in shipment requests.
- Pickup-point UUIDs being displayed to users instead of point codes.
- Return processing actions failing after the backend status had already changed.
- TypeScript return-service test mocks returning an invalid empty response shape.
- Missing delivery-point map dialog module in the shipment creation build.
- CSRF handling.
- UI regressions from intermediate update commits.
- Map and shipment-history label readability.

### Deprecated
- Old token-storage and refresh-token request DTO handling in the GUI.
- Legacy authentication token model.

## [2026.2] - 2026-07-01

### Added
- Shipment UI.
- Application shell with tab layout.
- Logout support.
- Device pairing layout.
- Process log view.
- Multilingual labels for new screens.

### Changed
- Reworked the main layout and tab navigation.
- Updated API response handling used by process logs and device pairing.
- Applied UI fixes for the 2026.2 flow.

### Fixed
- Layout and navigation issues found while creating the new shell.

### Deprecated
- -------

## [2025.1] - 2026-06-18

### Added
- Department model updates aligned with backend changes.

### Changed
- README updated.

### Fixed
- -------

### Deprecated
- -------

## [2024.2] - 2024-02-05

### Added
- Extended department/depot model with NIP, telephone number, postal code and opening hours.
- Route log record view improvements from the 2024.1 branch.
- Software Configuration layout improvements.

### Changed
- Navbar layout updated.
- MUI usage refreshed for route record views.
- Project icon updated.
- Changelog merged from the `2024.1` branch.

### Fixed
- Bug while updating software configuration properties.

### Deprecated
- -------

## [2024.1] - 2024-01-01

### Added
- Navbar FFT-445
- Software Configuration FFT-445
- Login component FFT-409
- Viewing route records FFT-404
- Departments page FFT-412
- MUI dependencies
- Call to Manager backend

### Changed
- Project icon

### Fixed
- -------

### Deprecated
- -------
