import React, {useEffect, useMemo, useRef} from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import pl from "../../i18n/translate";
import {PickupPointSummary} from "./model/PickupPoint";

type PickupPointMapProps = {
    points: PickupPointSummary[];
    selectedPointId: string | null;
    onSelect: (pickupPointId: string) => void;
    loading?: boolean;
};

type MappedPickupPoint = {
    point: PickupPointSummary;
    position: [number, number];
};

const DEFAULT_CENTER: L.LatLngExpression = [52.0693, 19.4803];
const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const DEFAULT_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const popupContent = (point: PickupPointSummary) => {
    const popup = document.createElement("div");
    popup.className = "pickup-point-map-popup";

    const code = document.createElement("strong");
    code.textContent = point.code;
    popup.appendChild(code);

    const name = document.createElement("span");
    name.textContent = point.name;
    popup.appendChild(name);

    const address = document.createElement("span");
    address.textContent = point.address
        ? `${point.address.street} ${point.address.buildingNumber}, ${point.address.city}`
        : pl.common.dash;
    popup.appendChild(address);

    return popup;
};

const markerTone = (point: PickupPointSummary) => {
    if (point.status === "SUSPENDED") {
        return "is-suspended";
    }
    if (point.status === "CLOSED") {
        return "is-closed";
    }
    return point.type === "PARCEL_LOCKER" ? "is-locker" : "is-service-point";
};

const PickupPointMap: React.FC<PickupPointMapProps> = ({points, selectedPointId, onSelect, loading = false}) => {
    const mapElementRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const contentLayerRef = useRef<L.LayerGroup | null>(null);
    const tileUrl = process.env.REACT_APP_MAP_TILE_URL || DEFAULT_TILE_URL;
    const tileAttribution = process.env.REACT_APP_MAP_TILE_ATTRIBUTION || DEFAULT_ATTRIBUTION;
    const mappedPoints = useMemo(() => points.reduce<MappedPickupPoint[]>((result, point) => {
        const latitude = point.coordinates?.latitude;
        const longitude = point.coordinates?.longitude;
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
            result.push({point, position: [latitude as number, longitude as number]});
        }
        return result;
    }, []), [points]);
    const hasMappedPoints = mappedPoints.length > 0;

    useEffect(() => {
        if (!hasMappedPoints || !mapElementRef.current) {
            return undefined;
        }
        const map = L.map(mapElementRef.current, {
            scrollWheelZoom: true,
            zoomAnimation: false,
            fadeAnimation: false,
            markerZoomAnimation: false,
        }).setView(DEFAULT_CENTER, 6);
        const contentLayer = L.layerGroup().addTo(map);
        L.tileLayer(tileUrl, {attribution: tileAttribution}).addTo(map);
        mapRef.current = map;
        contentLayerRef.current = contentLayer;

        return () => {
            contentLayerRef.current = null;
            mapRef.current = null;
            map.stop();
            contentLayer.clearLayers();
            map.remove();
        };
    }, [hasMappedPoints, tileAttribution, tileUrl]);

    useEffect(() => {
        const map = mapRef.current;
        const contentLayer = contentLayerRef.current;
        if (!map || !contentLayer || !mappedPoints.length) {
            return;
        }
        contentLayer.clearLayers();
        mappedPoints.forEach(({point, position}) => {
            const pointId = point.pickupPointId.value;
            const selected = pointId === selectedPointId;
            L.marker(position, {
                icon: L.divIcon({
                    className: "pickup-point-map-marker-container",
                    html: `<span class="pickup-point-map-marker ${markerTone(point)}${selected ? " is-selected" : ""}"></span>`,
                    iconAnchor: [14, 14],
                    iconSize: [28, 28],
                }),
            })
                .bindTooltip(point.code, {
                    className: "pickup-point-map-label",
                    direction: "top",
                    offset: [0, -8],
                    opacity: 1,
                    permanent: selected,
                })
                .bindPopup(popupContent(point))
                .on("click", () => onSelect(pointId))
                .addTo(contentLayer);
        });
        map.invalidateSize({pan: false});
        const selectedPoint = mappedPoints.find(({point}) => point.pickupPointId.value === selectedPointId);
        if (selectedPoint) {
            map.setView(selectedPoint.position, 14, {animate: false});
        } else if (mappedPoints.length === 1) {
            map.setView(mappedPoints[0].position, 13, {animate: false});
        } else {
            map.fitBounds(L.latLngBounds(mappedPoints.map(({position}) => position)), {
                animate: false,
                maxZoom: 13,
                padding: [36, 36],
            });
        }
    }, [mappedPoints, onSelect, selectedPointId]);

    return (
        <section aria-busy={loading} className="pickup-point-map-panel" aria-label={pl.pickupPoints.map.label}>
            <div className="pickup-point-map-header">
                <strong>{pl.pickupPoints.map.title}</strong>
                <span>{pl.pickupPoints.map.description}</span>
            </div>
            {mappedPoints.length ? (
                <div className="pickup-point-map" ref={mapElementRef}/>
            ) : (
                <div className="pickup-point-map-empty">
                    {loading ? pl.common.loading : pl.pickupPoints.map.empty}
                </div>
            )}
        </section>
    );
};

export default PickupPointMap;
