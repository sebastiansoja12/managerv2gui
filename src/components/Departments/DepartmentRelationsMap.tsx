import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import {Alert, Button, MenuItem, TextField} from "components/ui";
import {AccountTree, Add, Close, Map as MapIcon, WarningAmberOutlined} from "components/ui/icons";
import Department from "../../class/depots/Department";
import pl from "../../i18n/translate";
import {DepartmentRelation, departmentRelationPairKey} from "./model/DepartmentRelation";
import "./styles/department-relations-map.css";

type DepartmentRelationsMapProps = {
    departments: Department[];
    relations: DepartmentRelation[];
    onRelationsChange: (relations: DepartmentRelation[]) => void;
};

type MappedDepartment = {
    department: Department;
    position: [number, number];
};

const DEFAULT_CENTER: L.LatLngExpression = [52.0693, 19.4803];
const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const DEFAULT_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const SORTING_FACILITY = "SORTING_FACILITY";

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

const relationArrowAngle = (source: [number, number], target: [number, number]) => {
    const averageLatitude = (source[0] + target[0]) / 2 * Math.PI / 180;
    const horizontal = (target[1] - source[1]) * Math.cos(averageLatitude);
    const vertical = -(target[0] - source[0]);
    return Math.atan2(vertical, horizontal) * 180 / Math.PI;
};

const relationArrowPosition = (source: [number, number], target: [number, number]): [number, number] => ([
    source[0] + (target[0] - source[0]) * 0.5,
    source[1] + (target[1] - source[1]) * 0.5,
]);

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

const popupContent = (department: Department) => {
    const popup = document.createElement("div");
    popup.className = "department-relations-popup";

    const code = document.createElement("strong");
    code.textContent = departmentCode(department);
    popup.appendChild(code);

    const city = document.createElement("span");
    city.textContent = department.address?.city || pl.common.dash;
    popup.appendChild(city);

    const type = document.createElement("span");
    type.textContent = pl.departments.type[department.departmentType as keyof typeof pl.departments.type]
        || department.departmentType
        || pl.common.dash;
    popup.appendChild(type);

    return popup;
};

