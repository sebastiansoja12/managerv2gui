import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import {Alert, Button, Typography} from "components/ui";
import {Coordinates} from "../../class/depots/Department";
import Department from "../../class/depots/Department";
import pl from "../../i18n/translate";
import {DeliveryArea, readAreas, storageKeyFor, writeAreas} from "./deliveryAreaDraft";
import {AreaPoint, insertionIndex, isValidArea} from "./deliveryAreaGeometry";
import {countryBoundary, GeneratedDepartmentAreas, generateDeliveryAreas, isEligibleForAutomaticAreas} from "./generateDeliveryAreas";
import "./styles/delivery-area-editor.css";

type DeliveryAreaEditorProps = {
    departmentId: string;
    departmentCode: string;
    coordinates?: Coordinates | null;
    operatorId?: number;
    canEdit: boolean;
    active: boolean;
    automaticOnly?: boolean;
    automaticDepartments?: Department[];
    onAutomaticClose?: () => void;
    onAutomaticApplied?: (count: number) => void;
};

type EditorMode = "idle" | "draw" | "insert";

const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const DEFAULT_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const AREA_COLOR = "#0f766e";
const SELECTED_COLOR = "#d97706";
const PREVIEW_COLORS = ["#2563eb", "#dc2626", "#059669", "#9333ea", "#d97706", "#0891b2", "#be185d"];
const EMPTY_DEPARTMENTS: Department[] = [];

const toLatLng = ({latitude, longitude}: AreaPoint): L.LatLngTuple => [latitude, longitude];


