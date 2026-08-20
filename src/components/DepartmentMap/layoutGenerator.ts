import {createElementId, DEFAULT_ELEMENT_COLOR, generateRackSlots} from "./mapGeometry";
import {MapElementDto, MapElementType} from "./model/DepartmentMap";

export type LayoutGeneratorLabels = {
    hall: string;
    inbound: string;
    outbound: string;
    sorter: string;
    chute: string;
    mainAisle: string;
    aisle: string;
};

export type LayoutGeneratorOptions = {
    width: number;
    height: number;
    seed: number;
    includeSorter: boolean;
    slotCapacity: number;
    labels: LayoutGeneratorLabels;
};

export type GeneratedLayout = {
    elements: MapElementDto[];
    rackCount: number;
    locationCount: number;
};

type Rect = {x: number; y: number; width: number; height: number};

const MAX_GENERATED_ELEMENTS = 4500;
const WALL_THICKNESS = 0.25;
const SORTER_WIDTH = 1.2;

const round = (value: number) => Math.round(value * 100) / 100;

export const createRandom = (seed: number) => {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6D2B79F5) >>> 0;
        let mixed = state;
        mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
        mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
        return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
};

export const randomSeed = () => Math.floor(Math.random() * 2147483647);

export const rackCode = (index: number) => {
    let value = index;
    let code = "";
    do {
        code = String.fromCharCode(65 + (value % 26)) + code;
        value = Math.floor(value / 26) - 1;
    } while (value >= 0);
    return code;
};

const element = (type: MapElementType, rect: Rect, label: string | null = null, rotation = 0): MapElementDto => ({
    elementId: createElementId(),
    type,
    label,
    x: round(rect.x),
    y: round(rect.y),
    width: round(rect.width),
    height: round(rect.height),
    rotation,
    color: DEFAULT_ELEMENT_COLOR[type],
    locationCode: null,
    capacity: null,
});

