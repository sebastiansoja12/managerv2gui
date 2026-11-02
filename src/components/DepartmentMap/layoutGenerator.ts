import {createElementId, DEFAULT_ELEMENT_COLOR} from "./mapGeometry";
import {MapElementDto, MapElementType} from "./model/DepartmentMap";

export type LayoutGeneratorLabels = {
    hall: string;
    inbound: string;
    inboundRamp: string;
    infeed: string;
    workstation: string;
    sorter: string;
    chute: string;
};

export type LayoutGeneratorOptions = {
    width: number;
    height: number;
    directionCodes: string[];
    labels: LayoutGeneratorLabels;
};

export type GeneratedLayout = {
    elements: MapElementDto[];
    rampCount: number;
    inboundRampCount: number;
    workstationCount: number;
};

type Rect = {x: number; y: number; width: number; height: number};

const WALL_THICKNESS = 0.25;
const SORTER_WIDTH = 1.2;
const INFEED_WIDTH = 1;
const RAMP_DEPTH = 2.5;
const RAMP_WIDTH = 3.5;
const INBOUND_PITCH = 5;
const MAX_INBOUND_RAMPS = 4;
const MAX_CHUTE_WIDTH = 1.2;
const WORKSTATION_SIZE = 1.2;
const MIN_CHUTE_LENGTH = 0.5;

const round = (value: number) => Math.round(value * 100) / 100;

const element = (type: MapElementType, rect: Rect, label: string | null = null, rotation = 0,
                 destinationDepartmentCode: string | null = null): MapElementDto => ({
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
    destinationDepartmentCode,
});

const centered = (centerX: number, centerY: number, width: number, height: number): Rect => ({
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
});

const verticalBelt = (type: MapElementType, centerX: number, fromY: number, toY: number, thickness: number,
                      label: string, destinationDepartmentCode: string | null = null) =>
    element(type, centered(centerX, (fromY + toY) / 2, Math.abs(toY - fromY), thickness), label,
        toY > fromY ? 90 : 270, destinationDepartmentCode);

const wallRamp = (type: MapElementType, centerX: number, wallY: number, top: boolean, width: number, label: string,
                  destinationDepartmentCode: string | null = null) =>
    element(type, centered(centerX, top ? wallY + RAMP_DEPTH / 2 - 0.5 : wallY - RAMP_DEPTH / 2 + 0.5, width,
        RAMP_DEPTH + 1), label, top ? 180 : 0, destinationDepartmentCode);

export const generateLayout = ({width, height, directionCodes, labels}: LayoutGeneratorOptions): GeneratedLayout => {
    const elements: MapElementDto[] = [];

    const room: Rect = {x: 0.5, y: 0.5, width: width - 1, height: height - 1};
    elements.push(element("ROOM", room, labels.hall));
    elements.push(element("WALL", {x: room.x, y: room.y, width: room.width, height: WALL_THICKNESS}));
    elements.push(element("WALL", {x: room.x, y: room.y + room.height - WALL_THICKNESS, width: room.width, height: WALL_THICKNESS}));
    elements.push(element("WALL", {x: room.x, y: room.y, width: WALL_THICKNESS, height: room.height}));
    elements.push(element("WALL", {x: room.x + room.width - WALL_THICKNESS, y: room.y, width: WALL_THICKNESS, height: room.height}));

    const inner: Rect = {x: room.x + 1, y: room.y + 1, width: room.width - 2, height: room.height - 2};
    const top = inner.y;
    const bottom = inner.y + inner.height;
    const sorterY = inner.y + inner.height / 2;
    const sorterTop = sorterY - SORTER_WIDTH / 2;
    const sorterBottom = sorterY + SORTER_WIDTH / 2;
    const chuteGap = sorterTop - (top + RAMP_DEPTH);
    if (inner.width < 6 || chuteGap < MIN_CHUTE_LENGTH) {
        return {elements, rampCount: 0, inboundRampCount: 0, workstationCount: 0};
    }

    const inboundRampCount = Math.max(1, Math.min(MAX_INBOUND_RAMPS, Math.floor(inner.width * 0.3 / INBOUND_PITCH)));
    const inboundWidth = Math.max(6, inboundRampCount * INBOUND_PITCH + 1);
    elements.push(element("INBOUND", {x: inner.x, y: room.y, width: inboundWidth, height: sorterTop - room.y},
        labels.inbound));
    elements.push(element("SORTER", {x: inner.x, y: sorterTop, width: inner.width, height: SORTER_WIDTH},
        labels.sorter));

    let workstationCount = 0;
    const stationY = Math.max(top + RAMP_DEPTH + WORKSTATION_SIZE / 2, sorterTop - WORKSTATION_SIZE / 2 - 0.5);
    for (let index = 0; index < inboundRampCount; index += 1) {
        const centerX = inner.x + 0.5 + INBOUND_PITCH * (index + 0.5);
        elements.push(wallRamp("INBOUND_RAMP", centerX, top, true, RAMP_WIDTH, `${labels.inboundRamp} ${index + 1}`));
        elements.push(verticalBelt("SORTER", centerX, top + RAMP_DEPTH, sorterTop, INFEED_WIDTH,
            `${labels.infeed} ${index + 1}`));
        [-1, 1].forEach((side) => {
            workstationCount += 1;
            elements.push(element("WORKSTATION", centered(centerX + side * (INFEED_WIDTH / 2 + 0.3 + WORKSTATION_SIZE / 2),
                stationY, WORKSTATION_SIZE, WORKSTATION_SIZE), `${labels.workstation} ${workstationCount}`));
        });
    }

    const dispatchStart = inner.x + inboundWidth + 0.5;
    const dispatchEnd = inner.x + inner.width;
    const bottomCount = Math.ceil(directionCodes.length / 2);
    const placeSide = (codes: string[], atTop: boolean) => {
        const slot = (dispatchEnd - dispatchStart) / Math.max(1, codes.length);
        const rampWidth = Math.min(RAMP_WIDTH + 0.5, slot * 0.85);
        const chuteWidth = Math.min(MAX_CHUTE_WIDTH, slot * 0.6);
        codes.forEach((code, index) => {
            const centerX = dispatchStart + slot * (index + 0.5);
            elements.push(atTop
                ? verticalBelt("CHUTE", centerX, sorterTop, top + RAMP_DEPTH, chuteWidth, `${labels.chute} ${code}`, code)
                : verticalBelt("CHUTE", centerX, sorterBottom, bottom - RAMP_DEPTH, chuteWidth, `${labels.chute} ${code}`,
                    code));
            elements.push(wallRamp("RAMP", centerX, atTop ? top : bottom, atTop, rampWidth, code, code));
        });
    };
    placeSide(directionCodes.slice(0, bottomCount), false);
    placeSide(directionCodes.slice(bottomCount), true);

    return {elements, rampCount: directionCodes.length, inboundRampCount, workstationCount};
};
