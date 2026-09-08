import React, {FormEvent, useEffect, useId, useRef, useState} from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField} from "components/ui";
import {getBackendErrorMessage} from "../../api/errorMessage";
import PickupPointService from "../../hooks/PickupPointService";
import pl from "../../i18n/translate";
import {PickupPointSummary, PickupPointType} from "../PickupPoints/model/PickupPoint";
import {DeliveryMethodDto, ShipmentSizeDto} from "./dto/ShipmentDto";
import "./styles/delivery-point-map.css";

type Props = {
    deliveryMethod: Exclude<DeliveryMethodDto, "COURIER">;
    receiverCountryCode: string;
    shipmentSize: ShipmentSizeDto;
    hasDangerousGoods: boolean;
    selectedPointId: string | null;
    onSelect: (point: PickupPointSummary) => void;
    onClose: () => void;
};

const PAGE_SIZE = 100;
const DEFAULT_CENTER: L.LatLngExpression = [52.0693, 19.4803];

const pointType = (deliveryMethod: Props["deliveryMethod"]): PickupPointType => (
    deliveryMethod === "LOCKER" ? "PARCEL_LOCKER" : "SERVICE_POINT"
);

const popupContent = (point: PickupPointSummary) => {
    const popup = document.createElement("div");
    popup.className = "shipment-delivery-map-popup";
    const code = document.createElement("strong");
    code.textContent = point.code;
    const name = document.createElement("span");
    name.textContent = point.name;
    const address = document.createElement("span");
    address.textContent = point.address
        ? `${point.address.street} ${point.address.buildingNumber}, ${point.address.postalCode} ${point.address.city}`
        : pl.common.dash;
    popup.append(code, name, address);
    return popup;
};

