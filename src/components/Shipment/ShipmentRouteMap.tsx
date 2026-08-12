import React, {useEffect, useMemo, useRef} from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import Department from "../../class/depots/Department";
import RouteLogRecord from "../RouteLog/model/RouteLogRecord";
import {valueObjectValue} from "../../utils/valueObject";
import pl from "../../i18n/translate";

type RouteDetail = RouteLogRecord["routeLogRecordDetails"]["routeLogRecordDetailSet"][number];

type ShipmentRouteMapProps = {
    departments: Department[];
    details: RouteDetail[];
    error?: string | null;
    loading?: boolean;
};

type RouteStop = {
    department: Department;
    position: [number, number];
};

const DEFAULT_CENTER: L.LatLngExpression = [52.0693, 19.4803];
const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const DEFAULT_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const departmentCode = (department: Department) => valueObjectValue(department.departmentCode);

const detailDepartmentId = (detail: RouteDetail) => {
    const value = valueObjectValue(detail.departmentId);
    return value ? Number(value) : null;
};

const findDepartment = (detail: RouteDetail, departments: Department[]) => {
    const id = detailDepartmentId(detail);
    if (id !== null && Number.isFinite(id)) {
        const byId = departments.find((department) => department.departmentId === id);
        if (byId) {
            return byId;
        }
    }

    const code = valueObjectValue(detail.departmentCode) || valueObjectValue(detail.depotCode);
    return code ? departments.find((department) => departmentCode(department) === code) : undefined;
};

const departmentPosition = (department: Department): [number, number] | null => {
    const latitude = department.coordinates?.latitude;
    const longitude = department.coordinates?.longitude;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
    }

    return [latitude as number, longitude as number];
};

const routeStops = (details: RouteDetail[], departments: Department[]): RouteStop[] => (
    details.reduce<RouteStop[]>((stops, detail) => {
        const department = findDepartment(detail, departments);
        const position = department ? departmentPosition(department) : null;
        if (!department || !position) {
            return stops;
        }

        const previousStop = stops[stops.length - 1];
        if (previousStop?.department.departmentId === department.departmentId) {
            return stops;
        }

        stops.push({department, position});
        return stops;
    }, [])
);

const popupContent = (department: Department) => {
    const popup = document.createElement("div");
    popup.className = "shipment-history-map-popup";

    const code = document.createElement("strong");
    code.textContent = departmentCode(department);
    popup.appendChild(code);

    const street = document.createElement("span");
    street.textContent = department.address.street;
    popup.appendChild(street);

    const city = document.createElement("span");
    city.textContent = `${department.address.postalCode} ${department.address.city}`.trim();
    popup.appendChild(city);

    return popup;
};

const ShipmentRouteMap: React.FC<ShipmentRouteMapProps> = ({departments, details, error, loading}) => {
    const mapElementRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const routeLayerRef = useRef<L.LayerGroup | null>(null);
    const stops = useMemo(() => routeStops(details, departments), [departments, details]);
    const positions = useMemo(() => stops.map((stop) => stop.position), [stops]);
    const tileUrl = process.env.REACT_APP_MAP_TILE_URL || DEFAULT_TILE_URL;
    const tileAttribution = process.env.REACT_APP_MAP_TILE_ATTRIBUTION || DEFAULT_ATTRIBUTION;
    const canRenderMap = !loading && !error && stops.length > 0;

    useEffect(() => {
        if (!canRenderMap || !mapElementRef.current) {
            return undefined;
        }

        const map = L.map(mapElementRef.current, {
            scrollWheelZoom: false,
            zoomAnimation: false,
            fadeAnimation: false,
            markerZoomAnimation: false,
        }).setView(DEFAULT_CENTER, 6);
        const routeLayer = L.layerGroup().addTo(map);

        L.tileLayer(tileUrl, {
            attribution: tileAttribution,
        }).addTo(map);

        mapRef.current = map;
        routeLayerRef.current = routeLayer;

        return () => {
            routeLayerRef.current = null;
            mapRef.current = null;
            map.stop();
            routeLayer.clearLayers();
            map.remove();
        };
    }, [canRenderMap, tileAttribution, tileUrl]);

    useEffect(() => {
        const map = mapRef.current;
        const routeLayer = routeLayerRef.current;
        if (!map || !routeLayer || !positions.length) {
            return;
        }

        routeLayer.clearLayers();

        if (positions.length > 1) {
            L.polyline(positions, {
                color: "#2563a9",
                opacity: 0.85,
                weight: 5,
            }).addTo(routeLayer);
        }

        stops.forEach((stop, index) => {
            L.circleMarker(stop.position, {
                color: "#ffffff",
                fillColor: "#2563a9",
                fillOpacity: 1,
                radius: 17,
                weight: 3,
            })
                .bindTooltip(String(index + 1), {
                    className: "shipment-history-map-marker-number",
                    direction: "center",
                    opacity: 1,
                    permanent: true,
                })
                .bindPopup(popupContent(stop.department))
                .addTo(routeLayer);
        });

        map.invalidateSize({pan: false});
        if (positions.length === 1) {
            map.setView(positions[0], 13, {animate: false});
        } else {
            map.fitBounds(L.latLngBounds(positions), {
                animate: false,
                maxZoom: 13,
                padding: [48, 48],
            });
        }
    }, [positions, stops]);

    if (loading) {
        return <div className="shipment-history-map-state">{pl.shipments.routeHistory.mapLoading}</div>;
    }

    if (error) {
        return <div className="shipment-history-map-state shipment-history-map-state-error">{error}</div>;
    }

    if (!stops.length) {
        return <div className="shipment-history-map-state">{pl.shipments.routeHistory.mapEmpty}</div>;
    }

    return <div className="shipment-history-leaflet-map" ref={mapElementRef} />;
};

export default ShipmentRouteMap;
