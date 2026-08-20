import {LocationStatus, MapElementDto, MapElementType, StorageLocationDto} from "./model/DepartmentMap";

export type Point = {
    x: number;
    y: number;
};

export type ViewState = {
    zoom: number;
    offsetX: number;
    offsetY: number;
};

export const MIN_ELEMENT_SIZE = 0.05;
export const MIN_ZOOM = 2;
export const MAX_ZOOM = 400;
export const ROTATION_STEP = 15;
export const SLOT_INSET = 0.86;

export const DEFAULT_ELEMENT_SIZE: Record<MapElementType, {width: number; height: number}> = {
    ROOM: {width: 10, height: 8},
    WALL: {width: 6, height: 0.2},
    AISLE: {width: 10, height: 3},
    ZONE: {width: 6, height: 6},
    RACK: {width: 6, height: 1.2},
    SORTER: {width: 12, height: 1.2},
    STORAGE_LOCATION: {width: 1.2, height: 1},
};

export const DEFAULT_ELEMENT_COLOR: Record<MapElementType, string> = {
    ROOM: "#E8EEF6",
    WALL: "#3B4A5E",
    AISLE: "#F6F1DE",
    ZONE: "#DCEFE6",
    RACK: "#B9C7D8",
    SORTER: "#4B5563",
    STORAGE_LOCATION: "#FFFFFF",
};

export const LOCATION_STATUS_COLOR: Record<LocationStatus, string> = {
    FREE: "#2E9E62",
    PARTIALLY_OCCUPIED: "#D9A21B",
    OCCUPIED: "#C83B4C",
    RESERVED: "#3A66D6",
};

const round = (value: number, precision = 3) => {
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
};

export const snap = (value: number, gridSize: number, enabled = true) =>
    enabled && gridSize > 0 ? round(Math.round(value / gridSize) * gridSize) : round(value);

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const normalizeRotation = (rotation: number) => round(((rotation % 360) + 360) % 360, 2);

export const toRadians = (degrees: number) => degrees * Math.PI / 180;

export const rotatePoint = (point: Point, degrees: number): Point => {
    const radians = toRadians(degrees);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return {x: point.x * cos - point.y * sin, y: point.x * sin + point.y * cos};
};

export const elementCenter = (element: Pick<MapElementDto, "x" | "y" | "width" | "height">): Point => ({
    x: element.x + element.width / 2,
    y: element.y + element.height / 2,
});

export const screenToWorld = (screen: Point, view: ViewState): Point => ({
    x: (screen.x - view.offsetX) / view.zoom,
    y: (screen.y - view.offsetY) / view.zoom,
});

export const zoomAt = (view: ViewState, screen: Point, factor: number): ViewState => {
    const zoom = clamp(view.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    const world = screenToWorld(screen, view);
    return {zoom, offsetX: screen.x - world.x * zoom, offsetY: screen.y - world.y * zoom};
};

export const fitView = (mapWidth: number, mapHeight: number, viewportWidth: number, viewportHeight: number,
                        padding = 24): ViewState => {
    const usableWidth = Math.max(viewportWidth - padding * 2, 50);
    const usableHeight = Math.max(viewportHeight - padding * 2, 50);
    const zoom = clamp(Math.min(usableWidth / mapWidth, usableHeight / mapHeight), MIN_ZOOM, MAX_ZOOM);
    return {
        zoom,
        offsetX: (viewportWidth - mapWidth * zoom) / 2,
        offsetY: (viewportHeight - mapHeight * zoom) / 2,
    };
};

export const centerOn = (view: ViewState, point: Point, viewportWidth: number, viewportHeight: number): ViewState => ({
    zoom: view.zoom,
    offsetX: viewportWidth / 2 - point.x * view.zoom,
    offsetY: viewportHeight / 2 - point.y * view.zoom,
});

export const moveElementTo = (element: MapElementDto, x: number, y: number): MapElementDto => ({
    ...element,
    x: round(x),
    y: round(y),
});

export const rotationFromPointer = (element: MapElementDto, pointer: Point, step = ROTATION_STEP) => {
    const center = elementCenter(element);
    const angle = Math.atan2(pointer.y - center.y, pointer.x - center.x) * 180 / Math.PI + 90;
    return normalizeRotation(step > 0 ? Math.round(angle / step) * step : angle);
};

export const resizeFromCorner = (element: MapElementDto, pointer: Point): MapElementDto => {
    const center = elementCenter(element);
    const anchor = rotatePoint({x: -element.width / 2, y: -element.height / 2}, element.rotation);
    const anchorWorld = {x: center.x + anchor.x, y: center.y + anchor.y};
    const local = rotatePoint({x: pointer.x - anchorWorld.x, y: pointer.y - anchorWorld.y}, -element.rotation);
    const width = Math.max(MIN_ELEMENT_SIZE, round(local.x));
    const height = Math.max(MIN_ELEMENT_SIZE, round(local.y));
    const offset = rotatePoint({x: width / 2, y: height / 2}, element.rotation);
    const newCenter = {x: anchorWorld.x + offset.x, y: anchorWorld.y + offset.y};
    return {...element, width, height, x: round(newCenter.x - width / 2), y: round(newCenter.y - height / 2)};
};

export const rectangleFromPoints = (start: Point, end: Point) => ({
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
});

export const createElementId = () => {
    const cryptoApi = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
    if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
        return cryptoApi.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
        const random = Math.floor(Math.random() * 16);
        return (character === "x" ? random : (random % 4) + 8).toString(16);
    });
};

export const nextLocationCode = (elements: MapElementDto[], prefix = "L") => {
    const used = new Set(elements.map((element) => (element.locationCode || "").toUpperCase()));
    let index = 1;
    while (used.has(`${prefix}-${String(index).padStart(2, "0")}`)) {
        index += 1;
    }
    return `${prefix}-${String(index).padStart(2, "0")}`;
};

