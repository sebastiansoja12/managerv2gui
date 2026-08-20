import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
    Alert,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    MenuItem,
    TextField,
    Typography,
} from "components/ui";
import {
    Add,
    AutoModeOutlined,
    DeleteOutline,
    Edit,
    GridView,
    Inventory2,
    Map as MapIcon,
    Refresh,
    Save,
    Search,
    TableRows,
    Undo,
    Warehouse,
} from "components/ui/icons";
import DepartmentMapService from "../../hooks/DepartmentMapService";
import pl from "../../i18n/translate";
import {departmentMapErrorCode, departmentMapErrorMessage, isStaleStateRejection} from "./departmentMapLabels";
import MapCanvas, {MapMode, MapTool} from "./MapCanvas";
import {generateLayout, randomSeed} from "./layoutGenerator";
import MapElementPanel from "./MapElementPanel";
import {
    duplicateElement,
    generateRackSlots,
    LOCATION_STATUS_COLOR,
    normalizeRotation,
    snap,
    validateLayout,
} from "./mapGeometry";
import {
    DepartmentIdValue,
    DepartmentMapDto,
    DepartmentMapLayout,
    DepartmentMapSummaryDto,
    LocationStatus,
    MAP_ELEMENT_TYPES,
    MapElementDto,
    PalletLocationDto,
    StorageLocationDto,
} from "./model/DepartmentMap";
import StorageLocationPanel from "./StorageLocationPanel";
import "./styles/department-map.css";

type DepartmentMapWorkspaceProps = {
    departmentId: DepartmentIdValue;
    departmentCode: string;
};

type CreateMapForm = {
    name: string;
    width: string;
    height: string;
    gridSize: string;
    autoLayout: boolean;
    includeSorter: boolean;
    slotCapacity: string;
};

type GeneratorForm = {
    width: string;
    height: string;
    includeSorter: boolean;
    slotCapacity: string;
};

const UNDO_LIMIT = 50;
const LOCATION_STATUSES: LocationStatus[] = ["FREE", "PARTIALLY_OCCUPIED", "OCCUPIED", "RESERVED"];

const layoutFromMap = (map: DepartmentMapDto): DepartmentMapLayout => ({
    name: map.name,
    width: map.width,
    height: map.height,
    gridSize: map.gridSize,
    elements: map.elements.map((element) => ({...element})),
});

const layoutKey = (layout: DepartmentMapLayout | null) => layout ? JSON.stringify(layout) : "";

const emptyCreateForm = (departmentCode: string): CreateMapForm => ({
    name: pl.departmentMap.create.defaultName.replace("{code}", departmentCode),
    width: "60",
    height: "40",
    gridSize: "1",
    autoLayout: true,
    includeSorter: true,
    slotCapacity: "1",
});

const generatorLabels = () => ({
    hall: pl.departmentMap.generator.labels.hall,
    inbound: pl.departmentMap.generator.labels.inbound,
    outbound: pl.departmentMap.generator.labels.outbound,
    sorter: pl.departmentMap.generator.labels.sorter,
    chute: pl.departmentMap.generator.labels.chute,
    mainAisle: pl.departmentMap.generator.labels.mainAisle,
    aisle: pl.departmentMap.generator.labels.aisle,
});

const parseCapacity = (value: string) => {
    const capacity = Number(value);
    return Number.isInteger(capacity) && capacity >= 1 && capacity <= 99 ? capacity : null;
};

type MapDimensionFieldProps = {
    label: string;
    value: number;
    onCommit: (value: number) => void;
};

function MapDimensionField({label, value, onCommit}: MapDimensionFieldProps) {
    const [draft, setDraft] = useState(String(value));

    useEffect(() => {
        setDraft((current) => Number(current.replace(",", ".")) === value ? current : String(value));
    }, [value]);

    return (
        <TextField label={label} size="small" type="number" value={draft}
                   onChange={(event) => {
                       const nextDraft = event.target.value;
                       const parsed = Number(nextDraft.replace(",", "."));
                       setDraft(nextDraft);
                       if (nextDraft.trim() && Number.isFinite(parsed) && parsed >= 1 && parsed <= 5000) {
                           onCommit(parsed);
                       }
                   }} />
    );
}