const DepartmentRelationsMap: React.FC<DepartmentRelationsMapProps> = ({
    departments,
    relations,
    onRelationsChange,
}) => {
    const mapElementRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const contentLayerRef = useRef<L.LayerGroup | null>(null);
    const [sourceDepartmentId, setSourceDepartmentId] = useState<string | null>(null);
    const [formSourceId, setFormSourceId] = useState<string>("");
    const [formTargetId, setFormTargetId] = useState<string>("");
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
    const mappedDepartments = useMemo(() => relationCandidates.reduce<MappedDepartment[]>((result, department) => {
        const position = departmentPosition(department);
        if (position) {
            result.push({department, position});
        }
        return result;
    }, []), [relationCandidates]);
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
    const missingDepartmentIds = useMemo(
        () => new Set(missingDepartments.map(departmentId)),
        [missingDepartments],
    );
    const sortingFacilities = useMemo(
        () => relationCandidates.filter((department) => department.departmentType === SORTING_FACILITY),
        [relationCandidates],
    );
    const hasMappedDepartments = mappedDepartments.length > 0;
    const unmappedCount = relationCandidates.length - mappedDepartments.length;

    const addRelation = useCallback((sourceId: string, targetId: string) => {
        if (sourceId === targetId
            || !departmentsById.has(sourceId)
            || !departmentsById.has(targetId)) {
            return;
        }

        const relation = {sourceDepartmentId: sourceId, targetDepartmentId: targetId};
        const currentRelationKeys = new Set(relations.map(departmentRelationPairKey));
        if (currentRelationKeys.has(departmentRelationPairKey(relation))) {
            return;
        }

        onRelationsChange([...relations, relation]);
    }, [departmentsById, onRelationsChange, relations]);

    const selectMapDepartment = useCallback((selectedDepartmentId: string) => {
        if (sourceDepartmentId === null) {
            setSourceDepartmentId(selectedDepartmentId);
            return;
        }

        if (sourceDepartmentId !== selectedDepartmentId) {
            addRelation(sourceDepartmentId, selectedDepartmentId);
        }
        setSourceDepartmentId(null);
    }, [addRelation, sourceDepartmentId]);

    const removeRelation = (relation: DepartmentRelation) => {
        onRelationsChange(relations.filter((currentRelation) => !(
            (currentRelation.sourceDepartmentId === relation.sourceDepartmentId
                && currentRelation.targetDepartmentId === relation.targetDepartmentId)
            || (currentRelation.sourceDepartmentId === relation.targetDepartmentId
                && currentRelation.targetDepartmentId === relation.sourceDepartmentId)
        )));
    };

    const submitFormRelation = () => {
        if (!formSourceId || !formTargetId) {
            return;
        }

        addRelation(formSourceId, formTargetId);
        setFormSourceId("");
        setFormTargetId("");
    };

    useEffect(() => {
        if (!hasMappedDepartments || !mapElementRef.current) {
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
    }, [hasMappedDepartments, tileAttribution, tileUrl]);

    useEffect(() => {
        const map = mapRef.current;
        const contentLayer = contentLayerRef.current;
        if (!map || !contentLayer || !mappedDepartments.length) {
            return;
        }

        contentLayer.clearLayers();

        uniqueRelations.forEach((relation) => {
            const source = mappedDepartmentsById.get(relation.sourceDepartmentId);
            const target = mappedDepartmentsById.get(relation.targetDepartmentId);
            if (!source || !target) {
                return;
            }

            const lineColor = "#2563a9";
            const relationLabel = `${departmentCode(source.department)} ↔ ${departmentCode(target.department)}`;
            L.polyline([source.position, target.position], {
                className: "department-relations-line",
                color: lineColor,
                opacity: 0.8,
                weight: 4,
            })
                .bindTooltip(relationLabel)
                .addTo(contentLayer);

            const angle = relationArrowAngle(source.position, target.position);
            L.marker(relationArrowPosition(source.position, target.position), {
                interactive: false,
                keyboard: false,
                icon: L.divIcon({
                    className: "department-relations-arrow-icon",
                    html: `<span class="department-relations-arrow" style="transform: rotate(${angle}deg)"></span>`,
                    iconAnchor: [14, 8],
                    iconSize: [28, 16],
                }),
            }).addTo(contentLayer);
        });

        mappedDepartments.forEach(({department, position}) => {
            const sortingFacility = department.departmentType === SORTING_FACILITY;
            const currentDepartmentId = departmentId(department);
            const selectedSource = sourceDepartmentId === currentDepartmentId;
            const missingSortingRelation = missingDepartmentIds.has(currentDepartmentId);
            const marker = L.circleMarker(position, {
                className: "department-relations-marker",
                color: selectedSource ? "#f59e0b" : missingSortingRelation ? "#dc2626" : "#ffffff",
                fillColor: sortingFacility ? "#0f766e" : "#2563a9",
                fillOpacity: 1,
                radius: sortingFacility ? 13 : 11,
                weight: selectedSource || missingSortingRelation ? 4 : 3,
            });

            marker
                .bindTooltip(departmentCode(department), {
                    className: "department-relations-marker-label",
                    direction: "top",
                    offset: [0, -10],
                    opacity: 1,
                    permanent: true,
                })
                .bindPopup(popupContent(department))
                .on("click", () => selectMapDepartment(currentDepartmentId))
                .addTo(contentLayer);
        });

        map.invalidateSize({pan: false});
        const positions = mappedDepartments.map((item) => item.position);
        if (positions.length === 1) {
            map.setView(positions[0], 12, {animate: false});
        } else {
            map.fitBounds(L.latLngBounds(positions), {
                animate: false,
                maxZoom: 12,
                padding: [44, 44],
            });
        }
    }, [mappedDepartments, mappedDepartmentsById, missingDepartmentIds, selectMapDepartment, sourceDepartmentId, uniqueRelations]);

    const selectedSource = sourceDepartmentId === null ? null : departmentsById.get(sourceDepartmentId);
    const formRelationCanBeAdded = Boolean(formSourceId && formTargetId && formSourceId !== formTargetId);

    return (
        <section className="department-relations" aria-label={pl.departments.relations.title}>
            <header className="department-relations-header">
                <div>
                    <span className="department-relations-kicker"><AccountTree fontSize="small" /> {pl.departments.relations.kicker}</span>
                    <h2>{pl.departments.relations.title}</h2>
                    <p>{pl.departments.relations.subtitle}</p>
                </div>
                <div className="department-relations-summary">
                    <div><span>{pl.departments.relations.points}</span><strong>{mappedDepartments.length}</strong></div>
                    <div><span>{pl.departments.relations.relationCount}</span><strong>{uniqueRelations.length}</strong></div>
                    <div className={missingDepartments.length ? "is-invalid" : "is-valid"}>
                        <span>{pl.departments.relations.missingCount}</span><strong>{missingDepartments.length}</strong>
                    </div>
                </div>
            </header>

            {!sortingFacilities.length ? (
                <Alert severity="error">{pl.departments.relations.noSortingFacility}</Alert>
            ) : missingDepartments.length ? (
                <Alert severity="warning">
                    {pl.departments.relations.validationError.replace(
                        "{codes}",
                        missingDepartments.map(departmentCode).join(", "),
                    )}
                </Alert>
            ) : relationCandidates.length ? (
                <Alert severity="success">{pl.departments.relations.validationSuccess}</Alert>
            ) : undefined}

            {unmappedCount > 0 ? (
                <Alert severity="warning">
                    {pl.departments.relations.missingCoordinates.replace("{count}", String(unmappedCount))}
                </Alert>
            ) : undefined}

            <div className="department-relations-workspace">
                <div className="department-relations-map-panel">
                    <div className="department-relations-instructions">
                        <MapIcon fontSize="small" />
                        <span>{selectedSource
                            ? pl.departments.relations.selectTarget.replace("{code}", departmentCode(selectedSource))
                            : pl.departments.relations.selectSource}</span>
                        {selectedSource ? (
                            <Button variant="text" startIcon={<Close fontSize="small" />} onClick={() => setSourceDepartmentId(null)}>
                                {pl.common.cancel}
                            </Button>
                        ) : undefined}
                    </div>
                    {mappedDepartments.length ? (
                        <div className="department-relations-leaflet-map" ref={mapElementRef} />
                    ) : (
                        <div className="department-relations-map-empty">
                            <WarningAmberOutlined />
                            <strong>{pl.departments.relations.mapEmpty}</strong>
                            <span>{pl.departments.relations.mapEmptyDescription}</span>
                        </div>
                    )}
                    <div className="department-relations-legend">
                        <span><i className="department-relations-legend-marker is-department" />{pl.departments.relations.legendDepartment}</span>
                        <span><i className="department-relations-legend-marker is-sorting" />{pl.departments.relations.legendSortingFacility}</span>
                        <span><i className="department-relations-legend-marker is-missing" />{pl.departments.relations.legendMissing}</span>
                    </div>
                </div>

                <aside className="department-relations-editor">
                    <div>
                        <span className="department-relations-editor-kicker">{pl.departments.relations.formKicker}</span>
                        <h3>{pl.departments.relations.formTitle}</h3>
                        <p>{pl.departments.relations.formDescription}</p>
                    </div>
                    <TextField
                        select
                        label={pl.departments.relations.source}
                        value={formSourceId}
                        onChange={(event) => setFormSourceId(event.target.value)}
                    >
                        <MenuItem value="">{pl.departments.relations.chooseDepartment}</MenuItem>
                        {relationCandidates.map((department) => (
                            <MenuItem key={departmentId(department)} value={departmentId(department)}>
                                {departmentCode(department)} · {department.address?.city || pl.common.dash}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select
                        label={pl.departments.relations.target}
                        value={formTargetId}
                        onChange={(event) => setFormTargetId(event.target.value)}
                    >
                        <MenuItem value="">{pl.departments.relations.chooseDepartment}</MenuItem>
                        {relationCandidates.map((department) => (
                            <MenuItem
                                disabled={departmentId(department) === formSourceId}
                                key={departmentId(department)}
                                value={departmentId(department)}
                            >
                                {departmentCode(department)} · {department.address?.city || pl.common.dash}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Button
                        disabled={!formRelationCanBeAdded}
                        startIcon={<Add />}
                        variant="contained"
                        onClick={submitFormRelation}
                    >
                        {pl.departments.relations.addRelation}
                    </Button>

                    <div className="department-relations-list">
                        <div className="department-relations-list-heading">
                            <strong>{pl.departments.relations.currentRelations}</strong>
                            <span>{uniqueRelations.length}</span>
                        </div>
                        {uniqueRelations.length ? uniqueRelations.map((relation) => {
                            const source = departmentsById.get(relation.sourceDepartmentId);
                            const target = departmentsById.get(relation.targetDepartmentId);
                            return (
                                <div className="department-relations-list-item" key={departmentRelationPairKey(relation)}>
                                    <span>
                                        <strong>{source ? departmentCode(source) : relation.sourceDepartmentId}</strong>
                                        <i aria-hidden="true">↔</i>
                                        <strong>{target ? departmentCode(target) : relation.targetDepartmentId}</strong>
                                    </span>
                                    <button
                                        aria-label={pl.departments.relations.removeRelation.replace(
                                            "{relation}",
                                            `${source ? departmentCode(source) : relation.sourceDepartmentId} ↔ ${target ? departmentCode(target) : relation.targetDepartmentId}`,
                                        )}
                                        type="button"
                                        onClick={() => removeRelation(relation)}
                                    >
                                        <Close fontSize="small" />
                                    </button>
                                </div>
                            );
                        }) : (
                            <div className="department-relations-list-empty">{pl.departments.relations.emptyRelations}</div>
                        )}
                    </div>
                </aside>
            </div>
        </section>
    );
};

export default DepartmentRelationsMap;