export const createElement = (type: MapElementType, x: number, y: number, elements: MapElementDto[],
                              size?: {width: number; height: number}): MapElementDto => {
    const dimensions = size && size.width >= MIN_ELEMENT_SIZE && size.height >= MIN_ELEMENT_SIZE
        ? size
        : DEFAULT_ELEMENT_SIZE[type];
    return {
        elementId: createElementId(),
        type,
        label: null,
        x: round(x),
        y: round(y),
        width: round(dimensions.width),
        height: round(dimensions.height),
        rotation: 0,
        color: DEFAULT_ELEMENT_COLOR[type],
        locationCode: type === "STORAGE_LOCATION" ? nextLocationCode(elements) : null,
        capacity: type === "STORAGE_LOCATION" ? 1 : null,
    };
};

export const generateRackSlots = (rack: MapElementDto, count: number, prefix: string, capacity: number,
                                  existing: MapElementDto[]): MapElementDto[] => {
    const slotCount = Math.max(1, Math.floor(count));
    const normalizedPrefix = prefix.trim().toUpperCase() || (rack.label || "R").trim().toUpperCase();
    const slotWidth = rack.width / slotCount;
    const center = elementCenter(rack);
    const usedCodes = new Set(existing.map((element) => (element.locationCode || "").toUpperCase()));
    const slots: MapElementDto[] = [];
    let codeIndex = 1;
    for (let slot = 0; slot < slotCount; slot += 1) {
        while (usedCodes.has(`${normalizedPrefix}-${String(codeIndex).padStart(2, "0")}`)) {
            codeIndex += 1;
        }
        const code = `${normalizedPrefix}-${String(codeIndex).padStart(2, "0")}`;
        usedCodes.add(code);
        const localCenter = {x: -rack.width / 2 + slotWidth * (slot + 0.5), y: 0};
        const offset = rotatePoint(localCenter, rack.rotation);
        const slotCenter = {x: center.x + offset.x, y: center.y + offset.y};
        const width = round(slotWidth * SLOT_INSET);
        const height = round(rack.height * SLOT_INSET);
        slots.push({
            elementId: createElementId(),
            type: "STORAGE_LOCATION",
            label: null,
            x: round(slotCenter.x - width / 2),
            y: round(slotCenter.y - height / 2),
            width,
            height,
            rotation: rack.rotation,
            color: DEFAULT_ELEMENT_COLOR.STORAGE_LOCATION,
            locationCode: code,
            capacity,
        });
    }
    return slots;
};

export const duplicateElement = (element: MapElementDto, elements: MapElementDto[], offset: number): MapElementDto => ({
    ...element,
    elementId: createElementId(),
    x: round(element.x + offset),
    y: round(element.y + offset),
    locationCode: element.type === "STORAGE_LOCATION"
        ? nextLocationCode(elements, (element.locationCode || "L").split("-")[0] || "L")
        : element.locationCode,
});

export const findDuplicateLocationCodes = (elements: MapElementDto[]) => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    elements
        .filter((element) => element.type === "STORAGE_LOCATION")
        .map((element) => (element.locationCode || "").trim().toUpperCase())
        .forEach((code) => {
            if (seen.has(code)) {
                duplicates.add(code);
            }
            seen.add(code);
        });
    const result: string[] = [];
    duplicates.forEach((code) => result.push(code));
    return result;
};

export const validateLayout = (elements: MapElementDto[], width: number, height: number) => {
    const problems: Array<{type: "missingCode" | "duplicateCode" | "outside" | "capacity"; value: string}> = [];
    elements.forEach((element) => {
        const center = elementCenter(element);
        if (center.x < 0 || center.y < 0 || center.x > width || center.y > height) {
            problems.push({type: "outside", value: element.label || element.locationCode || element.type});
        }
        if (element.type === "STORAGE_LOCATION") {
            if (!element.locationCode || !element.locationCode.trim()) {
                problems.push({type: "missingCode", value: element.elementId});
            }
            if (!element.capacity || element.capacity < 1 || element.capacity > 99) {
                problems.push({type: "capacity", value: element.locationCode || element.elementId});
            }
        }
    });
    findDuplicateLocationCodes(elements).filter(Boolean)
        .forEach((code) => problems.push({type: "duplicateCode", value: code}));
    return problems;
};

export const locationStatusOf = (location?: StorageLocationDto | null): LocationStatus | "UNSAVED" =>
    location ? location.status : "UNSAVED";

export const elementFontSize = (element: Pick<MapElementDto, "width" | "height">) =>
    clamp(Math.min(element.width, element.height) * 0.38, 0.18, 1.4);

export const containsPoint = (element: MapElementDto, point: Point) => {
    const center = elementCenter(element);
    const local = rotatePoint({x: point.x - center.x, y: point.y - center.y}, -element.rotation);
    return Math.abs(local.x) <= element.width / 2 + 0.001 && Math.abs(local.y) <= element.height / 2 + 0.001;
};

export const rackChildren = (rack: MapElementDto, elements: MapElementDto[]) => rack.type !== "RACK" ? [] : elements
    .filter((element) => element.type === "STORAGE_LOCATION" && containsPoint(rack, elementCenter(element)));

export const rotateAround = (element: MapElementDto, pivot: Point, deltaDegrees: number): MapElementDto => {
    const center = elementCenter(element);
    const offset = rotatePoint({x: center.x - pivot.x, y: center.y - pivot.y}, deltaDegrees);
    return {
        ...element,
        x: round(pivot.x + offset.x - element.width / 2),
        y: round(pivot.y + offset.y - element.height / 2),
        rotation: normalizeRotation(element.rotation + deltaDegrees),
    };
};
