import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import {Alert, IconButton, Typography} from "components/ui";
import {LocationOn, Refresh} from "components/ui/icons";
import CarrierService from "../../hooks/CarrierService";
import FleetTrackingService from "../../hooks/FleetTrackingService";
import pl from "../../i18n/translate";
import {
    sessionKey,
    signalAgeMinutes,
    signalState,
    speedKilometersPerHour,
    vehicleLabel,
} from "./fleetTrackingPresentation";
import {PositionFixDto, TrackingSessionDto} from "./model/FleetTracking";
import "./styles/fleet-tracking.css";

const REFRESH_INTERVAL_MS = 15_000;
const DEFAULT_CENTER: L.LatLngExpression = [52.0693, 19.4803];
const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const DEFAULT_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const FleetTrackingMap: React.FC = () => {
    const translations = pl.fleetTracking;
    const mapElementRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const contentLayerRef = useRef<L.LayerGroup | null>(null);
    const fittedRef = useRef(false);
    const [sessions, setSessions] = useState<TrackingSessionDto[]>([]);
    const [registrationNumbers, setRegistrationNumbers] = useState<Map<string, string>>(new Map());
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [route, setRoute] = useState<PositionFixDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [now, setNow] = useState(() => new Date());
    const tileUrl = process.env.REACT_APP_MAP_TILE_URL || DEFAULT_TILE_URL;
    const tileAttribution = process.env.REACT_APP_MAP_TILE_ATTRIBUTION || DEFAULT_ATTRIBUTION;

    const load = useCallback(async () => {
        try {
            const response = await FleetTrackingService.activeSessions();
            setSessions(response.data);
            setNow(new Date());
            setError(null);
        } catch {
            setError(translations.loadError);
        } finally {
            setLoading(false);
        }
    }, [translations]);

    useEffect(() => {
        load();
        const timer = window.setInterval(load, REFRESH_INTERVAL_MS);
        return () => window.clearInterval(timer);
    }, [load]);

    useEffect(() => {
        CarrierService.findAll(false)
            .then((response) => setRegistrationNumbers(new Map(response.data.flatMap((carrier) =>
                (carrier.vehicles || []).map((vehicle) => [String(vehicle.vehicleId), vehicle.registrationNumber] as [string, string])))))
            .catch(() => undefined);
    }, []);

    useEffect(() => {
        if (!selectedSessionId) {
            setRoute([]);
            return;
        }
        FleetTrackingService.route(selectedSessionId)
            .then((response) => setRoute(response.data))
            .catch(() => setRoute([]));
    }, [selectedSessionId, sessions]);

    useEffect(() => {
        if (!mapElementRef.current) {
            return undefined;
        }
        const map = L.map(mapElementRef.current, {scrollWheelZoom: true, zoomAnimation: false, fadeAnimation: false})
            .setView(DEFAULT_CENTER, 6);
        L.tileLayer(tileUrl, {attribution: tileAttribution}).addTo(map);
        contentLayerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        return () => {
            contentLayerRef.current = null;
            mapRef.current = null;
            map.remove();
        };
    }, [tileAttribution, tileUrl]);

    const positionedSessions = useMemo(() => sessions.filter((session) => session.lastPosition), [sessions]);

    useEffect(() => {
        const map = mapRef.current;
        const contentLayer = contentLayerRef.current;
        if (!map || !contentLayer) {
            return;
        }
        contentLayer.clearLayers();
        if (route.length > 1) {
            L.polyline(route.map((position) => [position.latitude, position.longitude] as L.LatLngTuple), {
                color: "#2563eb",
                weight: 4,
                opacity: 0.75,
            }).addTo(contentLayer);
        }
        positionedSessions.forEach((session) => {
            const position = session.lastPosition as PositionFixDto;
            const selected = sessionKey(session) === selectedSessionId;
            L.marker([position.latitude, position.longitude], {
                icon: L.divIcon({
                    className: "",
                    html: `<span class="fleet-tracking-marker is-${signalState(session, now)}${selected ? " is-selected" : ""}"></span>`,
                    iconAnchor: [9, 9],
                    iconSize: [18, 18],
                }),
            })
                .bindTooltip(vehicleLabel(session, registrationNumbers) || session.driverUsername || session.deviceId, {
                    direction: "top",
                    offset: [0, -8],
                    permanent: selected,
                })
                .on("click", () => setSelectedSessionId(sessionKey(session)))
                .addTo(contentLayer);
        });
        map.invalidateSize({pan: false});
        if (!fittedRef.current && positionedSessions.length) {
            fittedRef.current = true;
            map.fitBounds(L.latLngBounds(positionedSessions.map((session) =>
                [session.lastPosition?.latitude, session.lastPosition?.longitude] as L.LatLngTuple)), {
                animate: false,
                maxZoom: 13,
                padding: [36, 36],
            });
        }
    }, [now, positionedSessions, registrationNumbers, route, selectedSessionId]);

    const select = (session: TrackingSessionDto) => {
        const key = sessionKey(session);
        setSelectedSessionId(key === selectedSessionId ? null : key);
        if (session.lastPosition && mapRef.current) {
            mapRef.current.setView([session.lastPosition.latitude, session.lastPosition.longitude], 14, {animate: false});
        }
    };

    const signalDescription = (session: TrackingSessionDto) => {
        const age = signalAgeMinutes(session, now);
        if (age === null) {
            return translations.signal.none;
        }
        return age === 0 ? translations.signal.now : translations.signal.minutesAgo.replace("{minutes}", String(age));
    };

    return (
        <main className="pallet-page">
            <div className="pallet-shell pallet-shell-wide">
                <section className="pallet-header">
                    <div className="pallet-title">
                        <span className="pallet-title-icon"><LocationOn/></span>
                        <div>
                            <Typography variant="h4">{translations.title}</Typography>
                            <p>{translations.subtitle}</p>
                        </div>
                    </div>
                    <div className="pallet-actions">
                        <IconButton aria-label={pl.common.refresh} title={pl.common.refresh} onClick={load}><Refresh fontSize="small"/></IconButton>
                    </div>
                </section>

                {error ? <Alert severity="error">{error}</Alert> : null}

                <section className="fleet-tracking-layout">
                    <div className="fleet-tracking-list" aria-label={translations.listLabel} aria-busy={loading}>
                        {sessions.length ? sessions.map((session) => {
                            const key = sessionKey(session);
                            const speed = speedKilometersPerHour(session);
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    className={`fleet-tracking-item${key === selectedSessionId ? " is-selected" : ""}`}
                                    onClick={() => select(session)}
                                >
                                    <strong>{vehicleLabel(session, registrationNumbers) || translations.noVehicle}</strong>
                                    <span>{session.driverUsername || pl.common.dash}{session.departmentCode ? ` · ${session.departmentCode}` : ""}</span>
                                    <span className={`fleet-tracking-signal is-${signalState(session, now)}`}>
                                        {signalDescription(session)}{speed !== null ? ` · ${speed} km/h` : ""}
                                    </span>
                                </button>
                            );
                        }) : (
                            <div className="fleet-tracking-empty">{loading ? pl.common.loading : translations.empty}</div>
                        )}
                    </div>
                    <div className="fleet-tracking-map" ref={mapElementRef} aria-label={translations.mapLabel}/>
                </section>
            </div>
        </main>
    );
};

export default FleetTrackingMap;
