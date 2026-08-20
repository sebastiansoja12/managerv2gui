import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {IconButton} from "components/ui";
import {Add, LocationOn, OpenInFull} from "components/ui/icons";
import pl from "../../i18n/translate";
import {
    centerOn,
    clamp,
    createElement,
    elementCenter,
    elementFontSize,
    fitView,
    LOCATION_STATUS_COLOR,
    MIN_ELEMENT_SIZE,
    moveElementTo,
    Point,
    rackChildren,
    rectangleFromPoints,
    resizeFromCorner,
    rotateAround,
    rotationFromPointer,
    screenToWorld,
    snap,
    ViewState,
    zoomAt,
} from "./mapGeometry";
import {MapElementDto, MapElementType, StorageLocationDto} from "./model/DepartmentMap";

export type MapMode = "edit" | "operate";
export type MapTool = MapElementType | "SELECT";

type MapCanvasProps = {
    width: number;
    height: number;
    gridSize: number;
    elements: MapElementDto[];
    locations: Record<string, StorageLocationDto>;
    mode: MapMode;
    tool: MapTool;
    snapToGrid: boolean;
    showGrid: boolean;
    selectedElementId: string | null;
    highlightedLocationId?: string | null;
    pickingTarget?: boolean;
    focusRequest?: {elementId: string; nonce: number} | null;
    onSelect: (elementId: string | null) => void;
    onBeginChange?: () => void;
    onElementsChange?: (elements: MapElementDto[]) => void;
    onCreateElement?: (element: MapElementDto) => void;
    onLocationActivate?: (elementId: string) => void;
};

type Interaction =
    | {kind: "pan"; startScreen: Point; startView: ViewState; moved: boolean; elementId?: string}
    | {kind: "move"; elementId: string; startWorld: Point; startElement: MapElementDto; children: MapElementDto[];
    moved: boolean}
    | {kind: "rotate"; elementId: string; startElement: MapElementDto; children: MapElementDto[]}
    | {kind: "resize"; elementId: string}
    | {kind: "draw"; type: MapElementType; startWorld: Point; currentWorld: Point};

const FALLBACK_VIEWPORT = {width: 900, height: 560};
const HANDLE_SCREEN_SIZE = 10;
const ROTATE_HANDLE_SCREEN_OFFSET = 22;
const TEXT_SCALE = 40;

const MAX_SORTER_CHEVRONS = 160;

const textUpright = (rotation: number) => rotation > 90 && rotation <= 270 ? "rotate(180) " : "";

export const sorterChevrons = (element: Pick<MapElementDto, "width" | "height">) => {
    const pitch = Math.max(1, element.width / MAX_SORTER_CHEVRONS);
    const arm = Math.min(element.height * 0.32, pitch * 0.45);
    const commands: string[] = [];
    for (let position = -element.width / 2 + pitch / 2; position < element.width / 2; position += pitch) {
        commands.push(`M ${position - arm} ${-element.height * 0.32} L ${position + arm * 0.6} 0 L ${position - arm} ${element.height * 0.32}`);
    }
    return commands.join(" ");
};

const statusLabel = (location?: StorageLocationDto) => location
    ? pl.departmentMap.status[location.status]
    : pl.departmentMap.status.UNSAVED;