export const generateLayout = ({width, height, seed, includeSorter, slotCapacity, labels}: LayoutGeneratorOptions): GeneratedLayout => {
    const random = createRandom(seed);
    const between = (min: number, max: number, step = 0.1) =>
        Math.round((min + random() * (max - min)) / step) * step;
    const elements: MapElementDto[] = [];
    let rackCount = 0;
    let locationCount = 0;

    const room: Rect = {x: 0.5, y: 0.5, width: width - 1, height: height - 1};
    elements.push(element("ROOM", room, labels.hall));
    elements.push(element("WALL", {x: room.x, y: room.y, width: room.width, height: WALL_THICKNESS}));
    elements.push(element("WALL", {x: room.x, y: room.y + room.height - WALL_THICKNESS, width: room.width, height: WALL_THICKNESS}));
    elements.push(element("WALL", {x: room.x, y: room.y, width: WALL_THICKNESS, height: room.height}));
    elements.push(element("WALL", {x: room.x + room.width - WALL_THICKNESS, y: room.y, width: WALL_THICKNESS, height: room.height}));

    const inner: Rect = {x: room.x + 1, y: room.y + 1, width: room.width - 2, height: room.height - 2};
    let bottom = inner.y + inner.height;

    if (inner.height >= 12 && inner.width >= 8) {
        const dockDepth = Math.min(12, Math.max(3, round(inner.height * between(0.14, 0.2, 0.01))));
        const dockY = bottom - dockDepth;
        const half = (inner.width - 1) / 2;
        elements.push(element("ZONE", {x: inner.x, y: dockY, width: half, height: dockDepth}, labels.inbound));
        elements.push(element("ZONE", {x: inner.x + half + 1, y: dockY, width: half, height: dockDepth}, labels.outbound));
        bottom = dockY - 1;

        if (includeSorter && inner.width >= 10 && inner.height >= 14) {
            const sorterY = bottom - SORTER_WIDTH;
            const sorterLength = inner.width - 2;
            const reversed = random() < 0.5;
            elements.push(element("SORTER", {x: inner.x + 1, y: sorterY, width: sorterLength, height: SORTER_WIDTH},
                labels.sorter, reversed ? 180 : 0));
            const chuteLength = Math.max(1.2, Math.min(dockDepth * 0.4, 4));
            const chuteCount = Math.max(1, Math.min(6, Math.floor(half / 6)));
            for (let chute = 0; chute < chuteCount; chute += 1) {
                const centerX = inner.x + half + 1 + half * ((chute + 0.5) / chuteCount);
                const centerY = sorterY + SORTER_WIDTH + chuteLength / 2;
                elements.push(element("SORTER", {
                    x: centerX - chuteLength / 2,
                    y: centerY - 0.4,
                    width: chuteLength,
                    height: 0.8,
                }, `${labels.chute} ${chute + 1}`, 90));
            }
            bottom = sorterY - 0.5;
            const mainAisleHeight = Math.min(4, Math.max(2.5, between(2.5, 4, 0.5)));
            elements.push(element("AISLE", {x: inner.x, y: bottom - mainAisleHeight, width: inner.width,
                height: mainAisleHeight}, labels.mainAisle));
            bottom -= mainAisleHeight + 0.5;
        }
    }

    const rackArea: Rect = {x: inner.x, y: inner.y, width: inner.width, height: bottom - inner.y};
    if (rackArea.width < 4 || rackArea.height < 3) {
        return {elements, rackCount, locationCount};
    }

    const vertical = rackArea.height > rackArea.width * 1.3 || (random() < 0.35 && rackArea.height > 12);
    const across = vertical ? rackArea.width : rackArea.height;
    const along = vertical ? rackArea.height : rackArea.width;
    const toWorld = (local: Rect): {rect: Rect; rotation: number} => {
        if (!vertical) {
            return {rect: {x: rackArea.x + local.x, y: rackArea.y + local.y, width: local.width, height: local.height},
                rotation: 0};
        }
        const centerX = rackArea.x + local.y + local.height / 2;
        const centerY = rackArea.y + local.x + local.width / 2;
        return {rect: {x: centerX - local.width / 2, y: centerY - local.height / 2, width: local.width,
            height: local.height}, rotation: 90};
    };
    const aisleRect = (local: Rect): Rect => vertical
        ? {x: rackArea.x + local.y, y: rackArea.y + local.x, width: local.height, height: local.width}
        : {x: rackArea.x + local.x, y: rackArea.y + local.y, width: local.width, height: local.height};

    const rackDepth = between(1, 1.4);
    const aisleWidth = between(2.5, 3.5, 0.5);
    const segmentLength = between(10, 18, 1);
    const crossAisle = 2.5;
    const slotPitch = between(1.2, 1.5);

    const segments: Array<{start: number; length: number}> = [];
    let cursor = 0;
    while (cursor < along - 2) {
        const length = Math.min(segmentLength, along - cursor);
        if (length >= 2) {
            segments.push({start: cursor, length});
        }
        cursor += length + crossAisle;
    }

    let offset = 0;
    let aisleIndex = 1;
    let rowIndex = 0;
    const rows: number[] = [];
    while (offset + rackDepth <= across) {
        rows.push(offset);
        const pairRoom = offset + rackDepth * 2 <= across;
        if (pairRoom && rowIndex % 2 === 0) {
            offset += rackDepth;
        } else {
            offset += rackDepth;
            if (offset + aisleWidth + rackDepth <= across) {
                elements.push(element("AISLE", aisleRect({x: 0, y: offset, width: along, height: aisleWidth}),
                    `${labels.aisle} ${aisleIndex}`));
                aisleIndex += 1;
            }
            offset += aisleWidth;
        }
        rowIndex += 1;
    }

    rows.forEach((rowOffset) => {
        segments.forEach((segment) => {
            if (elements.length >= MAX_GENERATED_ELEMENTS) {
                return;
            }
            const code = rackCode(rackCount);
            const placed = toWorld({x: segment.start, y: rowOffset, width: segment.length, height: rackDepth});
            const rack = element("RACK", placed.rect, code, placed.rotation);
            const slotCount = Math.max(1, Math.floor(segment.length / slotPitch));
            if (elements.length + slotCount + 1 > MAX_GENERATED_ELEMENTS) {
                return;
            }
            const slots = generateRackSlots(rack, slotCount, code, slotCapacity, elements);
            elements.push(rack, ...slots);
            rackCount += 1;
            locationCount += slots.length;
        });
    });

    return {elements, rackCount, locationCount};
};