const ShipmentDeliveryPointMapDialog: React.FC<Props> = ({
    deliveryMethod,
    receiverCountryCode,
    shipmentSize,
    hasDangerousGoods,
    selectedPointId,
    onSelect,
    onClose,
}) => {
    const mapElementRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerLayerRef = useRef<L.LayerGroup | null>(null);
    const closeButtonRef = useRef<HTMLDivElement>(null);
    const titleId = useId();
    const descriptionId = useId();
    const [points, setPoints] = useState<PickupPointSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [pointsError, setPointsError] = useState("");
    const [tileError, setTileError] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [appliedQuery, setAppliedQuery] = useState("");
    const [pendingPointId, setPendingPointId] = useState<string | null>(selectedPointId);
    const translations = pl.shipments.deliveryPointMap;

    useEffect(() => {
        const previousFocus = document.activeElement as HTMLElement | null;
        closeButtonRef.current?.querySelector("button")?.focus();
        return () => previousFocus?.focus();
    }, []);

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            setPointsError("");
            if (shipmentSize === "CUSTOM" || shipmentSize === "TEST") {
                setPoints([]);
                setLoading(false);
                return;
            }
            try {
                const query = {
                    capability: "COLLECTION" as const,
                    type: pointType(deliveryMethod),
                    countryCode: receiverCountryCode,
                    shipmentSize,
                    hasDangerousGoods,
                    query: appliedQuery.trim() || undefined,
                    size: PAGE_SIZE,
                };
                const firstPage = await PickupPointService.findEligible({...query, page: 0});
                const totalPages = Math.max(firstPage.data.totalPages || 1, 1);
                const remainingPages = await Promise.all(Array.from(
                    {length: totalPages - 1},
                    (_, index) => PickupPointService.findEligible({...query, page: index + 1}),
                ));
                if (!active) {
                    return;
                }
                const loadedPoints = [firstPage, ...remainingPages]
                    .flatMap((response) => response.data.items || [])
                    .filter((point) => Number.isFinite(point.coordinates?.latitude)
                        && Number.isFinite(point.coordinates?.longitude));
                setPoints(Array.from(new Map(loadedPoints.map((point) => [
                    point.pickupPointId.value,
                    point,
                ])).values()));
            } catch (error) {
                if (active) {
                    setPoints([]);
                    setPointsError(getBackendErrorMessage(error, translations.pointsLoadError));
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };
        load();
        return () => {
            active = false;
        };
    }, [appliedQuery, deliveryMethod, hasDangerousGoods, receiverCountryCode, shipmentSize,
        translations.pointsLoadError]);

    useEffect(() => {
        if (!mapElementRef.current) return;

        const map = L.map(mapElementRef.current, {
            zoomAnimation: false,
            fadeAnimation: false,
            zoomControl: false,
        }).setView(DEFAULT_CENTER, 5);
        L.control.zoom({zoomInTitle: translations.zoomIn, zoomOutTitle: translations.zoomOut}).addTo(map);
        const tiles = L.tileLayer(
            process.env.REACT_APP_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution: process.env.REACT_APP_MAP_TILE_ATTRIBUTION
                    || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
            },
        );
        const markerLayer = L.layerGroup().addTo(map);
        tiles.on("tileerror", () => setTileError(true));
        tiles.on("loading", () => setTileError(false));
        tiles.addTo(map);
        mapRef.current = map;
        markerLayerRef.current = markerLayer;
        const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => {
            map.invalidateSize({pan: false});
        });
        resizeObserver?.observe(mapElementRef.current);
        map.invalidateSize({pan: false});

        return () => {
            resizeObserver?.disconnect();
            tiles.off();
            markerLayer.clearLayers();
            markerLayerRef.current = null;
            mapRef.current = null;
            map.remove();
        };
    }, [translations.zoomIn, translations.zoomOut]);

    useEffect(() => {
        const map = mapRef.current;
        const markerLayer = markerLayerRef.current;
        if (!map || !markerLayer) {
            return;
        }
        markerLayer.clearLayers();
        const positions: L.LatLngExpression[] = [];
        points.forEach((point) => {
            const selected = point.pickupPointId.value === pendingPointId;
            const position: L.LatLngExpression = [
                point.coordinates!.latitude,
                point.coordinates!.longitude,
            ];
            positions.push(position);
            L.marker(position, {
                icon: L.divIcon({
                    className: "shipment-delivery-map-marker-container",
                    html: `<span class="shipment-delivery-map-marker ${point.type === "PARCEL_LOCKER" ? "is-locker" : "is-service-point"}${selected ? " is-selected" : ""}"></span>`,
                    iconAnchor: [14, 14],
                    iconSize: [28, 28],
                }),
            })
                .bindTooltip(point.code, {direction: "top", offset: [0, -8]})
                .bindPopup(popupContent(point))
                .on("click", () => setPendingPointId(point.pickupPointId.value))
                .addTo(markerLayer);
        });
        map.invalidateSize({pan: false});
        if (positions.length === 1) {
            map.setView(positions[0], 13, {animate: false});
        } else if (positions.length > 1) {
            map.fitBounds(L.latLngBounds(positions), {animate: false, maxZoom: 13, padding: [36, 36]});
        } else {
            map.setView(DEFAULT_CENTER, 5, {animate: false});
        }
    }, [pendingPointId, points]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            onClose();
        } else if (event.key === "Tab") {
            const focusable = event.currentTarget.querySelectorAll<HTMLElement>(
                'button:not([disabled]), a[href], [tabindex="0"]',
            );
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first?.focus();
            }
        }
    };

    const statusText = shipmentSize === "CUSTOM" || shipmentSize === "TEST"
        ? translations.unsupportedSize
        : loading
            ? translations.loading
            : translations.loaded.replace("{count}", String(points.length));
    const selectedPoint = points.find((point) => point.pickupPointId.value === pendingPointId) || null;
    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        setAppliedQuery(searchTerm);
    };

    return (
        <Dialog open onClose={onClose} maxWidth="lg" fullWidth onKeyDownCapture={handleKeyDown}
                PaperProps={{"aria-labelledby": titleId, "aria-describedby": descriptionId}}>
            <DialogTitle id={titleId}>
                {deliveryMethod === "LOCKER" ? translations.lockerTitle : translations.pickupTitle}
            </DialogTitle>
            <DialogContent className="shipment-delivery-map-content">
                <form className="shipment-delivery-map-search" onSubmit={submitSearch}>
                    <TextField
                        fullWidth
                        label={translations.searchLabel}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)}
                        placeholder={translations.searchPlaceholder}
                        size="small"
                        value={searchTerm}
                    />
                    <Button disabled={loading} type="submit" variant="outlined">{translations.search}</Button>
                </form>
                <p id={descriptionId} className="shipment-delivery-map-description">{statusText}</p>
                {pointsError && <Alert severity="error">{pointsError}</Alert>}
                {tileError && <Alert severity="error">{translations.loadError}</Alert>}
                <div ref={mapElementRef} className="shipment-delivery-map" role="region"
                     aria-busy={loading} aria-label={translations.mapLabel}/>
                {!loading && !pointsError && points.length === 0 ? (
                    <div className="shipment-delivery-map-empty">{translations.empty}</div>
                ) : null}
                {points.length ? (
                    <div className="shipment-delivery-map-results" aria-label={translations.resultsLabel}>
                        {points.map((point) => (
                            <button
                                className={point.pickupPointId.value === pendingPointId ? "is-selected" : undefined}
                                key={point.pickupPointId.value}
                                onClick={() => setPendingPointId(point.pickupPointId.value)}
                                type="button"
                            >
                                <strong>{point.code} · {point.name}</strong>
                                <span>{point.address
                                    ? `${point.address.street} ${point.address.buildingNumber}, ${point.address.city}`
                                    : pl.common.dash}</span>
                            </button>
                        ))}
                    </div>
                ) : null}
            </DialogContent>
            <DialogActions>
                <div ref={closeButtonRef}>
                    <Button variant="outlined" onClick={onClose}>{pl.common.close}</Button>
                </div>
                <Button
                    disabled={!selectedPoint}
                    onClick={() => selectedPoint && onSelect(selectedPoint)}
                >
                    {translations.select}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ShipmentDeliveryPointMapDialog;