const DeliveryAreaEditor: React.FC<DeliveryAreaEditorProps> = ({
    departmentId, departmentCode, coordinates, operatorId, canEdit, active,
    automaticOnly = false, automaticDepartments = EMPTY_DEPARTMENTS, onAutomaticClose, onAutomaticApplied,
}) => {
    const labels = pl.departments.deliveryArea;
    const storageKey = storageKeyFor(operatorId, departmentId);
    const mapElementRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layerRef = useRef<L.LayerGroup | null>(null);
    const previewRef = useRef<L.Polyline | null>(null);
    const [areas, setAreas] = useState<DeliveryArea[]>(() => readAreas(storageKey));
    const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
    const [selectedVertexIndex, setSelectedVertexIndex] = useState<number | null>(null);
    const [mode, setMode] = useState<EditorMode>("idle");
    const [expanded, setExpanded] = useState(false);
    const [draftPoints, setDraftPoints] = useState<AreaPoint[]>([]);
    const [dirty, setDirty] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [automaticStep, setAutomaticStep] = useState<"closed" | "choose" | "preview">(automaticOnly ? "choose" : "closed");
    const [eligibleDepartments, setEligibleDepartments] = useState<Department[]>(
        () => automaticDepartments.filter(isEligibleForAutomaticAreas)
            .sort((first, second) => first.departmentCode.value.localeCompare(second.departmentCode.value)),
    );
    const [excludedCount, setExcludedCount] = useState(0);
    const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<number[]>(
        () => automaticDepartments.filter(isEligibleForAutomaticAreas).map((item) => item.departmentId),
    );
    const [generatedPreview, setGeneratedPreview] = useState<GeneratedDepartmentAreas[]>([]);
    const selectedArea = useMemo(() => areas.find((area) => area.id === selectedAreaId), [areas, selectedAreaId]);
    const latitude = coordinates?.latitude;
    const longitude = coordinates?.longitude;
    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)
        && Math.abs(latitude as number) <= 90 && Math.abs(longitude as number) <= 180;
    const tileUrl = process.env.REACT_APP_MAP_TILE_URL || DEFAULT_TILE_URL;
    const tileAttribution = process.env.REACT_APP_MAP_TILE_ATTRIBUTION || DEFAULT_ATTRIBUTION;

    useEffect(() => {
        setAreas(readAreas(storageKey));
        setSelectedAreaId(null);
        setSelectedVertexIndex(null);
        setMode("idle");
        setExpanded(false);
        setDraftPoints([]);
        setDirty(false);
        setNotice(null);
        setError(null);
        setAutomaticStep(automaticOnly ? "choose" : "closed");
        setGeneratedPreview([]);
        if (automaticOnly) {
            const eligible = automaticDepartments.filter(isEligibleForAutomaticAreas)
                .sort((first, second) => first.departmentCode.value.localeCompare(second.departmentCode.value));
            setEligibleDepartments(eligible);
            setExcludedCount(automaticDepartments.length - eligible.length);
            setSelectedDepartmentIds(eligible.map((item) => item.departmentId));
        }
    }, [automaticDepartments, automaticOnly, storageKey]);

    useEffect(() => {
        if (active && !dirty && automaticStep === "closed") {
            setAreas(readAreas(storageKey));
        }
    }, [active, automaticStep, dirty, storageKey]);

    useEffect(() => {
        if (!mapElementRef.current) {
            return undefined;
        }

        const map = L.map(mapElementRef.current, {
            scrollWheelZoom: true,
            zoomAnimation: false,
            fadeAnimation: false,
            markerZoomAnimation: false,
        }).setView(hasCoordinates ? [latitude as number, longitude as number] : [52, 19], hasCoordinates ? 11 : 6);
        const layer = L.layerGroup().addTo(map);
        L.tileLayer(tileUrl, {attribution: tileAttribution}).addTo(map);
        mapRef.current = map;
        layerRef.current = layer;

        return () => {
            previewRef.current = null;
            layerRef.current = null;
            mapRef.current = null;
            map.stop();
            map.remove();
        };
    }, [hasCoordinates, latitude, longitude, tileAttribution, tileUrl]);

    useEffect(() => {
        if (active) {
            mapRef.current?.invalidateSize({pan: false});
        }
    }, [active, expanded]);

    const finishDrawing = useCallback(() => {
        if (!isValidArea(draftPoints)) {
            setError(labels.invalidShape);
            return;
        }
        const existingNames = new Set(areas.map((existing) => existing.name));
        let nextAreaNumber = 1;
        while (existingNames.has(`${labels.areaName} ${nextAreaNumber}`)) {
            nextAreaNumber += 1;
        }
        const area: DeliveryArea = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: `${labels.areaName} ${nextAreaNumber}`,
            points: draftPoints,
        };
        setAreas((current) => [...current, area]);
        setSelectedAreaId(area.id);
        setSelectedVertexIndex(null);
        setDraftPoints([]);
        setMode("idle");
        setDirty(true);
        setError(null);
        setNotice(null);
    }, [areas, draftPoints, labels.areaName, labels.invalidShape]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !canEdit || mode === "idle") {
            return undefined;
        }

        const onMapClick = (event: L.LeafletMouseEvent) => {
            const point = {latitude: event.latlng.lat, longitude: event.latlng.lng};
            if (mode === "draw") {
                setDraftPoints((current) => [...current, point]);
                setError(null);
            } else if (selectedArea) {
                const nextPoints = [...selectedArea.points];
                nextPoints.splice(insertionIndex(nextPoints, point), 0, point);
                if (!isValidArea(nextPoints)) {
                    setError(labels.invalidShape);
                    return;
                }
                setAreas((current) => current.map((area) => area.id === selectedArea.id
                    ? {...area, points: nextPoints} : area));
                setDirty(true);
                setMode("idle");
                setSelectedVertexIndex(null);
                setError(null);
                setNotice(null);
            }
        };
        map.on("click", onMapClick);
        return () => {
            map.off("click", onMapClick);
        };
    }, [canEdit, labels.invalidShape, mode, selectedArea]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || mode !== "draw" || draftPoints.length === 0) {
            return undefined;
        }

        const onMouseMove = (event: L.LeafletMouseEvent) => {
            previewRef.current?.setLatLngs([
                toLatLng(draftPoints[draftPoints.length - 1]), event.latlng,
            ]);
        };
        const onMouseOut = () => previewRef.current?.setLatLngs([]);
        map.on("mousemove", onMouseMove);
        map.on("mouseout", onMouseOut);
        return () => {
            map.off("mousemove", onMouseMove);
            map.off("mouseout", onMouseOut);
        };
    }, [draftPoints, mode]);

    useEffect(() => {
        if (!active || mode !== "draw") {
            return undefined;
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setMode("idle");
                setDraftPoints([]);
                setError(null);
            } else if (event.key === "Backspace") {
                event.preventDefault();
                setDraftPoints((current) => current.slice(0, -1));
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [active, mode]);

    useEffect(() => {
        if (!expanded || mode !== "idle") {
            return undefined;
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setExpanded(false);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [expanded, mode]);

    useEffect(() => {
        const map = mapRef.current;
        const layer = layerRef.current;
        if (!map || !layer) {
            return;
        }

        layer.clearLayers();
        previewRef.current = null;
        if (automaticStep === "preview") {
            generatedPreview.forEach((generated, index) => {
                const color = PREVIEW_COLORS[index % PREVIEW_COLORS.length];
                generated.areas.forEach((area) => {
                    L.polygon(area.points.map(toLatLng), {
                        color, fillColor: color, fillOpacity: 0.23, weight: 2,
                    }).bindTooltip(generated.departmentCode).addTo(layer);
                });
                const branch = eligibleDepartments.find((item) => String(item.departmentId) === generated.departmentId);
                if (branch?.coordinates) {
                    L.circleMarker([branch.coordinates.latitude, branch.coordinates.longitude], {
                        color: "#ffffff", fillColor: color, fillOpacity: 1, radius: 6, weight: 2,
                    }).bindTooltip(generated.departmentCode).addTo(layer);
                }
            });
            return;
        }

        areas.forEach((area) => {
            const selected = area.id === selectedAreaId;
            const polygon = L.polygon(area.points.map(toLatLng), {
                color: selected ? SELECTED_COLOR : AREA_COLOR,
                fillColor: selected ? SELECTED_COLOR : AREA_COLOR,
                fillOpacity: selected ? 0.25 : 0.14,
                weight: selected ? 4 : 3,
            }).bindTooltip(area.name).addTo(layer);
            polygon.on("click", () => {
                if (mode === "idle") {
                    setSelectedAreaId(area.id);
                    setSelectedVertexIndex(null);
                }
            });

            if (selected && canEdit && mode === "idle") {
                area.points.forEach((point, index) => {
                    const marker = L.marker(toLatLng(point), {
                        draggable: true,
                        icon: L.divIcon({
                            className: selectedVertexIndex === index
                                ? "delivery-area-vertex selected" : "delivery-area-vertex",
                            iconSize: [14, 14], iconAnchor: [7, 7],
                        }),
                    }).addTo(layer);
                    marker.on("click", () => setSelectedVertexIndex(index));
                    marker.on("drag", () => {
                        const nextPoints = [...area.points];
                        const position = marker.getLatLng();
                        nextPoints[index] = {latitude: position.lat, longitude: position.lng};
                        polygon.setLatLngs(nextPoints.map(toLatLng));
                    });
                    marker.on("dragend", () => {
                        const position = marker.getLatLng();
                        const nextPoints = [...area.points];
                        nextPoints[index] = {latitude: position.lat, longitude: position.lng};
                        if (!isValidArea(nextPoints)) {
                            marker.setLatLng(toLatLng(point));
                            polygon.setLatLngs(area.points.map(toLatLng));
                            setError(labels.invalidShape);
                            return;
                        }
                        setAreas((current) => current.map((candidate) => candidate.id === area.id
                            ? {...candidate, points: nextPoints} : candidate));
                        setDirty(true);
                        setError(null);
                        setNotice(null);
                    });
                });
            }
        });

        if (hasCoordinates) {
            L.circleMarker([latitude as number, longitude as number], {
            color: "#ffffff", fillColor: "#2563a9", fillOpacity: 1, radius: 9, weight: 3,
            }).bindTooltip(departmentCode, {permanent: true, direction: "top", offset: [0, -8]}).addTo(layer);
        }

        if (draftPoints.length > 0) {
            L.polyline(draftPoints.map(toLatLng), {color: SELECTED_COLOR, weight: 3, dashArray: "6 6"}).addTo(layer);
            previewRef.current = L.polyline([], {color: SELECTED_COLOR, weight: 2, dashArray: "4 5"}).addTo(layer);
            draftPoints.forEach((point, index) => {
                const first = index === 0;
                const canFinish = first && draftPoints.length >= 3;
                const marker = L.circleMarker(toLatLng(point), {
                    bubblingMouseEvents: false,
                    className: canFinish ? "delivery-area-start-point" : undefined,
                    color: "#ffffff", fillColor: canFinish ? AREA_COLOR : SELECTED_COLOR,
                    fillOpacity: 1, radius: first ? 10 : 6, weight: 2,
                }).addTo(layer);
                if (canFinish) {
                    marker.bindTooltip(labels.closeAtStart);
                    marker.on("click", finishDrawing);
                }
            });
        }
    }, [areas, automaticStep, canEdit, departmentCode, draftPoints, eligibleDepartments, finishDrawing,
        generatedPreview, hasCoordinates, labels.closeAtStart, labels.invalidShape, latitude, longitude, mode,
        selectedAreaId, selectedVertexIndex]);

    const fitPoland = () => mapRef.current?.fitBounds(L.latLngBounds(
        countryBoundary.map(([lng, lat]) => [lat, lng] as L.LatLngTuple),
    ), {padding: [28, 28]});

    useEffect(() => {
        if (!automaticOnly || !active) return undefined;
        const frame = requestAnimationFrame(() => mapRef.current?.fitBounds(L.latLngBounds(
            countryBoundary.map(([lng, lat]) => [lat, lng] as L.LatLngTuple),
        ), {padding: [28, 28]}));
        return () => cancelAnimationFrame(frame);
    }, [active, automaticOnly]);

    const previewAutomatic = () => {
        const selected = eligibleDepartments.filter((item) => selectedDepartmentIds.includes(item.departmentId));
        if (selected.length === 0) {
            setError(labels.automaticSelectOne);
            return;
        }
        try {
            setGeneratedPreview(generateDeliveryAreas(selected));
            setAutomaticStep("preview");
            setError(null);
            requestAnimationFrame(fitPoland);
        } catch (cause) {
            setError(cause instanceof Error && cause.message === "DUPLICATE_COORDINATES"
                ? labels.automaticDuplicate : labels.automaticGenerateError);
        }
    };

    const applyAutomatic = () => {
        let previous: Array<{key: string; value: string | null}> = [];
        try {
            previous = generatedPreview.map((generated) => {
                const key = storageKeyFor(operatorId, generated.departmentId);
                return {key, value: window.localStorage.getItem(key)};
            });
            generatedPreview.forEach((generated) => {
                writeAreas(storageKeyFor(operatorId, generated.departmentId), generated.areas);
            });
            const current = generatedPreview.find((generated) => generated.departmentId === departmentId);
            if (current) {
                setAreas(current.areas);
                setSelectedAreaId(null);
                setSelectedVertexIndex(null);
            }
            setAutomaticStep("closed");
            setGeneratedPreview([]);
            setDirty(false);
            setError(null);
            setNotice(labels.automaticApplied.replace("{count}", String(previous.length)));
            onAutomaticApplied?.(previous.length);
        } catch {
            previous.forEach(({key, value}) => {
                try {
                    if (value === null) window.localStorage.removeItem(key);
                    else window.localStorage.setItem(key, value);
                } catch { /* The browser may have disabled storage. */ }
            });
            setError(labels.automaticApplyError);
        }
    };

    const save = () => {
        try {
            writeAreas(storageKey, areas);
            setDirty(false);
            setNotice(labels.saved);
            setError(null);
        } catch {
            setError(labels.saveError);
        }
    };

    const discard = () => {
        setAreas(readAreas(storageKey));
        setSelectedAreaId(null);
        setSelectedVertexIndex(null);
        setMode("idle");
        setDraftPoints([]);
        setDirty(false);
        setNotice(null);
        setError(null);
    };

    return (
        <section className={`delivery-area-editor${expanded ? " expanded" : ""}${automaticOnly ? " automatic-only" : ""}`}>
            <div className="delivery-area-header">
                <div>
                    <Typography variant="h5">{automaticOnly ? labels.automaticTitle : labels.title}</Typography>
                    <p>{automaticOnly ? labels.automaticDescription : labels.description}</p>
                </div>
                <div className="delivery-area-actions">
                        {automaticOnly ? <Button variant="outlined" onClick={onAutomaticClose}>{pl.common.close}</Button> : null}
                        {!automaticOnly ? <>
                        <Button aria-pressed={expanded} variant="outlined" onClick={() => setExpanded((current) => !current)}>
                            {expanded ? labels.exitFullScreen : labels.fullScreen}
                        </Button>
                        {canEdit ? <>
                            <Button variant="outlined" disabled={automaticStep !== "closed" || (!dirty && mode === "idle")} onClick={discard}>
                                {labels.discard}
                            </Button>
                            <Button variant="contained" disabled={automaticStep !== "closed" || !dirty || mode !== "idle"} onClick={save}>
                                {labels.saveDraft}
                            </Button>
                        </> : null}
                        </> : null}
                    </div>
            </div>
            {!automaticOnly ? <Alert severity="info">{labels.localDraft}</Alert> : null}
            {!automaticOnly && !hasCoordinates ? <Alert severity="warning">{labels.missingCoordinates}</Alert> : null}
            {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : null}
            {notice ? <Alert severity="success" onClose={() => setNotice(null)}>{notice}</Alert> : null}
            {automaticStep !== "closed" ? <Alert severity="info">{labels.automaticSource}</Alert> : null}
            {(
                <div className="delivery-area-workspace">
                    <div className="delivery-area-map-panel">
                        <div className="delivery-area-map-toolbar">
                            <div className="delivery-area-map-hint">
                                {automaticStep === "preview" ? labels.automaticPreviewHint
                                    : automaticStep === "choose" ? labels.automaticDescription
                                    : mode === "draw" ? (draftPoints.length >= 3 ? labels.closeHint : labels.drawHint)
                                    : mode === "insert" ? labels.insertHint : labels.selectHint}
                            </div>
                            {canEdit && automaticStep === "closed" && hasCoordinates ? <div className="delivery-area-draw-actions">
                                {mode === "draw" ? <>
                                    <Button variant="outlined" disabled={draftPoints.length === 0}
                                            onClick={() => setDraftPoints((current) => current.slice(0, -1))}>
                                        {labels.undoPoint}
                                    </Button>
                                    <Button variant="contained" disabled={draftPoints.length < 3} onClick={finishDrawing}>
                                        {labels.finishArea}
                                    </Button>
                                    <Button variant="text" onClick={() => { setMode("idle"); setDraftPoints([]); setError(null); }}>
                                        {labels.cancelDrawing}
                                    </Button>
                                </> : mode === "insert" ? (
                                    <Button variant="outlined" onClick={() => setMode("idle")}>{labels.cancelInsert}</Button>
                                ) : (
                                    <Button variant="contained" onClick={() => {
                                        setMode("draw");
                                        setSelectedVertexIndex(null);
                                        setDraftPoints([]);
                                        setError(null);
                                    }}>{labels.newArea}</Button>
                                )}
                            </div> : null}
                            {automaticStep !== "closed" ? <Button variant="text" onClick={fitPoland}>{labels.automaticTitle}</Button>
                                : hasCoordinates ? <Button variant="text" onClick={() => mapRef.current?.setView(
                                [latitude as number, longitude as number], 11,
                            )}>{labels.centerOnDepartment}</Button> : null}
                        </div>
                        <div aria-label={labels.mapLabel} className={`delivery-area-map${mode !== "idle" ? " drawing" : ""}`}
                             ref={mapElementRef} />
                    </div>
                    <aside className="delivery-area-sidebar">
                        {automaticStep === "choose" ? <>
                            <div className="delivery-area-sidebar-heading"><strong>{labels.automaticTitle}</strong></div>
                            <p className="delivery-area-tip">{labels.automaticDescription}</p>
                            {excludedCount > 0 ? <p className="delivery-area-tip">{
                                labels.automaticExcluded.replace("{count}", String(excludedCount))}</p> : null}
                            {eligibleDepartments.length === 0 ? <p className="delivery-area-empty">{labels.automaticNone}</p> : <>
                                <strong>{labels.automaticSelected.replace("{count}", String(selectedDepartmentIds.length))}</strong>
                                <div className="delivery-area-department-list">
                                    {eligibleDepartments.map((item) => <label key={item.departmentId}>
                                        <input type="checkbox" checked={selectedDepartmentIds.includes(item.departmentId)}
                                               onChange={(event) => setSelectedDepartmentIds((current) => event.target.checked
                                                   ? [...current, item.departmentId]
                                                   : current.filter((id) => id !== item.departmentId))} />
                                        <span><strong>{item.departmentCode.value}</strong><small>{item.address.city}</small></span>
                                    </label>)}
                                </div>
                                <Button variant="contained" disabled={selectedDepartmentIds.length === 0}
                                        onClick={previewAutomatic}>{labels.automaticPreview}</Button>
                            </>}
                            <Button variant="outlined" onClick={automaticOnly ? onAutomaticClose : () => setAutomaticStep("closed")}>
                                {labels.automaticCancel}</Button>
                        </> : automaticStep === "preview" ? <>
                            <div className="delivery-area-sidebar-heading"><strong>{labels.automaticPreviewTitle}</strong>
                                <span>{generatedPreview.length}</span></div>
                            <p className="delivery-area-tip">{labels.automaticPreviewHint}</p>
                            <div className="delivery-area-department-list preview">
                                {generatedPreview.map((generated, index) => <div key={generated.departmentId}>
                                    <span className="delivery-area-color" style={{backgroundColor: PREVIEW_COLORS[index % PREVIEW_COLORS.length]}} />
                                    <strong>{generated.departmentCode}</strong>
                                </div>)}
                            </div>
                            <Button variant="contained" onClick={applyAutomatic}>{labels.automaticApply}</Button>
                            <Button variant="outlined" onClick={() => setAutomaticStep("choose")}>{labels.automaticBack}</Button>
                            <Button variant="text" onClick={automaticOnly ? onAutomaticClose
                                : () => {setAutomaticStep("closed"); setGeneratedPreview([]);}}>
                                {labels.automaticCancel}</Button>
                        </> : <>
                        <div className="delivery-area-sidebar-heading">
                            <strong>{labels.areasTitle}</strong>
                            <span>{areas.length}</span>
                        </div>
                        {areas.length === 0 ? <p className="delivery-area-empty">{labels.empty}</p> : (
                            <div className="delivery-area-list">
                                {areas.map((area) => (
                                    <button aria-pressed={selectedAreaId === area.id} className={selectedAreaId === area.id ? "selected" : ""}
                                            disabled={mode !== "idle"}
                                            key={area.id} onClick={() => {
                                                setSelectedAreaId(area.id);
                                                setSelectedVertexIndex(null);
                                                setMode("idle");
                                                setDraftPoints([]);
                                                mapRef.current?.fitBounds(L.latLngBounds(area.points.map(toLatLng)), {
                                                    padding: [48, 48], maxZoom: 14,
                                                });
                                            }}
                                            type="button">
                                        <strong>{area.name}</strong>
                                        <span>{labels.pointCount.replace("{count}", String(area.points.length))}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {canEdit && selectedArea && mode === "idle" ? (
                            <div className="delivery-area-tools">
                                <Button variant="outlined" onClick={() => setMode("insert")}>{labels.addPoint}</Button>
                                {selectedVertexIndex !== null && selectedArea.points.length > 3 ? (
                                    <Button variant="outlined" onClick={() => {
                                        const nextPoints = selectedArea.points.filter((_, index) => index !== selectedVertexIndex);
                                        if (!isValidArea(nextPoints)) {
                                            setError(labels.invalidShape);
                                            return;
                                        }
                                        setAreas((current) => current.map((area) => area.id === selectedArea.id
                                            ? {...area, points: nextPoints} : area));
                                        setSelectedVertexIndex(null);
                                        setDirty(true);
                                        setNotice(null);
                                    }}>{labels.removePoint}</Button>
                                ) : null}
                                <Button variant="outlined" onClick={() => {
                                    setAreas((current) => current.filter((area) => area.id !== selectedArea.id));
                                    setSelectedAreaId(null);
                                    setSelectedVertexIndex(null);
                                    setDirty(true);
                                    setNotice(null);
                                }}>{labels.removeArea}</Button>
                            </div>
                        ) : null}
                        {selectedArea && mode === "idle" && canEdit ? (
                            <p className="delivery-area-tip">{labels.editHint}</p>
                        ) : null}
                        </>}
                    </aside>
                </div>
            )}
        </section>
    );
};

export default DeliveryAreaEditor;
