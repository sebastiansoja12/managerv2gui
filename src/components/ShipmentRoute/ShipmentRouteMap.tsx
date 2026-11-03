import React, {useEffect, useMemo, useRef} from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import pl from "../../i18n/translate";
import {ShipmentRouteStop} from "./model/shipmentRouteStops";

type ShipmentRouteMapProps = {
    stops: ShipmentRouteStop[];
};

type PositionedStop = ShipmentRouteStop & {
    position: [number, number];
};

const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const DEFAULT_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const markerIcon = (stop: PositionedStop) => {
    const marker = document.createElement("span");
    const branchTransfer = stop.role === "transfer" && stop.routeDepartment.departmentType !== "SORTING_FACILITY";
    marker.className = `shipment-route-map-pin shipment-route-map-pin-${branchTransfer ? "branch-transfer" : stop.role}`;
    marker.textContent = stop.routeDepartment.departmentCode;
    return L.divIcon({
        className: "shipment-route-map-pin-wrapper",
        html: marker,
        iconAnchor: [0, 0],
        iconSize: undefined,
    });
};

const popupContent = (stop: PositionedStop) => {
    const popup = document.createElement("div");
    popup.className = "shipment-route-map-popup";

    const role = document.createElement("span");
    role.textContent = pl.shipmentRoute.roles[stop.role];
    popup.appendChild(role);

    const code = document.createElement("strong");
    code.textContent = stop.routeDepartment.departmentCode;
    popup.appendChild(code);

    if (stop.department) {
        const address = document.createElement("span");
        address.textContent = `${stop.department.address.street}, ${stop.department.address.postalCode} ${stop.department.address.city}`;
        popup.appendChild(address);
    }
    return popup;
};

const ShipmentRouteMap: React.FC<ShipmentRouteMapProps> = ({stops}) => {
    const mapElementRef = useRef<HTMLDivElement | null>(null);
    const positionedStops = useMemo(
        () => stops.filter((stop): stop is PositionedStop => stop.position !== null),
        [stops],
    );
    const missingStops = stops.filter((stop) => stop.position === null);
    const tileUrl = process.env.REACT_APP_MAP_TILE_URL || DEFAULT_TILE_URL;
    const tileAttribution = process.env.REACT_APP_MAP_TILE_ATTRIBUTION || DEFAULT_ATTRIBUTION;

    useEffect(() => {
        if (!mapElementRef.current || !positionedStops.length) {
            return undefined;
        }

        const map = L.map(mapElementRef.current, {
            scrollWheelZoom: false,
            zoomAnimation: false,
            fadeAnimation: false,
            markerZoomAnimation: false,
        });
        L.tileLayer(tileUrl, {attribution: tileAttribution}).addTo(map);

        const positions = positionedStops.map((stop) => stop.position);
        if (positions.length > 1) {
            L.polyline(positions, {className: "shipment-route-map-line-casing", weight: 9}).addTo(map);
            L.polyline(positions, {className: "shipment-route-map-line", weight: 4}).addTo(map);
        }
        positionedStops.forEach((stop) => {
            L.marker(stop.position, {
                icon: markerIcon(stop),
                keyboard: false,
                zIndexOffset: stop.role === "destination" ? 1000 : 0,
            })
                .bindPopup(popupContent(stop))
                .addTo(map);
        });

        if (positions.length === 1) {
            map.setView(positions[0], 11, {animate: false});
        } else {
            map.fitBounds(L.latLngBounds(positions), {animate: false, maxZoom: 11, padding: [56, 56]});
        }

        return () => {
            map.stop();
            map.remove();
        };
    }, [positionedStops, tileAttribution, tileUrl]);

    if (!positionedStops.length) {
        return <div className="shipment-route-map-state">{pl.shipmentRoute.map.empty}</div>;
    }

    return (
        <div className="shipment-route-map">
            <div className="shipment-route-map-canvas" ref={mapElementRef} aria-label={pl.shipmentRoute.map.title}/>
            {missingStops.length > 0 && (
                <p className="shipment-route-map-note">
                    {pl.shipmentRoute.map.missingCoordinates.replace(
                        "{codes}",
                        missingStops.map((stop) => stop.routeDepartment.departmentCode).join(", "),
                    )}
                </p>
            )}
        </div>
    );
};

export default ShipmentRouteMap;
