**Manager 2.0 GUI - Development Version 2026.3  - 6th July, 2026**

## Shipment history map

The shipment history view uses Leaflet with OpenStreetMap tiles. The tile provider can be changed at build time without changing the source code:

- `REACT_APP_MAP_TILE_URL` — Leaflet tile URL template.
- `REACT_APP_MAP_TILE_ATTRIBUTION` — attribution displayed on the map.

If the variables are not set, the application uses `https://tile.openstreetmap.org/{z}/{x}/{y}.png` and displays the required OpenStreetMap attribution.
