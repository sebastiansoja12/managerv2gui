import React, {useEffect, useRef, useState} from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import Department from "../../class/depots/Department";
import pl from "../../i18n/translate";
import {deliveryAreasChangedEvent, readAreas, storageKeyFor} from "./deliveryAreaDraft";
import {countryBoundary} from "./generateDeliveryAreas";

type DeliveryAreasMapProps = {
    departments: Department[];
    operatorId?: number;
};

const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const DEFAULT_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const COLORS = ["#2563eb", "#dc2626", "#059669", "#9333ea", "#d97706", "#0891b2", "#be185d"];
const polandBounds = L.latLngBounds(countryBoundary.map(([longitude, latitude]) => [latitude, longitude]));

const DeliveryAreasMap: React.FC<DeliveryAreasMapProps> = ({departments, operatorId}) => {
    const mapElementRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layerRef = useRef<L.LayerGroup | null>(null);
    const [revision, setRevision] = useState(0);
    const [areaCount, setAreaCount] = useState(0);
    const labels = pl.departments.deliveryArea;
    const tileUrl = process.env.REACT_APP_MAP_TILE_URL || DEFAULT_TILE_URL;
    const tileAttribution = process.env.REACT_APP_MAP_TILE_ATTRIBUTION || DEFAULT_ATTRIBUTION;
    useEffect(() => {
        const refresh = () => setRevision((current) => current + 1);
        window.addEventListener(deliveryAreasChangedEvent, refresh);
        window.addEventListener("storage", refresh);
        return () => {
            window.removeEventListener(deliveryAreasChangedEvent, refresh);
            window.removeEventListener("storage", refresh);
        };
    }, []);

    useEffect(() => {
        if (!mapElementRef.current) return undefined;
        const map = L.map(mapElementRef.current, {scrollWheelZoom: false}).fitBounds(polandBounds, {padding: [18, 18]});
        const layer = L.layerGroup().addTo(map);
        L.tileLayer(tileUrl, {attribution: tileAttribution}).addTo(map);
        L.polyline(countryBoundary.map(([longitude, latitude]): L.LatLngTuple => [latitude, longitude]), {
            color: "#64748b", weight: 1.5, interactive: false,
        }).addTo(map);
        mapRef.current = map;
        layerRef.current = layer;
        return () => {
            mapRef.current = null;
            layerRef.current = null;
            map.remove();
        };
    }, [tileAttribution, tileUrl]);

    useEffect(() => {
        const layer = layerRef.current;
        const map = mapRef.current;
        if (!layer || !map) return;
        layer.clearLayers();
        const visibleBounds = L.latLngBounds([]);
        let nextAreaCount = 0;
        departments.filter((department) => department.status === "ACTIVE").forEach((department, index) => {
            const areas = readAreas(storageKeyFor(operatorId, String(department.departmentId)));
            nextAreaCount += areas.length;
            const color = COLORS[index % COLORS.length];
            const code = department.departmentCode?.value || "";
            areas.forEach((area) => {
                const positions = area.points.map(({latitude, longitude}): L.LatLngTuple => [latitude, longitude]);
                const tooltip = document.createElement("span");
                tooltip.textContent = `${code} · ${area.name}`;
                const polygon = L.polygon(positions, {color, fillColor: color, fillOpacity: 0.24, weight: 2})
                    .bindTooltip(tooltip).addTo(layer);
                visibleBounds.extend(polygon.getBounds());
            });
            const {latitude, longitude} = department.coordinates || {};
            if (typeof latitude === "number" && Number.isFinite(latitude)
                && typeof longitude === "number" && Number.isFinite(longitude)) {
                const tooltip = document.createElement("span");
                tooltip.textContent = code;
                L.circleMarker([latitude, longitude], {
                    color: "#fff", fillColor: color, fillOpacity: 1, radius: 6, weight: 2,
                }).bindTooltip(tooltip).addTo(layer);
                visibleBounds.extend([latitude, longitude]);
            }
        });
        setAreaCount(nextAreaCount);
        map.fitBounds(nextAreaCount > 0 && visibleBounds.isValid() ? visibleBounds : polandBounds,
            {padding: [18, 18], maxZoom: 10, animate: false});
        map.invalidateSize({pan: false});
    }, [departments, operatorId, revision]);

    return <section className="departments-areas-panel" aria-label={labels.overviewTitle}>
        <div className="departments-areas-header">
            <h2>{labels.overviewTitle}</h2>
            <span>{labels.overviewCount.replace("{count}", String(areaCount))}</span>
        </div>
        <div className="departments-areas-map" ref={mapElementRef} aria-label={labels.overviewTitle} />
        {areaCount === 0 ? <p className="departments-areas-empty">{labels.overviewEmpty}</p> : null}
    </section>;
};

export default DeliveryAreasMap;
