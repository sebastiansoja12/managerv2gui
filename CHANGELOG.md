## [2026.3] - 2026-08-12

### Added
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
- Refactored global routing and operator editor.
- Reworked application shell, app routes, navbar, tab configuration and shared component setup.
- Updated styles for app, couriers, departments, device pairing, global configuration, home dashboard, microservice status, processes, shipments, super admin and user profile views.
- Updated common, software and super-admin HTTP clients.
- Updated authentication services and login screens.
- Updated shipment status display.
- Updated Docker configuration.

### Fixed
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
