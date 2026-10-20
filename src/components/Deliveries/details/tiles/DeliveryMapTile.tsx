import React, {useEffect, useMemo, useRef} from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import Department from "../../../../class/depots/Department";
import pl from "../../../../i18n/translate";
import {PickupPointDetails} from "../../../PickupPoints/model/PickupPoint";
import {Delivery} from "../../model/Delivery";

type DeliveryMapPoint = {
    key: string;
    label: string;
    role: string;
    position: [number, number];
    color: string;
};

type DeliveryMapTileProps = {
    delivery: Delivery;
    departments: Department[];
    pickupPoints: Record<string, PickupPointDetails>;
};

const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const DEFAULT_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const validPosition = (latitude?: number | null, longitude?: number | null): [number, number] | null =>
    Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude as number, longitude as number] : null;

export const deliveryMapPoints = (delivery: Delivery, departments: Department[],
                                  pickupPoints: Record<string, PickupPointDetails>): DeliveryMapPoint[] => {
    const departmentPoint = (departmentId: string | null, role: string, color: string): DeliveryMapPoint | null => {
        const department = departments.find((candidate) => String(candidate.departmentId) === departmentId);
        const position = validPosition(department?.coordinates?.latitude, department?.coordinates?.longitude);
        return department && position
            ? {key: `department-${role}`, label: department.departmentCode?.value || String(department.departmentId),
                role, position, color}
            : null;
    };
    const pickupPoint = (pickupPointId: string | null, role: string, color: string): DeliveryMapPoint | null => {
        const point = pickupPointId ? pickupPoints[pickupPointId] : undefined;
        const position = validPosition(point?.coordinates?.latitude, point?.coordinates?.longitude);
        return point && position ? {key: `pickup-${role}`, label: point.code, role, position, color} : null;
    };
    return [
        pickupPoint(delivery.pickupPointId, pl.shipments.summary.pickupPoint, "#8b5cf6"),
        departmentPoint(delivery.originDepartmentId, pl.shipments.summary.originDepartment, "#146cc3"),
        departmentPoint(delivery.destinationDepartmentId, pl.shipments.summary.destination, "#f59e0b"),
        pickupPoint(delivery.deliveryPickupPointId, pl.shipments.summary.deliveryPickupPoint, "#16a34a"),
    ].filter((point): point is DeliveryMapPoint => point !== null);
};

function DeliveryMapTile({delivery, departments, pickupPoints}: DeliveryMapTileProps) {
    const mapElementRef = useRef<HTMLDivElement | null>(null);
    const points = useMemo(() => deliveryMapPoints(delivery, departments, pickupPoints),
        [delivery, departments, pickupPoints]);
    const tileUrl = process.env.REACT_APP_MAP_TILE_URL || DEFAULT_TILE_URL;
    const tileAttribution = process.env.REACT_APP_MAP_TILE_ATTRIBUTION || DEFAULT_ATTRIBUTION;

    useEffect(() => {
        if (!mapElementRef.current || points.length === 0) {
            return undefined;
        }
        const map = L.map(mapElementRef.current, {
            scrollWheelZoom: false,
            zoomAnimation: false,
            fadeAnimation: false,
            markerZoomAnimation: false,
        });
        L.tileLayer(tileUrl, {attribution: tileAttribution}).addTo(map);
        if (points.length > 1) {
            L.polyline(points.map((point) => point.position), {color: "#1b8fe0", dashArray: "7 8", weight: 3})
                .addTo(map);
        }
        points.forEach((point) => {
            L.circleMarker(point.position, {color: "#ffffff", fillColor: point.color, fillOpacity: 1, radius: 9, weight: 3})
                .bindTooltip(`${point.role}: ${point.label}`, {direction: "top", offset: [0, -8]})
                .addTo(map);
        });
        if (points.length > 1) {
            map.fitBounds(L.latLngBounds(points.map((point) => point.position)), {padding: [30, 30], maxZoom: 12});
        } else {
            map.setView(points[0].position, 12);
        }
        let mapActive = true;
        const invalidateSizeTimer = window.setTimeout(() => {
            const mapContainer = mapElementRef.current;
            if (mapActive && mapContainer?.isConnected && map.getContainer() === mapContainer) {
                map.invalidateSize({pan: false});
            }
        }, 0);
        return () => {
            mapActive = false;
            window.clearTimeout(invalidateSizeTimer);
            map.stop();
            map.off();
            map.remove();
        };
    }, [points, tileAttribution, tileUrl]);

    const title = pl.deliveries.details.mapTitle;
    return (
        <article className="deliveries-info-tile deliveries-info-tile-wide" aria-label={title}>
            <div className="deliveries-tile-heading"><h3>{title}</h3></div>
            {points.length === 0 ? <p className="deliveries-tile-empty">{pl.deliveries.details.mapUnavailable}</p> : (
                <>
                    <div ref={mapElementRef} className="deliveries-map"/>
                    <ul className="deliveries-map-legend">
                        {points.map((point) => (
                            <li key={point.key}><span style={{background: point.color}}/>{`${point.role}: ${point.label}`}</li>
                        ))}
                    </ul>
                </>
            )}
        </article>
    );
}

export default DeliveryMapTile;