function MapCanvas({
                       width,
                       height,
                       gridSize,
                       elements,
                       locations,
                       mode,
                       tool,
                       snapToGrid,
                       showGrid,
                       selectedElementId,
                       highlightedLocationId,
                       pickingTarget = false,
                       focusRequest,
                       onSelect,
                       onBeginChange,
                       onElementsChange,
                       onCreateElement,
                       onLocationActivate,
                   }: MapCanvasProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const interactionRef = useRef<Interaction | null>(null);
    const suppressClickRef = useRef(false);
    const pointerActivatedRef = useRef<string | null>(null);
    const userAdjustedRef = useRef(false);
    const elementsRef = useRef<MapElementDto[]>(elements);
    const [view, setView] = useState<ViewState>(() => fitView(width, height, FALLBACK_VIEWPORT.width,
        FALLBACK_VIEWPORT.height));
    const [draft, setDraft] = useState<{x: number; y: number; width: number; height: number} | null>(null);
    const [panning, setPanning] = useState(false);
    const editable = mode === "edit";

    elementsRef.current = elements;

    const viewportSize = useCallback(() => {
        const container = containerRef.current;
        return {
            width: container?.clientWidth || FALLBACK_VIEWPORT.width,
            height: container?.clientHeight || FALLBACK_VIEWPORT.height,
        };
    }, []);

    const fit = useCallback(() => {
        const viewport = viewportSize();
        setView(fitView(width, height, viewport.width, viewport.height));
    }, [height, viewportSize, width]);

    useEffect(() => {
        userAdjustedRef.current = false;
        fit();
        const container = containerRef.current;
        if (!container || typeof ResizeObserver === "undefined") {
            return undefined;
        }
        const observer = new ResizeObserver(() => {
            if (!userAdjustedRef.current) {
                fit();
            }
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, [fit]);

    useEffect(() => {
        if (!focusRequest) {
            return;
        }
        const target = elementsRef.current.find((element) => element.elementId === focusRequest.elementId);
        if (!target) {
            return;
        }
        const viewport = viewportSize();
        userAdjustedRef.current = true;
        setView((currentView) => centerOn({...currentView, zoom: Math.max(currentView.zoom, 24)},
            elementCenter(target), viewport.width, viewport.height));
    }, [focusRequest, viewportSize]);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) {
            return undefined;
        }
        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            const bounds = svg.getBoundingClientRect();
            const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
            userAdjustedRef.current = true;
            setView((currentView) => zoomAt(currentView, {x: event.clientX - bounds.left, y: event.clientY - bounds.top},
                factor));
        };
        svg.addEventListener("wheel", handleWheel, {passive: false});
        return () => svg.removeEventListener("wheel", handleWheel);
    }, []);

    const pointerScreen = (event: React.PointerEvent): Point => {
        const bounds = svgRef.current?.getBoundingClientRect();
        return {x: event.clientX - (bounds?.left || 0), y: event.clientY - (bounds?.top || 0)};
    };

    const pointerWorld = (event: React.PointerEvent) => screenToWorld(pointerScreen(event), view);

    const capture = (event: React.PointerEvent) => {
        const svg = svgRef.current as (SVGSVGElement & {setPointerCapture?: (pointerId: number) => void}) | null;
        if (svg && typeof svg.setPointerCapture === "function" && event.pointerId !== undefined) {
            try {
                svg.setPointerCapture(event.pointerId);
            } catch (captureError) {
                svg.releasePointerCapture?.(event.pointerId);
            }
        }
    };

    const replaceElement = (updated: MapElementDto) => {
        onElementsChange?.(elementsRef.current.map((element) =>
            element.elementId === updated.elementId ? updated : element));
    };

    const startBackgroundInteraction = (event: React.PointerEvent<SVGRectElement | SVGSVGElement>) => {
        if (event.button !== 0 && event.button !== 1) {
            return;
        }
        capture(event);
        if (editable && tool !== "SELECT" && event.button === 0) {
            const world = pointerWorld(event);
            const start = {x: snap(world.x, gridSize, snapToGrid), y: snap(world.y, gridSize, snapToGrid)};
            interactionRef.current = {kind: "draw", type: tool, startWorld: start, currentWorld: start};
            setDraft({...start, width: 0, height: 0});
            return;
        }
        interactionRef.current = {kind: "pan", startScreen: pointerScreen(event), startView: view, moved: false};
        setPanning(true);
    };

    const startElementInteraction = (event: React.PointerEvent, element: MapElementDto) => {
        event.stopPropagation();
        if (!editable) {
            capture(event);
            interactionRef.current = {kind: "pan", startScreen: pointerScreen(event), startView: view, moved: false,
                elementId: element.type === "STORAGE_LOCATION" ? element.elementId : undefined};
            setPanning(true);
            return;
        }
        if (tool !== "SELECT") {
            startBackgroundInteraction(event as unknown as React.PointerEvent<SVGRectElement>);
            return;
        }
        capture(event);
        onSelect(element.elementId);
        interactionRef.current = {
            kind: "move",
            elementId: element.elementId,
            startWorld: pointerWorld(event),
            startElement: element,
            children: rackChildren(element, elementsRef.current),
            moved: false,
        };
    };

    const startHandleInteraction = (event: React.PointerEvent, kind: "rotate" | "resize", elementId: string) => {
        event.stopPropagation();
        capture(event);
        onBeginChange?.();
        const element = elementsRef.current.find((candidate) => candidate.elementId === elementId);
        interactionRef.current = kind === "rotate" && element
            ? {kind, elementId, startElement: element, children: rackChildren(element, elementsRef.current)}
            : {kind: "resize", elementId};
    };

    const replaceElements = (updated: MapElementDto[]) => {
        const byId = new Map<string, MapElementDto>();
        updated.forEach((element) => byId.set(element.elementId, element));
        onElementsChange?.(elementsRef.current.map((element) => byId.get(element.elementId) || element));
    };

    const handlePointerMove = (event: React.PointerEvent) => {
        const interaction = interactionRef.current;
        if (!interaction) {
            return;
        }
        if (interaction.kind === "pan") {
            const screen = pointerScreen(event);
            const deltaX = screen.x - interaction.startScreen.x;
            const deltaY = screen.y - interaction.startScreen.y;
            if (Math.abs(deltaX) + Math.abs(deltaY) > 2) {
                interaction.moved = true;
                userAdjustedRef.current = true;
            }
            setView({...interaction.startView, offsetX: interaction.startView.offsetX + deltaX,
                offsetY: interaction.startView.offsetY + deltaY});
            return;
        }
        const world = pointerWorld(event);
        if (interaction.kind === "draw") {
            const current = {x: snap(world.x, gridSize, snapToGrid), y: snap(world.y, gridSize, snapToGrid)};
            interaction.currentWorld = current;
            setDraft(rectangleFromPoints(interaction.startWorld, current));
            return;
        }
        const element = elementsRef.current.find((candidate) => candidate.elementId === interaction.elementId);
        if (!element) {
            return;
        }
        if (interaction.kind === "move") {
            const deltaX = world.x - interaction.startWorld.x;
            const deltaY = world.y - interaction.startWorld.y;
            if (!interaction.moved) {
                if (Math.abs(deltaX) * view.zoom + Math.abs(deltaY) * view.zoom < 3) {
                    return;
                }
                interaction.moved = true;
                onBeginChange?.();
            }
            const moved = moveElementTo(element,
                clamp(snap(interaction.startElement.x + deltaX, gridSize, snapToGrid), -element.width / 2,
                    width - element.width / 2),
                clamp(snap(interaction.startElement.y + deltaY, gridSize, snapToGrid), -element.height / 2,
                    height - element.height / 2));
            const appliedX = moved.x - interaction.startElement.x;
            const appliedY = moved.y - interaction.startElement.y;
            replaceElements([moved].concat(interaction.children.map((child) =>
                moveElementTo(child, child.x + appliedX, child.y + appliedY))));
        } else if (interaction.kind === "rotate") {
            const rotation = rotationFromPointer(element, world, event.shiftKey ? 1 : 15);
            const delta = rotation - interaction.startElement.rotation;
            const pivot = elementCenter(interaction.startElement);
            replaceElements([{...element, rotation}].concat(interaction.children.map((child) =>
                rotateAround(child, pivot, delta))));
        } else if (interaction.kind === "resize") {
            const target = {x: snap(world.x, gridSize, snapToGrid && element.rotation % 90 === 0),
                y: snap(world.y, gridSize, snapToGrid && element.rotation % 90 === 0)};
            replaceElement(resizeFromCorner(element, target));
        }
    };

    const finishInteraction = () => {
        const interaction = interactionRef.current;
        interactionRef.current = null;
        setPanning(false);
        if (!interaction) {
            return;
        }
        suppressClickRef.current = interaction.kind === "pan" && interaction.moved;
        if (interaction.kind === "pan" && !interaction.moved && editable) {
            onSelect(null);
        }
        if (interaction.kind === "pan" && !interaction.moved && !editable && interaction.elementId) {
            pointerActivatedRef.current = interaction.elementId;
            onLocationActivate?.(interaction.elementId);
        }
        if (interaction.kind === "draw") {
            setDraft(null);
            const rectangle = rectangleFromPoints(interaction.startWorld, interaction.currentWorld);
            const hasSize = rectangle.width >= MIN_ELEMENT_SIZE * 4 && rectangle.height >= MIN_ELEMENT_SIZE * 2;
            const element = createElement(interaction.type,
                hasSize ? rectangle.x : interaction.startWorld.x,
                hasSize ? rectangle.y : interaction.startWorld.y,
                elementsRef.current,
                hasSize ? {width: rectangle.width, height: rectangle.height} : undefined);
            onCreateElement?.(element);
        }
    };

    const zoomBy = (factor: number) => {
        userAdjustedRef.current = true;
        const viewport = viewportSize();
        setView((currentView) => zoomAt(currentView, {x: viewport.width / 2, y: viewport.height / 2}, factor));
    };

    const orderedElements = useMemo(() => {
        const base = elements.filter((element) => element.elementId !== selectedElementId);
        const selected = elements.find((element) => element.elementId === selectedElementId);
        return selected ? base.concat(selected) : base;
    }, [elements, selectedElementId]);

    const handleSize = HANDLE_SCREEN_SIZE / view.zoom;
    const rotateOffset = ROTATE_HANDLE_SCREEN_OFFSET / view.zoom;
    const cursor = panning ? "grabbing" : editable && tool !== "SELECT" ? "crosshair" : pickingTarget ? "copy" : "grab";

    return (
        <div className="department-map-canvas" ref={containerRef}>
            <svg
                aria-label={pl.departmentMap.canvas.ariaLabel}
                className="department-map-svg"
                ref={svgRef}
                role="img"
                style={{cursor}}
                onPointerCancel={finishInteraction}
                onPointerMove={handlePointerMove}
                onPointerUp={finishInteraction}
            >
                <defs>
                    <pattern height={gridSize} id="department-map-grid" patternUnits="userSpaceOnUse" width={gridSize}>
                        <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="var(--department-map-grid)"
                              strokeWidth={1 / view.zoom} />
                    </pattern>
                </defs>
                <rect className="department-map-backdrop" height="100%" width="100%" x={0} y={0}
                      onPointerDown={startBackgroundInteraction} />
                <g transform={`translate(${view.offsetX} ${view.offsetY}) scale(${view.zoom})`}>
                    <rect className="department-map-floor" height={height} width={width} x={0} y={0}
                          onPointerDown={startBackgroundInteraction} />
                    {showGrid ? (
                        <rect fill="url(#department-map-grid)" height={height} pointerEvents="none" width={width} x={0}
                              y={0} />
                    ) : null}
                    {orderedElements.map((element) => {
                        const center = elementCenter(element);
                        const selected = element.elementId === selectedElementId;
                        const isLocation = element.type === "STORAGE_LOCATION";
                        const location = isLocation ? locations[element.elementId] : undefined;
                        const highlighted = highlightedLocationId === element.elementId;
                        const fill = !editable && isLocation
                            ? (location ? LOCATION_STATUS_COLOR[location.status] : "#9AA6B5")
                            : element.color || "#FFFFFF";
                        const fontSize = elementFontSize(element);
                        const text = isLocation ? element.locationCode : element.label;
                        const occupancy = isLocation && location ? `${location.pallets.length}/${location.capacity}` : null;
                        const ariaLabel = isLocation
                            ? pl.departmentMap.canvas.locationLabel
                                .replace("{code}", element.locationCode || "")
                                .replace("{status}", statusLabel(location))
                            : `${pl.departmentMap.elementTypes[element.type]}${element.label ? ` ${element.label}` : ""}`;
                        const interactive = editable || isLocation;
                        return (
                            <g
                                aria-label={ariaLabel}
                                aria-pressed={interactive ? selected : undefined}
                                className={[
                                    "department-map-element",
                                    `department-map-element-${element.type.toLowerCase()}`,
                                    selected ? "department-map-element-selected" : "",
                                    highlighted ? "department-map-element-highlighted" : "",
                                ].filter(Boolean).join(" ")}
                                key={element.elementId}
                                role={interactive ? "button" : undefined}
                                tabIndex={interactive ? 0 : undefined}
                                transform={`translate(${center.x} ${center.y}) rotate(${element.rotation})`}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    if (suppressClickRef.current) {
                                        suppressClickRef.current = false;
                                        return;
                                    }
                                    if (pointerActivatedRef.current === element.elementId) {
                                        pointerActivatedRef.current = null;
                                        return;
                                    }
                                    if (!editable && isLocation) {
                                        onLocationActivate?.(element.elementId);
                                    } else if (editable) {
                                        onSelect(element.elementId);
                                    }
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        if (!editable && isLocation) {
                                            onLocationActivate?.(element.elementId);
                                        } else if (editable) {
                                            onSelect(element.elementId);
                                        }
                                    }
                                }}
                                onPointerDown={(event) => startElementInteraction(event, element)}
                            >
                                <rect
                                    className="department-map-shape"
                                    fill={fill}
                                    fillOpacity={element.type === "ROOM" || element.type === "ZONE" ? 0.55 : 0.92}
                                    height={element.height}
                                    rx={element.type === "ZONE" ? Math.min(element.width, element.height) * 0.06 : 0}
                                    vectorEffect="non-scaling-stroke"
                                    width={element.width}
                                    x={-element.width / 2}
                                    y={-element.height / 2}
                                />
                                {element.type === "SORTER" ? (
                                    <>
                                        <path className="department-map-sorter-chevrons" d={sorterChevrons(element)}
                                              fill="none" pointerEvents="none" vectorEffect="non-scaling-stroke" />
                                        <line className="department-map-sorter-flow" pointerEvents="none"
                                              vectorEffect="non-scaling-stroke" x1={-element.width / 2} x2={element.width / 2}
                                              y1={0} y2={0} />
                                    </>
                                ) : null}
                                {location?.reservation && !editable ? (
                                    <rect className="department-map-reservation-mark" fill="none"
                                          height={element.height * 0.8} vectorEffect="non-scaling-stroke"
                                          width={element.width * 0.8} x={-element.width * 0.4} y={-element.height * 0.4} />
                                ) : null}
                                {text ? (
                                    <text className="department-map-text" dominantBaseline="middle"
                                          fontSize={fontSize * TEXT_SCALE} pointerEvents="none" textAnchor="middle"
                                          transform={`${textUpright(element.rotation)}scale(${1 / TEXT_SCALE})`}
                                          y={(occupancy && !editable ? -fontSize * 0.45 : 0) * TEXT_SCALE}>
                                        {text}
                                    </text>
                                ) : null}
                                {occupancy && !editable ? (
                                    <text className="department-map-text department-map-occupancy" dominantBaseline="middle"
                                          fontSize={fontSize * 0.8 * TEXT_SCALE} pointerEvents="none" textAnchor="middle"
                                          transform={`${textUpright(element.rotation)}scale(${1 / TEXT_SCALE})`} y={fontSize * 0.6 * TEXT_SCALE}>
                                        {occupancy}
                                    </text>
                                ) : null}
                                {selected && editable ? (
                                    <>
                                        <line className="department-map-handle-line" vectorEffect="non-scaling-stroke"
                                              x1={0} x2={0} y1={-element.height / 2} y2={-element.height / 2 - rotateOffset} />
                                        <circle
                                            aria-label={pl.departmentMap.canvas.rotateHandle}
                                            className="department-map-handle department-map-handle-rotate"
                                            cx={0}
                                            cy={-element.height / 2 - rotateOffset}
                                            r={handleSize / 1.6}
                                            vectorEffect="non-scaling-stroke"
                                            onPointerDown={(event) => startHandleInteraction(event, "rotate", element.elementId)}
                                        />
                                        <rect
                                            aria-label={pl.departmentMap.canvas.resizeHandle}
                                            className="department-map-handle department-map-handle-resize"
                                            height={handleSize}
                                            vectorEffect="non-scaling-stroke"
                                            width={handleSize}
                                            x={element.width / 2 - handleSize / 2}
                                            y={element.height / 2 - handleSize / 2}
                                            onPointerDown={(event) => startHandleInteraction(event, "resize", element.elementId)}
                                        />
                                    </>
                                ) : null}
                            </g>
                        );
                    })}
                    {draft ? (
                        <rect className="department-map-draft" height={Math.max(draft.height, 0.01)}
                              vectorEffect="non-scaling-stroke" width={Math.max(draft.width, 0.01)} x={draft.x} y={draft.y} />
                    ) : null}
                </g>
            </svg>
            <div className="department-map-zoom-controls">
                <IconButton aria-label={pl.departmentMap.canvas.zoomIn} size="small" title={pl.departmentMap.canvas.zoomIn}
                            onClick={() => zoomBy(1.25)}>
                    <Add fontSize="small" />
                </IconButton>
                <span className="department-map-zoom-value">{Math.round(view.zoom)} {pl.departmentMap.canvas.pxPerMeter}</span>
                <IconButton aria-label={pl.departmentMap.canvas.zoomOut} size="small" title={pl.departmentMap.canvas.zoomOut}
                            onClick={() => zoomBy(1 / 1.25)}>
                    <span aria-hidden="true" className="department-map-minus">−</span>
                </IconButton>
                <IconButton aria-label={pl.departmentMap.canvas.fit} size="small" title={pl.departmentMap.canvas.fit}
                            onClick={fit}>
                    <OpenInFull fontSize="small" />
                </IconButton>
                <IconButton aria-label={pl.departmentMap.canvas.centerSelection} size="small"
                            title={pl.departmentMap.canvas.centerSelection}
                            disabled={!selectedElementId}
                            onClick={() => {
                                const target = elements.find((element) => element.elementId === selectedElementId);
                                if (target) {
                                    const viewport = viewportSize();
                                    setView((currentView) => centerOn(currentView, elementCenter(target), viewport.width,
                                        viewport.height));
                                }
                            }}>
                    <LocationOn fontSize="small" />
                </IconButton>
            </div>
        </div>
    );
}

export default MapCanvas;
