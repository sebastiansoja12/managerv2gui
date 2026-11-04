import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import {Alert, Button, TextField} from "components/ui";
import {AccountTree, Add, Close, Hub, Map as MapIcon, WarningAmberOutlined} from "components/ui/icons";
import Department from "../../class/depots/Department";
import pl from "../../i18n/translate";
import DepartmentPicker from "./DepartmentPicker";
import {
    DepartmentRelation,
    departmentRelationPairKey,
    isOneWayRelation,
    nextRelationDirection,
} from "./model/DepartmentRelation";
import "./styles/department-relations-map.css";

type DepartmentRelationsMapProps = {
    departments: Department[];
    relations: DepartmentRelation[];
    onRelationsChange: (relations: DepartmentRelation[]) => void;
    bidirectionalByDefault?: boolean;
};

type MappedDepartment = {
    department: Department;
    position: [number, number];
};

const DEFAULT_CENTER: L.LatLngExpression = [52.0693, 19.4803];
const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const DEFAULT_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const SORTING_FACILITY = "SORTING_FACILITY";
const LABEL_ZOOM_THRESHOLD = 8;
const OVERLAP_SPREAD_DEGREES = 0.012;
const LINE_COLOR = "#2563a9";
const ACTIVE_COLOR = "#f59e0b";
const SELECTED_RELATION_COLOR = "#dc2626";

const departmentCode = (department: Department) => department.departmentCode?.value || String(department.departmentId);
const departmentId = (department: Department) => String(department.departmentId);

const isRelationCandidate = (department: Department) => (
    department.status !== "ARCHIVED" && department.status !== "DELETED"
);

const departmentPosition = (department: Department): [number, number] | null => {
    const latitude = department.coordinates?.latitude;
    const longitude = department.coordinates?.longitude;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
    }

    return [latitude as number, longitude as number];
};

export const getDepartmentsMissingSortingRelation = (
    departments: Department[],
    relations: DepartmentRelation[],
) => {
    const activeDepartments = departments.filter(isRelationCandidate);
    const activeDepartmentIds = new Set(activeDepartments.map(departmentId));
    const sortingFacilityIds = new Set(activeDepartments
        .filter((department) => department.departmentType === SORTING_FACILITY)
        .map(departmentId));

    return activeDepartments.filter((department) => {
        if (department.departmentType === SORTING_FACILITY) {
            return false;
        }

        return !relations.some((relation) => {
            if (!activeDepartmentIds.has(relation.sourceDepartmentId)
                || !activeDepartmentIds.has(relation.targetDepartmentId)) {
                return false;
            }

            const currentDepartmentId = departmentId(department);
            return (relation.sourceDepartmentId === currentDepartmentId
                    && sortingFacilityIds.has(relation.targetDepartmentId))
                || (relation.targetDepartmentId === currentDepartmentId
                    && sortingFacilityIds.has(relation.sourceDepartmentId));
        });
    });
};

export const getUniqueDepartmentRelations = (relations: DepartmentRelation[]) => {
    const relationKeys = new Set<string>();

    return relations.filter((relation) => {
        const relationKey = departmentRelationPairKey(relation);
        if (relationKeys.has(relationKey)) {
            return false;
        }

        relationKeys.add(relationKey);
        return true;
    });
};

const distanceBetweenDepartments = (source: Department, target: Department) => {
    const sourcePosition = departmentPosition(source);
    const targetPosition = departmentPosition(target);
    if (!sourcePosition || !targetPosition) {
        return Number.POSITIVE_INFINITY;
    }

    const latitudeScale = Math.cos((sourcePosition[0] + targetPosition[0]) * Math.PI / 360);
    const latitudeDistance = targetPosition[0] - sourcePosition[0];
    const longitudeDistance = (targetPosition[1] - sourcePosition[1]) * latitudeScale;
    return latitudeDistance * latitudeDistance + longitudeDistance * longitudeDistance;
};

