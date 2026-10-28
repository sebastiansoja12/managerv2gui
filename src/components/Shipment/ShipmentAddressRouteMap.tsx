import React, {useEffect, useRef, useState} from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import {Alert, CircularProgress, Typography} from "components/ui";
import PostalCodeService from "../../hooks/PostalCodeService";
import pl from "../../i18n/translate";
import {PersonApi} from "./dto/ShipmentDto";
import {PostalCodeDto} from "./dto/PostalCode";
import "./styles/shipment-address-route-map.css";

type ShipmentAddressRouteMapProps = {
    sender: PersonApi;
    recipient: PersonApi;
};

type RoutePoint = {
    latitude: number;
    longitude: number;
};

type RouteState = {
    loading: boolean;
    sender: RoutePoint | null;
    recipient: RoutePoint | null;
};

const normalize = (value: string | undefined) => (value || "").trim().toLocaleLowerCase();

export const findRoutePoint = (postalCodes: PostalCodeDto[], person: PersonApi): RoutePoint | null => {
    const samePostalCode = postalCodes.filter((postalCode) => (
        postalCode.postalCode === person.postalCode.trim()
        && postalCode.latitude !== null
        && postalCode.longitude !== null
    ));
    const match = samePostalCode.find((postalCode) => normalize(postalCode.city) === normalize(person.city))
        || samePostalCode[0];
    return match ? {latitude: match.latitude!, longitude: match.longitude!} : null;
};

const resolveRoutePoint = async (person: PersonApi): Promise<RoutePoint | null> => {
    if (!person.postalCode.trim()) {
        return null;
    }
    try {
        const response = await PostalCodeService.search(person.postalCode.trim());
        return findRoutePoint(response.data, person);
    } catch {
        return null;
    }
};

const marker = (point: RoutePoint, className: string, label: string) => L.marker([point.latitude, point.longitude], {
    icon: L.divIcon({
        className: "shipment-address-route-map-marker-container",
        html: `<span class="shipment-address-route-map-marker ${className}"></span>`,
        iconAnchor: [12, 12],
        iconSize: [24, 24],
    }),
    title: label,
}).bindTooltip(label, {direction: "top", offset: [0, -10]});

const personLabel = (title: string, person: PersonApi) => (
    `${title}: ${[person.postalCode, person.city].filter(Boolean).join(" ")}`
);

const ShipmentAddressRouteMap: React.FC<ShipmentAddressRouteMapProps> = ({sender, recipient}) => {
    const translations = pl.shipments.addressRoute;
    const mapElementRef = useRef<HTMLDivElement | null>(null);
    const [route, setRoute] = useState<RouteState>({loading: true, sender: null, recipient: null});

    useEffect(() => {
        let active = true;
        setRoute({loading: true, sender: null, recipient: null});
        Promise.all([resolveRoutePoint(sender), resolveRoutePoint(recipient)])
            .then(([senderPoint, recipientPoint]) => {
                if (active) {
                    setRoute({loading: false, sender: senderPoint, recipient: recipientPoint});
                }
            });
        return () => {
            active = false;
        };
    }, [sender, recipient]);

    useEffect(() => {
        if (!mapElementRef.current || !route.sender || !route.recipient) {
            return undefined;
        }
        const map = L.map(mapElementRef.current, {zoomAnimation: false, fadeAnimation: false});
        L.tileLayer(
            process.env.REACT_APP_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution: process.env.REACT_APP_MAP_TILE_ATTRIBUTION
                    || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
            },
        ).addTo(map);
        const senderPosition: L.LatLngTuple = [route.sender.latitude, route.sender.longitude];
        const recipientPosition: L.LatLngTuple = [route.recipient.latitude, route.recipient.longitude];
        const fitRoute = () => map.fitBounds(L.latLngBounds([senderPosition, recipientPosition]),
            {animate: false, maxZoom: 12, padding: [48, 48]});
        fitRoute();
        L.polyline([senderPosition, recipientPosition], {className: "shipment-address-route-map-line"}).addTo(map);
        marker(route.sender, "is-sender", personLabel(translations.sender, sender)).addTo(map);
        marker(route.recipient, "is-recipient", personLabel(translations.recipient, recipient)).addTo(map);
        const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => {
            map.invalidateSize({pan: false});
            fitRoute();
        });
        resizeObserver?.observe(mapElementRef.current);
        return () => {
            resizeObserver?.disconnect();
            map.remove();
        };
    }, [route, sender, recipient, translations.sender, translations.recipient]);

    const distanceKm = route.sender && route.recipient
        ? Math.round(L.latLng(route.sender.latitude, route.sender.longitude)
            .distanceTo(L.latLng(route.recipient.latitude, route.recipient.longitude)) / 1000)
        : null;

    return (
        <section className="shipment-edit-section shipment-details-segment shipment-address-route-map-section" id="shipment-route">
            <div className="shipment-edit-section-header">
                <Typography variant="h6">{translations.title}</Typography>
                {distanceKm !== null ? (
                    <span className="shipment-address-route-map-distance">
                        {translations.distance.replace("{distance}", String(distanceKm))}
                    </span>
                ) : null}
            </div>
            {route.loading ? (
                <div className="shipment-address-route-map-status">
                    <CircularProgress size={24} />
                    <span>{translations.loading}</span>
                </div>
            ) : !route.sender || !route.recipient ? (
                <Alert severity="info">
                    {!route.sender && !route.recipient
                        ? translations.bothNotFound
                        : !route.sender ? translations.senderNotFound : translations.recipientNotFound}
                </Alert>
            ) : (
                <>
                    <div className="shipment-address-route-map-legend">
                        <span><i className="shipment-address-route-map-marker is-sender" />{personLabel(translations.sender, sender)}</span>
                        <span><i className="shipment-address-route-map-marker is-recipient" />{personLabel(translations.recipient, recipient)}</span>
                    </div>
                    <div
                        aria-label={translations.mapLabel}
                        className="shipment-address-route-map"
                        ref={mapElementRef}
                        role="region"
                    />
                </>
            )}
        </section>
    );
};

export default ShipmentAddressRouteMap;