function DepartmentMapWorkspace({departmentId, departmentCode}: DepartmentMapWorkspaceProps) {
    const translations = pl.departmentMap;
    const [summaries, setSummaries] = useState<DepartmentMapSummaryDto[]>([]);
    const [summariesLoading, setSummariesLoading] = useState(true);
    const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
    const [map, setMap] = useState<DepartmentMapDto | null>(null);
    const [mapLoading, setMapLoading] = useState(false);
    const [layout, setLayout] = useState<DepartmentMapLayout | null>(null);
    const [undoStack, setUndoStack] = useState<MapElementDto[][]>([]);
    const [mode, setMode] = useState<MapMode>("operate");
    const [tool, setTool] = useState<MapTool>("SELECT");
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [showGrid, setShowGrid] = useState(true);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [highlightedLocationId, setHighlightedLocationId] = useState<string | null>(null);
    const [focusRequest, setFocusRequest] = useState<{elementId: string; nonce: number} | null>(null);
    const [pendingFocusLocationId, setPendingFocusLocationId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [conflict, setConflict] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [validationProblems, setValidationProblems] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState<CreateMapForm>(emptyCreateForm(departmentCode));
    const [createError, setCreateError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [generatorOpen, setGeneratorOpen] = useState(false);
    const [generatorForm, setGeneratorForm] = useState<GeneratorForm>({width: "60", height: "40", includeSorter: true,
        slotCapacity: "1"});
    const [generatorError, setGeneratorError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<PalletLocationDto[] | null>(null);
    const [searching, setSearching] = useState(false);
    const [movingPallet, setMovingPallet] = useState<string | null>(null);
    const [locationFilter, setLocationFilter] = useState("");
    const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
    const layoutRef = useRef<DepartmentMapLayout | null>(null);

    layoutRef.current = layout;

    const savedLayoutKey = useMemo(() => map ? layoutKey(layoutFromMap(map)) : "", [map]);

    const dirty = useMemo(() => Boolean(map && layout && layoutKey(layout) !== savedLayoutKey),
        [layout, map, savedLayoutKey]);

    const locationsById = useMemo(() => {
        const result: Record<string, StorageLocationDto> = {};
        (map?.locations || []).forEach((location) => {
            result[location.locationId] = location;
        });
        return result;
    }, [map]);

    const selectedElement = useMemo(() => layout?.elements.find((element) => element.elementId === selectedElementId) || null,
        [layout, selectedElementId]);

    const selectedLocation = selectedElementId ? locationsById[selectedElementId] : undefined;

    const loadSummaries = useCallback(async (preferredMapId?: string | null) => {
        setSummariesLoading(true);
        try {
            const response = await DepartmentMapService.findMaps(departmentId);
            const items = response.data || [];
            setSummaries(items);
            setSelectedMapId((current) => {
                const wanted = preferredMapId !== undefined ? preferredMapId : current;
                if (wanted && items.some((item) => item.mapId === wanted)) {
                    return wanted;
                }
                return items[0]?.mapId || null;
            });
        } catch (loadError) {
            setError(departmentMapErrorMessage(loadError, translations.page.listError));
        } finally {
            setSummariesLoading(false);
        }
    }, [departmentId, translations.page.listError]);

    const loadMap = useCallback(async (mapId: string, keepLayout = false) => {
        setMapLoading(true);
        try {
            const response = await DepartmentMapService.getMap(mapId);
            setMap(response.data);
            if (!keepLayout) {
                setLayout(layoutFromMap(response.data));
                setUndoStack([]);
                setConflict(false);
            }
            return response.data;
        } catch (loadError) {
            setError(departmentMapErrorMessage(loadError, translations.page.loadError));
            return null;
        } finally {
            setMapLoading(false);
        }
    }, [translations.page.loadError]);

    useEffect(() => {
        loadSummaries();
    }, [loadSummaries]);

    useEffect(() => {
        if (!selectedMapId) {
            setMap(null);
            setLayout(null);
            return;
        }
        setSelectedElementId(null);
        setMovingPallet(null);
        setValidationProblems([]);
        loadMap(selectedMapId).then((loaded) => {
            if (loaded) {
                setMode(loaded.locations.length || loaded.elements.length ? "operate" : "edit");
                setTool("SELECT");
            }
        });
    }, [loadMap, selectedMapId]);

    useEffect(() => {
        if (!pendingFocusLocationId || !map || !map.locations.some((location) => location.locationId === pendingFocusLocationId)) {
            return;
        }
        setMode("operate");
        setSelectedElementId(pendingFocusLocationId);
        setHighlightedLocationId(pendingFocusLocationId);
        setFocusRequest({elementId: pendingFocusLocationId, nonce: Date.now()});
        setPendingFocusLocationId(null);
    }, [map, pendingFocusLocationId]);

    useEffect(() => {
        if (!dirty) {
            return undefined;
        }
        const warn = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);

    const pushUndo = useCallback(() => {
        const current = layoutRef.current;
        if (current) {
            setUndoStack((stack) => stack.concat([current.elements]).slice(-UNDO_LIMIT));
        }
    }, []);

    const setElements = useCallback((elements: MapElementDto[]) => {
        setLayout((current) => current ? {...current, elements} : current);
        setNotice(null);
    }, []);

    const updateElement = (updated: MapElementDto, recordUndo = true) => {
        if (!layout) {
            return;
        }
        if (recordUndo) {
            pushUndo();
        }
        setElements(layout.elements.map((element) => element.elementId === updated.elementId ? updated : element));
    };

    const addElements = (elements: MapElementDto[], selectId?: string) => {
        if (!layout) {
            return;
        }
        pushUndo();
        setElements(layout.elements.concat(elements));
        if (selectId) {
            setSelectedElementId(selectId);
        }
    };

    const deleteElement = (element: MapElementDto) => {
        if (!layout) {
            return;
        }
        if (locationsById[element.elementId]?.pallets.length) {
            setError(translations.errors.LOCATION_NOT_EMPTY);
            return;
        }
        pushUndo();
        setElements(layout.elements.filter((candidate) => candidate.elementId !== element.elementId));
        setSelectedElementId(null);
    };

    const undo = () => {
        const previous = undoStack[undoStack.length - 1];
        if (!previous) {
            return;
        }
        setLayout((current) => current ? {...current, elements: previous} : current);
        setUndoStack(undoStack.slice(0, -1));
        setSelectedElementId((current) => previous.some((element) => element.elementId === current) ? current : null);
    };

    const discardChanges = () => {
        if (map) {
            setLayout(layoutFromMap(map));
            setUndoStack([]);
            setSelectedElementId(null);
            setValidationProblems([]);
            setConflict(false);
            setError(null);
        }
    };

    const saveLayout = async () => {
        if (!map || !layout) {
            return;
        }
        const problems = validateLayout(layout.elements, layout.width, layout.height);
        if (!layout.name.trim()) {
            setValidationProblems([translations.validation.nameRequired]);
            return;
        }
        if (problems.length) {
            setValidationProblems(problems.map((problem) => translations.validation[problem.type]
                .replace("{value}", problem.type === "missingCode" ? "" : problem.value)));
            return;
        }
        setValidationProblems([]);
        setSaving(true);
        setError(null);
        setConflict(false);
        try {
            const response = await DepartmentMapService.saveLayout(map.mapId, {
                ...layout,
                name: layout.name.trim(),
                elements: layout.elements.map((element) => ({
                    ...element,
                    label: element.label && element.label.trim() ? element.label.trim() : null,
                    locationCode: element.type === "STORAGE_LOCATION" ? (element.locationCode || "").trim().toUpperCase() : null,
                    capacity: element.type === "STORAGE_LOCATION" ? element.capacity || 1 : null,
                })),
                version: map.version,
            });
            setMap(response.data);
            setLayout(layoutFromMap(response.data));
            setUndoStack([]);
            setNotice(translations.editor.saved);
            loadSummaries(response.data.mapId);
        } catch (saveError) {
            setConflict(departmentMapErrorCode(saveError) === "MAP_VERSION_CONFLICT");
            setError(departmentMapErrorMessage(saveError, translations.editor.saveError));
        } finally {
            setSaving(false);
        }
    };

    const refreshAfterOperation = async (message: string, focusPallet?: string) => {
        if (!map) {
            return;
        }
        setNotice(message);
        setError(null);
        setMovingPallet(null);
        const loaded = await loadMap(map.mapId, dirty);
        loadSummaries(map.mapId);
        if (loaded && focusPallet) {
            const location = loaded.locations.find((candidate) => candidate.pallets
                .some((placement) => placement.palletTrackingNumber === focusPallet));
            if (location) {
                setSelectedElementId(location.locationId);
                setHighlightedLocationId(location.locationId);
            }
        }
    };

    const reloadAfterRejection = (rejection: unknown) => {
        if (map && isStaleStateRejection(rejection)) {
            setMovingPallet(null);
            loadMap(map.mapId, dirty);
        }
    };

    const activateLocation = async (locationId: string) => {
        const target = locationsById[locationId];
        if (movingPallet && target) {
            const pallet = movingPallet;
            try {
                await DepartmentMapService.movePallet(pallet, locationId);
                await refreshAfterOperation(translations.operations.moved.replace("{pallet}", pallet)
                    .replace("{code}", target.code), pallet);
            } catch (moveError) {
                setError(departmentMapErrorMessage(moveError, translations.operations.moveError));
                reloadAfterRejection(moveError);
            }
            return;
        }
        if (!target) {
            setError(translations.operations.unsavedLocation);
            return;
        }
        setSelectedElementId(locationId);
        setHighlightedLocationId(null);
    };

    const createMap = async () => {
        const width = Number(createForm.width.replace(",", "."));
        const height = Number(createForm.height.replace(",", "."));
        const gridSize = Number(createForm.gridSize.replace(",", "."));
        if (!createForm.name.trim()) {
            setCreateError(translations.validation.nameRequired);
            return;
        }
        if (![width, height].every((value) => Number.isFinite(value) && value >= 1 && value <= 5000)) {
            setCreateError(translations.create.dimensionsInvalid);
            return;
        }
        if (!Number.isFinite(gridSize) || gridSize < 0.1 || gridSize > 50) {
            setCreateError(translations.create.gridInvalid);
            return;
        }
        const slotCapacity = parseCapacity(createForm.slotCapacity);
        if (createForm.autoLayout && slotCapacity === null) {
            setCreateError(translations.generator.capacityInvalid);
            return;
        }
        setCreating(true);
        setCreateError(null);
        try {
            const response = await DepartmentMapService.createMap({
                departmentId,
                name: createForm.name.trim(),
                width,
                height,
                gridSize,
            });
            let message = translations.create.created.replace("{name}", response.data.name);
            if (createForm.autoLayout) {
                const generated = generateLayout({width, height, seed: randomSeed(), includeSorter: createForm.includeSorter,
                    slotCapacity: slotCapacity || 1, labels: generatorLabels()});
                try {
                    await DepartmentMapService.saveLayout(response.data.mapId, {
                        name: response.data.name,
                        width,
                        height,
                        gridSize,
                        version: response.data.version,
                        elements: generated.elements,
                    });
                    message = translations.generator.createdWithLayout.replace("{name}", response.data.name)
                        .replace("{racks}", String(generated.rackCount))
                        .replace("{locations}", String(generated.locationCount));
                } catch (layoutError) {
                    setError(departmentMapErrorMessage(layoutError, translations.generator.layoutSaveError));
                }
            }
            setCreateOpen(false);
            setNotice(message);
            await loadSummaries(response.data.mapId);
        } catch (createMapError) {
            setCreateError(departmentMapErrorMessage(createMapError, translations.create.error));
        } finally {
            setCreating(false);
        }
    };

    const openGenerator = () => {
        if (!layout) {
            return;
        }
        setGeneratorForm((current) => ({...current, width: String(layout.width), height: String(layout.height)}));
        setGeneratorError(null);
        setGeneratorOpen(true);
    };

    const applyGeneratedLayout = () => {
        if (!layout || !map) {
            return;
        }
        const width = Number(generatorForm.width.replace(",", "."));
        const height = Number(generatorForm.height.replace(",", "."));
        const slotCapacity = parseCapacity(generatorForm.slotCapacity);
        if (![width, height].every((value) => Number.isFinite(value) && value >= 1 && value <= 5000)) {
            setGeneratorError(translations.create.dimensionsInvalid);
            return;
        }
        if (slotCapacity === null) {
            setGeneratorError(translations.generator.capacityInvalid);
            return;
        }
        if (map.locations.some((location) => location.pallets.length > 0)) {
            setGeneratorError(translations.generator.occupiedBlocked);
            return;
        }
        const generated = generateLayout({width, height, seed: randomSeed(), includeSorter: generatorForm.includeSorter,
            slotCapacity, labels: generatorLabels()});
        pushUndo();
        setLayout({...layout, width, height, elements: generated.elements});
        setSelectedElementId(null);
        setValidationProblems([]);
        setGeneratorOpen(false);
        setNotice(translations.generator.generated.replace("{racks}", String(generated.rackCount))
            .replace("{locations}", String(generated.locationCount)));
    };

    const deleteMap = async () => {
        if (!map) {
            return;
        }
        setDeleting(true);
        try {
            await DepartmentMapService.deleteMap(map.mapId);
            setDeleteOpen(false);
            setNotice(translations.page.deleted.replace("{name}", map.name));
            await loadSummaries(null);
        } catch (deleteError) {
            setDeleteOpen(false);
            setError(departmentMapErrorMessage(deleteError, translations.page.deleteError));
        } finally {
            setDeleting(false);
        }
    };

    const showResult = (result: PalletLocationDto) => {
        setSearchResults(null);
        if (result.mapId !== selectedMapId) {
            if (dirty) {
                setError(translations.search.unsavedChanges);
                return;
            }
            setPendingFocusLocationId(result.locationId);
            setSelectedMapId(result.mapId);
            return;
        }
        setMode("operate");
        setTool("SELECT");
        setSelectedElementId(result.locationId);
        setHighlightedLocationId(result.locationId);
        setFocusRequest({elementId: result.locationId, nonce: Date.now()});
    };

    const searchPallets = async () => {
        const query = searchQuery.trim();
        if (query.length < 2) {
            setError(translations.search.tooShort);
            return;
        }
        setSearching(true);
        setError(null);
        try {
            const results = (await DepartmentMapService.searchPallets(query)).data || [];
            const exact = results.find((result) => result.palletTrackingNumber === query.toUpperCase());
            if (exact && results.length === 1) {
                showResult(exact);
            } else {
                setSearchResults(results);
            }
        } catch (searchError) {
            setError(departmentMapErrorMessage(searchError, translations.search.error));
        } finally {
            setSearching(false);
        }
    };

    const switchMode = (nextMode: MapMode) => {
        if (nextMode === mode) {
            return;
        }
        if (dirty && nextMode === "operate") {
            setError(translations.editor.unsavedBeforeSwitch);
            return;
        }
        setMode(nextMode);
        setTool("SELECT");
        setSelectedElementId(null);
        setMovingPallet(null);
        setHighlightedLocationId(null);
        setError(null);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement;
        if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
            return;
        }
        if (event.key === "Escape") {
            setSelectedElementId(null);
            setTool("SELECT");
            setMovingPallet(null);
            return;
        }
        if (mode !== "edit" || !layout) {
            return;
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
            event.preventDefault();
            undo();
            return;
        }
        if (!selectedElement) {
            return;
        }
        if (event.key === "Delete" || event.key === "Backspace") {
            event.preventDefault();
            deleteElement(selectedElement);
        } else if (event.key.toLowerCase() === "r") {
            updateElement({...selectedElement, rotation: normalizeRotation(selectedElement.rotation + (event.shiftKey ? -90 : 90))});
        } else if (event.key.startsWith("Arrow")) {
            event.preventDefault();
            const step = (event.shiftKey ? 10 : 1) * (snapToGrid ? layout.gridSize : 0.1);
            const deltaX = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
            const deltaY = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
            updateElement({...selectedElement, x: snap(selectedElement.x + deltaX, 0.001, false),
                y: snap(selectedElement.y + deltaY, 0.001, false)});
        }
    };

    const filteredLocations = useMemo(() => {
        const normalized = locationFilter.trim().toUpperCase();
        return (map?.locations || [])
            .filter((location) => !normalized || location.code.includes(normalized)
                || location.pallets.some((placement) => placement.palletTrackingNumber.includes(normalized)))
            .slice()
            .sort((left, right) => left.code.localeCompare(right.code));
    }, [locationFilter, map]);

    const statusCounts = useMemo(() => LOCATION_STATUSES.reduce<Record<LocationStatus, number>>((result, status) => ({
        ...result,
        [status]: (map?.locations || []).filter((location) => location.status === status).length,
    }), {FREE: 0, PARTIALLY_OCCUPIED: 0, OCCUPIED: 0, RESERVED: 0}), [map]);

    const renderSidePanel = () => {
        if (!layout || !map) {
            return null;
        }
        if (mode === "edit") {
            return (
                <>
                    <MapElementPanel
                        element={selectedElement}
                        elementCount={layout.elements.length}
                        location={selectedElement ? locationsById[selectedElement.elementId] : undefined}
                        onChange={(element) => updateElement(element)}
                        onDelete={deleteElement}
                        onDuplicate={(element) => {
                            const copy = duplicateElement(element, layout.elements, layout.gridSize);
                            addElements([copy], copy.elementId);
                        }}
                        onGenerateSlots={(rack, count, prefix, capacity) => {
                            const slots = generateRackSlots(rack, count, prefix, capacity, layout.elements);
                            addElements(slots, slots[0]?.elementId);
                            setNotice(translations.editor.slots.generated.replace("{count}", String(slots.length)));
                        }}
                    />
                    {!selectedElement ? (
                        <section className="department-map-panel-section">
                            <Typography variant="h6">{translations.editor.mapSettings}</Typography>
                            <div className="department-map-form-grid">
                                <TextField label={translations.create.fields.name} required size="small" value={layout.name}
                                           onChange={(event) => setLayout({...layout, name: event.target.value})} />
                                <MapDimensionField label={translations.create.fields.width} value={layout.width}
                                                   onCommit={(width) => setLayout({...layout, width})} />
                                <MapDimensionField label={translations.create.fields.height} value={layout.height}
                                                   onCommit={(height) => setLayout({...layout, height})} />
                                <TextField label={translations.create.fields.gridSize} select size="small"
                                           value={String(layout.gridSize)}
                                           onChange={(event) => setLayout({...layout, gridSize: Number(event.target.value)})}>
                                    {["0.25", "0.5", "1", "2", "5"].concat(
                                        ["0.25", "0.5", "1", "2", "5"].includes(String(layout.gridSize)) ? [] : [String(layout.gridSize)],
                                    ).map((value) => <MenuItem key={value} value={value}>{`${value} m`}</MenuItem>)}
                                </TextField>
                            </div>
                        </section>
                    ) : null}
                </>
            );
        }
        if (selectedLocation) {
            return (
                <StorageLocationPanel
                    location={selectedLocation}
                    locations={map.locations}
                    movingPallet={movingPallet}
                    onCancelPick={() => setMovingPallet(null)}
                    onChanged={refreshAfterOperation}
                    onRejected={reloadAfterRejection}
                    onClose={() => {
                        setSelectedElementId(null);
                        setMovingPallet(null);
                    }}
                    onStartPick={(pallet) => {
                        setMovingPallet(pallet);
                        setNotice(null);
                    }}
                />
            );
        }
        return (
            <div className="department-map-location-list">
                <Typography variant="h6">{translations.operations.locationsTitle}</Typography>
                <p className="department-map-hint">{translations.operations.locationsDescription}</p>
                <TextField label={translations.operations.filterLocations} size="small" value={locationFilter}
                           onChange={(event) => setLocationFilter(event.target.value)} />
                {filteredLocations.length ? (
                    <ul>
                        {filteredLocations.map((location) => (
                            <li key={location.locationId}>
                                <button type="button" onClick={() => {
                                    setSelectedElementId(location.locationId);
                                    setFocusRequest({elementId: location.locationId, nonce: Date.now()});
                                }}>
                                    <span className="department-map-status-dot"
                                          style={{backgroundColor: LOCATION_STATUS_COLOR[location.status]}} />
                                    <strong>{location.code}</strong>
                                    <span>{`${location.pallets.length}/${location.capacity}`}</span>
                                    <span className="department-map-hint">{translations.status[location.status]}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="department-map-hint">
                        {map.locations.length ? translations.operations.noFilteredLocations : translations.operations.noLocations}
                    </p>
                )}
            </div>
        );
    };

    return (
        <section className="department-map-workspace" aria-label={translations.page.title}>
            <header className="department-map-header">
                <div className="department-map-title">
                    <span className="department-map-title-icon"><MapIcon /></span>
                    <div>
                        <Typography variant="h5">{translations.page.title}</Typography>
                        <p>{translations.page.subtitle}</p>
                    </div>
                </div>
                <div className="department-map-map-picker">
                    <TextField
                        select
                        disabled={summariesLoading || !summaries.length}
                        label={translations.page.selectMap}
                        size="small"
                        value={selectedMapId || ""}
                        onChange={(event) => {
                            if (dirty) {
                                setError(translations.editor.unsavedBeforeSwitch);
                                return;
                            }
                            setSelectedMapId(event.target.value || null);
                        }}
                    >
                        {!summaries.length ? <MenuItem value="">{translations.page.noMaps}</MenuItem> : null}
                        {summaries.map((summary) => (
                            <MenuItem key={summary.mapId} value={summary.mapId}>
                                {`${summary.name} · ${summary.palletCount} ${translations.page.palletsShort}`}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Button startIcon={<Add />} variant="contained" onClick={() => {
                        setCreateForm(emptyCreateForm(departmentCode));
                        setCreateError(null);
                        setCreateOpen(true);
                    }}>
                        {translations.create.open}
                    </Button>
                    <IconButton aria-label={pl.common.refresh} disabled={summariesLoading || mapLoading}
                                title={pl.common.refresh} onClick={() => {
                        if (dirty) {
                            setError(translations.editor.unsavedBeforeSwitch);
                            return;
                        }
                        loadSummaries();
                        if (selectedMapId) {
                            loadMap(selectedMapId);
                        }
                    }}>
                        <Refresh fontSize="small" />
                    </IconButton>
                    <IconButton aria-label={translations.page.delete} color="error" disabled={!map || deleting}
                                title={translations.page.delete} onClick={() => setDeleteOpen(true)}>
                        <DeleteOutline fontSize="small" />
                    </IconButton>
                </div>
            </header>

            {notice ? <Alert severity="success" onClose={() => setNotice(null)}>{notice}</Alert> : null}
            {error ? (
                <Alert severity="error" onClose={() => setError(null)} action={conflict && map ? (
                    <Button variant="outlined" onClick={() => {
                        setError(null);
                        loadMap(map.mapId);
                    }}>{translations.editor.reload}</Button>
                ) : undefined}>{error}</Alert>
            ) : null}
            {validationProblems.length ? (
                <Alert severity="warning">
                    <strong>{translations.validation.title}</strong>
                    <ul className="department-map-problems">
                        {validationProblems.map((problem) => <li key={problem}>{problem}</li>)}
                    </ul>
                </Alert>
            ) : null}

            {summariesLoading && !summaries.length ? (
                <div className="department-map-loader"><CircularProgress size={24} /> {translations.page.loading}</div>
            ) : null}

            {!summariesLoading && !summaries.length ? (
                <div className="department-map-empty">
                    <Warehouse fontSize="large" />
                    <Typography variant="h6">{translations.page.emptyTitle}</Typography>
                    <p>{translations.page.emptyDescription}</p>
                    <Button startIcon={<Add />} variant="contained" onClick={() => {
                        setCreateForm(emptyCreateForm(departmentCode));
                        setCreateError(null);
                        setCreateOpen(true);
                    }}>{translations.create.open}</Button>
                </div>
            ) : null}

            {map && layout ? (
                <>
                    <div className="department-map-toolbar" role="toolbar" aria-label={translations.toolbar.label}>
                        <div className="department-map-mode-switch" role="group" aria-label={translations.toolbar.mode}>
                            <button aria-pressed={mode === "operate"} className={mode === "operate" ? "active" : ""}
                                    type="button" onClick={() => switchMode("operate")}>
                                <Inventory2 fontSize="small" /> {translations.toolbar.operate}
                            </button>
                            <button aria-pressed={mode === "edit"} className={mode === "edit" ? "active" : ""}
                                    type="button" onClick={() => switchMode("edit")}>
                                <Edit fontSize="small" /> {translations.toolbar.edit}
                            </button>
                        </div>

                        {mode === "edit" ? (
                            <>
                                <div className="department-map-tools" role="group" aria-label={translations.toolbar.tools}>
                                    <button aria-pressed={tool === "SELECT"} className={tool === "SELECT" ? "active" : ""}
                                            type="button" onClick={() => setTool("SELECT")}>
                                        {translations.toolbar.select}
                                    </button>
                                    {MAP_ELEMENT_TYPES.map((type) => (
                                        <button aria-pressed={tool === type} className={tool === type ? "active" : ""} key={type}
                                                title={translations.toolbar.drawHint} type="button" onClick={() => setTool(type)}>
                                            {translations.elementTypes[type]}
                                        </button>
                                    ))}
                                </div>
                                <label className="department-map-toggle">
                                    <input checked={snapToGrid} type="checkbox" onChange={(event) => setSnapToGrid(event.target.checked)} />
                                    {translations.toolbar.snap}
                                </label>
                                <label className="department-map-toggle">
                                    <input checked={showGrid} type="checkbox" onChange={(event) => setShowGrid(event.target.checked)} />
                                    <GridView fontSize="small" /> {translations.toolbar.grid}
                                </label>
                                <div className="department-map-toolbar-actions">
                                    <Button startIcon={<AutoModeOutlined />} variant="outlined" onClick={openGenerator}>
                                        {translations.generator.open}
                                    </Button>
                                    <IconButton aria-label={translations.toolbar.undo} disabled={!undoStack.length}
                                                title={translations.toolbar.undo} onClick={undo}>
                                        <Undo fontSize="small" />
                                    </IconButton>
                                    <Button disabled={!dirty || saving} variant="outlined" onClick={discardChanges}>
                                        {translations.toolbar.discard}
                                    </Button>
                                    <Button disabled={!dirty || saving} startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                                            variant="contained" onClick={saveLayout}>
                                        {saving ? translations.toolbar.saving : translations.toolbar.save}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <form className="department-map-search" role="search" onSubmit={(event) => {
                                    event.preventDefault();
                                    searchPallets();
                                }}>
                                    <TextField label={translations.search.label} size="small" value={searchQuery}
                                               onChange={(event) => setSearchQuery(event.target.value)} />
                                    <Button disabled={searching} startIcon={searching ? <CircularProgress size={16} /> : <Search />}
                                            type="submit" variant="outlined">
                                        {translations.search.submit}
                                    </Button>
                                </form>
                                <div className="department-map-legend" aria-label={translations.legend.label}>
                                    {LOCATION_STATUSES.map((status) => (
                                        <span key={status}>
                                            <span className="department-map-status-dot" style={{backgroundColor: LOCATION_STATUS_COLOR[status]}} />
                                            {`${translations.status[status]} (${statusCounts[status]})`}
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {searchResults ? (
                        <div className="department-map-search-results" role="region" aria-label={translations.search.results}>
                            <div className="department-map-panel-header">
                                <strong>{translations.search.resultsCount.replace("{count}", String(searchResults.length))}</strong>
                                <Button variant="text" onClick={() => setSearchResults(null)}>{pl.common.close}</Button>
                            </div>
                            {searchResults.length ? (
                                <ul>
                                    {searchResults.map((result) => (
                                        <li key={result.palletTrackingNumber}>
                                            <button type="button" onClick={() => showResult(result)}>
                                                <strong>{result.palletTrackingNumber}</strong>
                                                <span>{translations.search.resultLocation.replace("{code}", result.locationCode)
                                                    .replace("{map}", result.mapName)}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="department-map-hint">{translations.search.notFound}</p>}
                        </div>
                    ) : null}

                    {mode === "edit" && dirty ? (
                        <p className="department-map-dirty" role="status">{translations.editor.unsaved}</p>
                    ) : null}

                    <div className="department-map-body">
                        <div className="department-map-canvas-wrapper" ref={canvasWrapperRef} tabIndex={0} onKeyDown={handleKeyDown}>
                            {mapLoading ? (
                                <div className="department-map-canvas-loading"><CircularProgress size={22} /></div>
                            ) : null}
                            <MapCanvas
                                elements={layout.elements}
                                focusRequest={focusRequest}
                                gridSize={layout.gridSize}
                                height={layout.height}
                                highlightedLocationId={highlightedLocationId}
                                locations={locationsById}
                                mode={mode}
                                pickingTarget={Boolean(movingPallet)}
                                selectedElementId={selectedElementId}
                                showGrid={showGrid}
                                snapToGrid={snapToGrid}
                                tool={tool}
                                width={layout.width}
                                onBeginChange={pushUndo}
                                onCreateElement={(element) => {
                                    addElements([element], element.elementId);
                                    setTool("SELECT");
                                }}
                                onElementsChange={setElements}
                                onLocationActivate={activateLocation}
                                onSelect={setSelectedElementId}
                            />
                        </div>
                        <aside className="department-map-side-panel">
                            {renderSidePanel()}
                        </aside>
                    </div>
                    <p className="department-map-hint department-map-footer">
                        <TableRows fontSize="small" /> {translations.page.dimensions
                            .replace("{width}", String(layout.width))
                            .replace("{height}", String(layout.height))
                            .replace("{grid}", String(layout.gridSize))
                            .replace("{locations}", String(map.locations.length))}
                    </p>
                </>
            ) : null}

            <Dialog fullWidth maxWidth="sm" open={createOpen} onClose={() => !creating && setCreateOpen(false)}>
                <DialogTitle>{translations.create.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{translations.create.description.replace("{code}", departmentCode)}</DialogContentText>
                    {createError ? <Alert severity="error">{createError}</Alert> : null}
                    <div className="department-map-form-grid">
                        <TextField autoFocus label={translations.create.fields.name} required size="small" value={createForm.name}
                                   onChange={(event) => setCreateForm({...createForm, name: event.target.value})} />
                        <TextField label={translations.create.fields.width} required size="small" type="number"
                                   value={createForm.width}
                                   onChange={(event) => setCreateForm({...createForm, width: event.target.value})} />
                        <TextField label={translations.create.fields.height} required size="small" type="number"
                                   value={createForm.height}
                                   onChange={(event) => setCreateForm({...createForm, height: event.target.value})} />
                        <TextField label={translations.create.fields.gridSize} required size="small" type="number"
                                   value={createForm.gridSize}
                                   onChange={(event) => setCreateForm({...createForm, gridSize: event.target.value})} />
                    </div>
                    <label className="department-map-toggle">
                        <input checked={createForm.autoLayout} type="checkbox"
                               onChange={(event) => setCreateForm({...createForm, autoLayout: event.target.checked})} />
                        {translations.generator.autoLayout}
                    </label>
                    {createForm.autoLayout ? (
                        <div className="department-map-generator-options">
                            <p className="department-map-hint">{translations.generator.description}</p>
                            <label className="department-map-toggle">
                                <input checked={createForm.includeSorter} type="checkbox"
                                       onChange={(event) => setCreateForm({...createForm, includeSorter: event.target.checked})} />
                                {translations.generator.includeSorter}
                            </label>
                            <TextField label={translations.generator.slotCapacity} size="small" type="number"
                                       value={createForm.slotCapacity}
                                       onChange={(event) => setCreateForm({...createForm, slotCapacity: event.target.value})} />
                        </div>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button disabled={creating} variant="outlined" onClick={() => setCreateOpen(false)}>{pl.common.cancel}</Button>
                    <Button disabled={creating} startIcon={creating ? <CircularProgress size={16} /> : <Add />} variant="contained"
                            onClick={createMap}>
                        {translations.create.submit}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog fullWidth maxWidth="sm" open={generatorOpen} onClose={() => setGeneratorOpen(false)}>
                <DialogTitle>{translations.generator.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{translations.generator.description}</DialogContentText>
                    <p className="department-map-hint">{translations.generator.replaceWarning}</p>
                    {generatorError ? <Alert severity="error">{generatorError}</Alert> : null}
                    <div className="department-map-form-grid">
                        <TextField label={translations.create.fields.width} required size="small" type="number"
                                   value={generatorForm.width}
                                   onChange={(event) => setGeneratorForm({...generatorForm, width: event.target.value})} />
                        <TextField label={translations.create.fields.height} required size="small" type="number"
                                   value={generatorForm.height}
                                   onChange={(event) => setGeneratorForm({...generatorForm, height: event.target.value})} />
                        <TextField label={translations.generator.slotCapacity} size="small" type="number"
                                   value={generatorForm.slotCapacity}
                                   onChange={(event) => setGeneratorForm({...generatorForm, slotCapacity: event.target.value})} />
                    </div>
                    <label className="department-map-toggle">
                        <input checked={generatorForm.includeSorter} type="checkbox"
                               onChange={(event) => setGeneratorForm({...generatorForm, includeSorter: event.target.checked})} />
                        {translations.generator.includeSorter}
                    </label>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={() => setGeneratorOpen(false)}>{pl.common.cancel}</Button>
                    <Button startIcon={<AutoModeOutlined />} variant="contained" onClick={applyGeneratedLayout}>
                        {translations.generator.generate}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog fullWidth maxWidth="sm" open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)}>
                <DialogTitle>{translations.page.deleteTitle}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{translations.page.deleteDescription.replace("{name}", map?.name || "")}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button disabled={deleting} variant="outlined" onClick={() => setDeleteOpen(false)}>{pl.common.cancel}</Button>
                    <Button color="error" disabled={deleting} startIcon={<DeleteOutline />} variant="contained" onClick={deleteMap}>
                        {translations.page.delete}
                    </Button>
                </DialogActions>
            </Dialog>
        </section>
    );
}

export default DepartmentMapWorkspace;