export const getRelationsWithAutomaticSortingAssignments = (
    departments: Department[],
    relations: DepartmentRelation[],
) => {
    const activeSortingFacilities = departments
        .filter((department) => isRelationCandidate(department) && department.departmentType === SORTING_FACILITY)
        .sort((first, second) => departmentCode(first).localeCompare(departmentCode(second)));
    if (!activeSortingFacilities.length) {
        return relations;
    }

    const relationKeys = new Set(relations.map(departmentRelationPairKey));
    const automaticRelations = getDepartmentsMissingSortingRelation(departments, relations)
        .reduce<DepartmentRelation[]>((result, department) => {
            const sortingFacility = activeSortingFacilities.length === 1
                ? activeSortingFacilities[0]
                : activeSortingFacilities
                    .filter((candidate) => Number.isFinite(distanceBetweenDepartments(department, candidate)))
                    .sort((first, second) => (
                        distanceBetweenDepartments(department, first) - distanceBetweenDepartments(department, second)
                    ))[0];

            if (!sortingFacility) {
                return result;
            }

            const relation = {
                sourceDepartmentId: departmentId(department),
                targetDepartmentId: departmentId(sortingFacility),
            };
            const relationKey = departmentRelationPairKey(relation);
            if (!relationKeys.has(relationKey)) {
                relationKeys.add(relationKey);
                result.push(relation);
            }
            return result;
        }, []);

    return [...relations, ...automaticRelations];
};

const relationLabel = (first: string, second: string, oneWay = false) => `${first} ${oneWay ? "→" : "↔"} ${second}`;

const departmentTypeLabel = (department: Department) => (
    pl.departments.type[department.departmentType as keyof typeof pl.departments.type]
    || department.departmentType
    || pl.common.dash
);

const positionKey = ([latitude, longitude]: [number, number]) => `${latitude.toFixed(4)}:${longitude.toFixed(4)}`;

export const spreadOverlappingDepartments = (departments: MappedDepartment[]): MappedDepartment[] => {
    const departmentsByPosition = departments.reduce<Map<string, MappedDepartment[]>>((groups, item) => {
        const key = positionKey(item.position);
        groups.set(key, [...(groups.get(key) || []), item]);
        return groups;
    }, new Map());

    return departments.map((item) => {
        const group = departmentsByPosition.get(positionKey(item.position)) || [];
        if (group.length < 2) {
            return item;
        }
        const index = group.indexOf(item);
        const angle = 2 * Math.PI * index / group.length;
        return {
            department: item.department,
            position: [
                item.position[0] + OVERLAP_SPREAD_DEGREES * Math.sin(angle),
                item.position[1] + OVERLAP_SPREAD_DEGREES * Math.cos(angle) / Math.cos(item.position[0] * Math.PI / 180),
            ],
        };
    });
};

type Feedback = {
    severity: "success" | "info";
    message: string;
};


const DepartmentRelationsMap: React.FC<DepartmentRelationsMapProps> = ({
    departments,
    relations,
    onRelationsChange,
    bidirectionalByDefault,
}) => {
    const translations = pl.departments.relations;
    const mapElementRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const relationLayerRef = useRef<L.LayerGroup | null>(null);
    const markerLayerRef = useRef<L.LayerGroup | null>(null);
    const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());
    const fittedDepartmentsKeyRef = useRef<string>("");
    const [sourceDepartmentId, setSourceDepartmentId] = useState<string | null>(null);
    const [hoveredDepartmentId, setHoveredDepartmentId] = useState<string | null>(null);
    const [selectedRelationKey, setSelectedRelationKey] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [formSourceId, setFormSourceId] = useState<string>("");
    const [formTargetId, setFormTargetId] = useState<string>("");
    const [relationFilter, setRelationFilter] = useState<string>("");
    const tileUrl = process.env.REACT_APP_MAP_TILE_URL || DEFAULT_TILE_URL;
    const tileAttribution = process.env.REACT_APP_MAP_TILE_ATTRIBUTION || DEFAULT_ATTRIBUTION;

    const relationCandidates = useMemo(
        () => departments.filter(isRelationCandidate),
        [departments],
    );
    const departmentsById = useMemo(
        () => new Map(departments.map((department) => [departmentId(department), department])),
        [departments],
    );
    const mappedDepartments = useMemo(() => spreadOverlappingDepartments(
        relationCandidates.reduce<MappedDepartment[]>((result, department) => {
            const position = departmentPosition(department);
            if (position) {
                result.push({department, position});
            }
            return result;
        }, []),
    ), [relationCandidates]);
    const mappedDepartmentsById = useMemo(
        () => new Map(mappedDepartments.map((item) => [departmentId(item.department), item])),
        [mappedDepartments],
    );
    const missingDepartments = useMemo(
        () => getDepartmentsMissingSortingRelation(departments, relations),
        [departments, relations],
    );
    const uniqueRelations = useMemo(
        () => getUniqueDepartmentRelations(relations),
        [relations],
    );
    const relationKeys = useMemo(
        () => new Set(uniqueRelations.map(departmentRelationPairKey)),
        [uniqueRelations],
    );
    const connectedDepartmentIds = useMemo(() => {
        const connections = new Map<string, Set<string>>();
        uniqueRelations.forEach((relation) => {
            connections.set(relation.sourceDepartmentId, (connections.get(relation.sourceDepartmentId) || new Set())
                .add(relation.targetDepartmentId));
            connections.set(relation.targetDepartmentId, (connections.get(relation.targetDepartmentId) || new Set())
                .add(relation.sourceDepartmentId));
        });
        return connections;
    }, [uniqueRelations]);
    const missingDepartmentIds = useMemo(
        () => new Set(missingDepartments.map(departmentId)),
        [missingDepartments],
    );
    const sortingFacilities = useMemo(
        () => relationCandidates.filter((department) => department.departmentType === SORTING_FACILITY),
        [relationCandidates],
    );
    const relationsWithAutomaticAssignments = useMemo(
        () => getRelationsWithAutomaticSortingAssignments(departments, relations),
        [departments, relations],
    );
    const automaticAssignmentCount = relationsWithAutomaticAssignments.length - relations.length;
    const hasMappedDepartments = mappedDepartments.length > 0;
    const unmappedCount = relationCandidates.length - mappedDepartments.length;
    const focusedDepartmentId = sourceDepartmentId ?? hoveredDepartmentId;

    const codeOf = useCallback((id: string) => {
        const department = departmentsById.get(id);
        return department ? departmentCode(department) : id;
    }, [departmentsById]);

    const addRelation = useCallback((sourceId: string, targetId: string) => {
        if (sourceId === targetId
            || !departmentsById.has(sourceId)
            || !departmentsById.has(targetId)) {
            return;
        }

        const relation = {sourceDepartmentId: sourceId, targetDepartmentId: targetId, bidirectional: bidirectionalByDefault};
        const label = relationLabel(codeOf(sourceId), codeOf(targetId), bidirectionalByDefault === false);
        if (relationKeys.has(departmentRelationPairKey(relation))) {
            setFeedback({severity: "info", message: translations.relationExists.replace("{relation}", label)});
            return;
        }

        onRelationsChange([...relations, relation]);
        setFeedback({severity: "success", message: translations.relationAdded.replace("{relation}", label)});
    }, [bidirectionalByDefault, codeOf, departmentsById, onRelationsChange, relationKeys, relations, translations]);

    const selectMapDepartment = useCallback((selectedDepartmentId: string) => {
        setSelectedRelationKey(null);
        if (sourceDepartmentId === null) {
            setSourceDepartmentId(selectedDepartmentId);
            setFeedback(null);
            return;
        }

        if (sourceDepartmentId === selectedDepartmentId) {
            setSourceDepartmentId(null);
            return;
        }

        addRelation(sourceDepartmentId, selectedDepartmentId);
    }, [addRelation, sourceDepartmentId]);

    const clearSelection = useCallback(() => {
        setSourceDepartmentId(null);
        setSelectedRelationKey(null);
    }, []);

    const removeRelation = (relation: DepartmentRelation) => {
        const relationKey = departmentRelationPairKey(relation);
        onRelationsChange(relations.filter((currentRelation) => departmentRelationPairKey(currentRelation) !== relationKey));
        setSelectedRelationKey(null);
        setFeedback({
            severity: "info",
            message: translations.relationRemoved.replace(
                "{relation}",
                relationLabel(codeOf(relation.sourceDepartmentId), codeOf(relation.targetDepartmentId)),
            ),
        });
    };

    const changeRelationDirection = (relation: DepartmentRelation) => {
        const relationKey = departmentRelationPairKey(relation);
        const changedRelation = nextRelationDirection(relation);
        onRelationsChange(relations.map((currentRelation) => (
            departmentRelationPairKey(currentRelation) === relationKey ? changedRelation : currentRelation
        )));
        setFeedback({
            severity: "info",
            message: translations.directionChanged.replace("{relation}", relationLabel(
                codeOf(changedRelation.sourceDepartmentId),
                codeOf(changedRelation.targetDepartmentId),
                isOneWayRelation(changedRelation),
            )),
        });
    };

    const focusRelation = (relation: DepartmentRelation) => {
        setSourceDepartmentId(null);
        setSelectedRelationKey(departmentRelationPairKey(relation));
        const source = mappedDepartmentsById.get(relation.sourceDepartmentId);
        const target = mappedDepartmentsById.get(relation.targetDepartmentId);
        if (mapRef.current && source && target) {
            mapRef.current.fitBounds(L.latLngBounds([source.position, target.position]), {
                animate: false,
                maxZoom: 10,
                padding: [80, 80],
            });
        }
    };

    const submitFormRelation = () => {
        if (!formSourceId || !formTargetId) {
            return;
        }

        addRelation(formSourceId, formTargetId);
        setFormTargetId("");
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                clearSelection();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [clearSelection]);

    useEffect(() => {
        if (!hasMappedDepartments || !mapElementRef.current) {
            return undefined;
        }

        const mapElement = mapElementRef.current;
        const map = L.map(mapElement, {
            scrollWheelZoom: true,
            zoomAnimation: false,
            fadeAnimation: false,
            markerZoomAnimation: false,
        }).setView(DEFAULT_CENTER, 6);
        const relationLayer = L.layerGroup().addTo(map);
        const markerLayer = L.layerGroup().addTo(map);
        const updateZoomClass = () => {
            mapElement.classList.toggle("is-zoomed-out", map.getZoom() < LABEL_ZOOM_THRESHOLD);
        };

        L.tileLayer(tileUrl, {attribution: tileAttribution}).addTo(map);
        map.on("zoomend", updateZoomClass);
        map.on("click", clearSelection);
        updateZoomClass();
        mapRef.current = map;
        relationLayerRef.current = relationLayer;
        markerLayerRef.current = markerLayer;
        fittedDepartmentsKeyRef.current = "";

        return () => {
            relationLayerRef.current = null;
            markerLayerRef.current = null;
            mapRef.current = null;
            markersRef.current = new Map();
            map.stop();
            map.remove();
        };
    }, [clearSelection, hasMappedDepartments, tileAttribution, tileUrl]);

    useEffect(() => {
        const map = mapRef.current;
        const markerLayer = markerLayerRef.current;
        if (!map || !markerLayer) {
            return;
        }

        markerLayer.clearLayers();
        const markers = new Map<string, L.CircleMarker>();
        mappedDepartments.forEach(({department, position}) => {
            const currentDepartmentId = departmentId(department);
            const sortingFacility = department.departmentType === SORTING_FACILITY;
            const marker = L.circleMarker(position, {
                bubblingMouseEvents: false,
                className: "department-relations-marker",
                fillColor: sortingFacility ? "#0f766e" : LINE_COLOR,
                fillOpacity: 1,
                radius: sortingFacility ? 12 : 9,
            });
            marker
                .bindTooltip(departmentCode(department), {
                    className: `department-relations-marker-label${sortingFacility ? " is-sorting" : ""}`,
                    direction: "top",
                    offset: [0, -8],
                    opacity: 1,
                    permanent: true,
                })
                .on("click", () => selectMapDepartment(currentDepartmentId))
                .on("mouseover", () => setHoveredDepartmentId(currentDepartmentId))
                .on("mouseout", () => setHoveredDepartmentId((current) => (
                    current === currentDepartmentId ? null : current
                )))
                .addTo(markerLayer);
            markers.set(currentDepartmentId, marker);
        });
        markersRef.current = markers;

        const departmentsKey = mappedDepartments.map((item) => departmentId(item.department)).sort().join(",");
        if (fittedDepartmentsKeyRef.current !== departmentsKey) {
            fittedDepartmentsKeyRef.current = departmentsKey;
            map.invalidateSize({pan: false});
            const positions = mappedDepartments.map((item) => item.position);
            if (positions.length === 1) {
                map.setView(positions[0], 12, {animate: false});
            } else if (positions.length > 1) {
                map.fitBounds(L.latLngBounds(positions), {animate: false, maxZoom: 12, padding: [44, 44]});
            }
        }
    }, [mappedDepartments, selectMapDepartment]);

    useEffect(() => {
        const focusedConnections = focusedDepartmentId ? connectedDepartmentIds.get(focusedDepartmentId) : undefined;
        markersRef.current.forEach((marker, currentDepartmentId) => {
            const selectedSource = sourceDepartmentId === currentDepartmentId;
            const focused = focusedDepartmentId === currentDepartmentId;
            const connectedToFocus = Boolean(focusedConnections?.has(currentDepartmentId));
            const missingSortingRelation = missingDepartmentIds.has(currentDepartmentId);
            const dimmed = Boolean(focusedDepartmentId) && !focused && !connectedToFocus;
            marker.setStyle({
                color: selectedSource || connectedToFocus
                    ? ACTIVE_COLOR
                    : missingSortingRelation ? "#dc2626" : "#ffffff",
                fillOpacity: dimmed ? 0.55 : 1,
                weight: selectedSource ? 5 : connectedToFocus || missingSortingRelation ? 4 : 2,
            });
            if (selectedSource || focused) {
                marker.bringToFront();
            }
            const label = marker.getTooltip()?.getElement();
            label?.classList.toggle("is-active", selectedSource || focused || connectedToFocus);
            label?.classList.toggle("is-source", selectedSource);
        });
    }, [connectedDepartmentIds, focusedDepartmentId, missingDepartmentIds, sourceDepartmentId, mappedDepartments]);

    useEffect(() => {
        const relationLayer = relationLayerRef.current;
        if (!relationLayer) {
            return;
        }

        relationLayer.clearLayers();
        uniqueRelations.forEach((relation) => {
            const source = mappedDepartmentsById.get(relation.sourceDepartmentId);
            const target = mappedDepartmentsById.get(relation.targetDepartmentId);
            if (!source || !target) {
                return;
            }

            const relationKey = departmentRelationPairKey(relation);
            const selected = selectedRelationKey === relationKey;
            const focused = Boolean(focusedDepartmentId)
                && (relation.sourceDepartmentId === focusedDepartmentId || relation.targetDepartmentId === focusedDepartmentId);
            const dimmed = (Boolean(focusedDepartmentId) && !focused) || (Boolean(selectedRelationKey) && !selected);
            L.polyline([source.position, target.position], {
                bubblingMouseEvents: false,
                className: "department-relations-line",
                dashArray: isOneWayRelation(relation) ? "8 6" : undefined,
                color: selected ? SELECTED_RELATION_COLOR : focused ? ACTIVE_COLOR : LINE_COLOR,
                opacity: dimmed ? 0.18 : 0.85,
                weight: selected || focused ? 5 : 3,
            })
                .bindTooltip(relationLabel(departmentCode(source.department), departmentCode(target.department),
                    isOneWayRelation(relation)), {
                    sticky: true,
                })
                .on("click", () => {
                    setSourceDepartmentId(null);
                    setSelectedRelationKey(relationKey);
                })
                .addTo(relationLayer);
        });
    }, [focusedDepartmentId, mappedDepartmentsById, selectedRelationKey, uniqueRelations]);

    const selectedSource = sourceDepartmentId === null ? null : departmentsById.get(sourceDepartmentId);
    const hoveredDepartment = hoveredDepartmentId === null ? null : departmentsById.get(hoveredDepartmentId);
    const selectedRelation = selectedRelationKey === null
        ? null
        : uniqueRelations.find((relation) => departmentRelationPairKey(relation) === selectedRelationKey) || null;
    const formRelationCanBeAdded = Boolean(formSourceId && formTargetId && formSourceId !== formTargetId);
    const formTargetDisabledIds = useMemo(() => new Set([
        formSourceId,
        ...Array.from(connectedDepartmentIds.get(formSourceId) || []),
    ].filter(Boolean)), [connectedDepartmentIds, formSourceId]);
    const normalizedRelationFilter = relationFilter.trim().toLowerCase();
    const filteredRelations = normalizedRelationFilter
        ? uniqueRelations.filter((relation) => (
            relationLabel(codeOf(relation.sourceDepartmentId), codeOf(relation.targetDepartmentId))
                .toLowerCase()
                .includes(normalizedRelationFilter)
        ))
        : uniqueRelations;

    const departmentSummary = (department: Department) => translations.departmentSummary
        .replace("{code}", departmentCode(department))
        .replace("{city}", department.address?.city || pl.common.dash)
        .replace("{type}", departmentTypeLabel(department))
        .replace("{count}", String(connectedDepartmentIds.get(departmentId(department))?.size || 0));

    const instructions = () => {
        if (selectedRelation) {
            const label = relationLabel(codeOf(selectedRelation.sourceDepartmentId),
                codeOf(selectedRelation.targetDepartmentId), isOneWayRelation(selectedRelation));
            return (
                <>
                    <span>{translations.selectedRelation.replace("{relation}", label)}</span>
                    <Button variant="outlined" onClick={() => changeRelationDirection(selectedRelation)}>
                        {translations.changeDirection}
                    </Button>
                    <Button color="error" variant="outlined" startIcon={<Close fontSize="small" />}
                            onClick={() => removeRelation(selectedRelation)}>
                        {translations.removeSelectedRelation}
                    </Button>
                    <Button variant="text" onClick={clearSelection}>{pl.common.cancel}</Button>
                </>
            );
        }
        if (selectedSource) {
            return (
                <>
                    <span>{translations.selectTarget.replace(/\{code}/g, departmentCode(selectedSource))}</span>
                    <Button variant="text" startIcon={<Close fontSize="small" />} onClick={clearSelection}>
                        {translations.finishSelection}
                    </Button>
                </>
            );
        }
        return <span>{hoveredDepartment ? departmentSummary(hoveredDepartment) : translations.selectSource}</span>;
    };

    return (
        <section className="department-relations" aria-label={translations.title}>
            <header className="department-relations-header">
                <div>
                    <span className="department-relations-kicker"><AccountTree fontSize="small" /> {translations.kicker}</span>
                    <h2>{translations.title}</h2>
                    <p>{translations.subtitle}</p>
                </div>
                <div className="department-relations-summary">
                    <div><span>{translations.points}</span><strong>{mappedDepartments.length}</strong></div>
                    <div><span>{translations.relationCount}</span><strong>{uniqueRelations.length}</strong></div>
                    <div className={missingDepartments.length ? "is-invalid" : "is-valid"}>
                        <span>{translations.missingCount}</span><strong>{missingDepartments.length}</strong>
                    </div>
                </div>
            </header>

            {!sortingFacilities.length ? (
                <Alert severity="error">{translations.noSortingFacility}</Alert>
            ) : missingDepartments.length ? (
                <Alert severity="warning">
                    {translations.validationError.replace(
                        "{codes}",
                        missingDepartments.map(departmentCode).join(", "),
                    )}
                </Alert>
            ) : relationCandidates.length ? (
                <Alert severity="success">{translations.validationSuccess}</Alert>
            ) : undefined}

            {unmappedCount > 0 ? (
                <Alert severity="warning">
                    {translations.missingCoordinates.replace("{count}", String(unmappedCount))}
                </Alert>
            ) : undefined}

            <div className="department-relations-workspace">
                <div className="department-relations-map-panel">
                    <div className={`department-relations-instructions${selectedSource ? " is-selecting" : ""}${selectedRelation ? " is-relation" : ""}`}>
                        <MapIcon fontSize="small" />
                        {instructions()}
                    </div>
                    {feedback ? (
                        <div className={`department-relations-feedback is-${feedback.severity}`} role="status">
                            {feedback.message}
                        </div>
                    ) : null}
                    {mappedDepartments.length ? (
                        <div className="department-relations-leaflet-map" ref={mapElementRef} />
                    ) : (
                        <div className="department-relations-map-empty">
                            <WarningAmberOutlined />
                            <strong>{translations.mapEmpty}</strong>
                            <span>{translations.mapEmptyDescription}</span>
                        </div>
                    )}
                    <div className="department-relations-legend">
                        <span><i className="department-relations-legend-marker is-department" />{translations.legendDepartment}</span>
                        <span><i className="department-relations-legend-marker is-sorting" />{translations.legendSortingFacility}</span>
                        <span><i className="department-relations-legend-marker is-missing" />{translations.legendMissing}</span>
                        <span><i className="department-relations-legend-marker is-active" />{translations.legendActive}</span>
                    </div>
                </div>

                <aside className="department-relations-editor">
                    <div className="department-relations-automatic">
                        <span className="department-relations-editor-kicker">{translations.automaticKicker}</span>
                        <strong>{translations.automaticTitle}</strong>
                        <p>{translations.automaticDescription}</p>
                        <Button
                            disabled={!automaticAssignmentCount}
                            startIcon={<Hub />}
                            variant="outlined"
                            onClick={() => onRelationsChange(relationsWithAutomaticAssignments)}
                        >
                            {translations.automaticAction.replace(
                                "{count}",
                                String(automaticAssignmentCount),
                            )}
                        </Button>
                    </div>
                    <form
                        className="department-relations-form"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submitFormRelation();
                        }}
                    >
                        <span className="department-relations-editor-kicker">{translations.formKicker}</span>
                        <DepartmentPicker
                            departments={relationCandidates}
                            label={translations.source}
                            value={formSourceId}
                            onChange={(selectedDepartmentId) => {
                                setFormSourceId(selectedDepartmentId);
                                setFormTargetId("");
                            }}
                        />
                        <DepartmentPicker
                            departments={relationCandidates}
                            disabled={!formSourceId}
                            disabledDepartmentIds={formTargetDisabledIds}
                            label={translations.target}
                            value={formTargetId}
                            onChange={setFormTargetId}
                        />
                        <Button
                            disabled={!formRelationCanBeAdded}
                            startIcon={<Add />}
                            type="submit"
                            variant="contained"
                        >
                            {translations.addRelation}
                        </Button>
                    </form>

                    <div className="department-relations-list">
                        <div className="department-relations-list-heading">
                            <strong>{translations.currentRelations}</strong>
                            <span>{uniqueRelations.length}</span>
                        </div>
                        <TextField
                            aria-label={translations.filterRelations}
                            autoComplete="off"
                            placeholder={translations.filterRelations}
                            size="small"
                            value={relationFilter}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setRelationFilter(event.target.value)}
                        />
                        {filteredRelations.length ? filteredRelations.map((relation) => {
                            const oneWay = isOneWayRelation(relation);
                            const label = relationLabel(codeOf(relation.sourceDepartmentId),
                                codeOf(relation.targetDepartmentId), oneWay);
                            const relationKey = departmentRelationPairKey(relation);
                            return (
                                <div
                                    className={`department-relations-list-item${selectedRelationKey === relationKey ? " is-selected" : ""}`}
                                    key={relationKey}
                                >
                                    <button
                                        className="department-relations-list-focus"
                                        title={translations.showOnMap}
                                        type="button"
                                        onClick={() => focusRelation(relation)}
                                    >
                                        <strong>{codeOf(relation.sourceDepartmentId)}</strong>
                                        <i aria-hidden="true">{oneWay ? "→" : "↔"}</i>
                                        <strong>{codeOf(relation.targetDepartmentId)}</strong>
                                    </button>
                                    <button
                                        aria-label={translations.changeDirectionOf.replace("{relation}", label)}
                                        className="department-relations-list-direction"
                                        title={oneWay ? translations.oneWay : translations.bidirectional}
                                        type="button"
                                        onClick={() => changeRelationDirection(relation)}
                                    >
                                        ⇆
                                    </button>
                                    <button
                                        aria-label={translations.removeRelation.replace("{relation}", label)}
                                        className="department-relations-list-remove"
                                        type="button"
                                        onClick={() => removeRelation(relation)}
                                    >
                                        <Close fontSize="small" />
                                    </button>
                                </div>
                            );
                        }) : (
                            <div className="department-relations-list-empty">
                                {uniqueRelations.length ? translations.noMatchingRelations : translations.emptyRelations}
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </section>
    );
};

export default DepartmentRelationsMap;
