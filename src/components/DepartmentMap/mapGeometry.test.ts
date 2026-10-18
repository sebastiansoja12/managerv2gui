import {
    createElement,
    elementCenter,
    fitView,
    generateRackSlots,
    nextLocationCode,
    resizeFromCorner,
    rotatePoint,
    rackChildren,
    rotateAround,
    rotationFromPointer,
    screenToWorld,
    snap,
    validateLayout,
    zoomAt,
} from "./mapGeometry";
import {MapElementDto} from "./model/DepartmentMap";

const rack = (overrides: Partial<MapElementDto> = {}): MapElementDto => ({
    elementId: "rack-1", type: "RACK", label: "R1", x: 10, y: 10, width: 8, height: 1, rotation: 0,
    color: null, locationCode: null, capacity: null, ...overrides,
});

describe("mapGeometry", () => {
    it("snaps values to the grid", () => {
        expect(snap(1.26, 0.5)).toBe(1.5);
        expect(snap(1.24, 0.5)).toBe(1);
        expect(snap(1.2345, 0.5, false)).toBe(1.235);
    });

    it("keeps the opposite corner fixed while resizing a rotated element", () => {
        const element = rack({rotation: 90});
        const center = elementCenter(element);
        const anchorOffset = rotatePoint({x: -element.width / 2, y: -element.height / 2}, element.rotation);
        const anchor = {x: center.x + anchorOffset.x, y: center.y + anchorOffset.y};

        const resized = resizeFromCorner(element, {x: anchor.x - 2, y: anchor.y + 10});

        const resizedCenter = elementCenter(resized);
        const resizedAnchorOffset = rotatePoint({x: -resized.width / 2, y: -resized.height / 2}, resized.rotation);
        expect(resized.width).toBeCloseTo(10);
        expect(resized.height).toBeCloseTo(2);
        expect(resizedCenter.x + resizedAnchorOffset.x).toBeCloseTo(anchor.x);
        expect(resizedCenter.y + resizedAnchorOffset.y).toBeCloseTo(anchor.y);
    });

    it("rotates towards the pointer in fixed steps", () => {
        const element = rack({x: 0, y: 0, width: 2, height: 2});

        expect(rotationFromPointer(element, {x: 5, y: 1})).toBe(90);
        expect(rotationFromPointer(element, {x: 1, y: -5})).toBe(0);
    });

    it("generates storage locations along a rotated rack with unique codes", () => {
        const existing = [{...rack(), elementId: "slot", type: "STORAGE_LOCATION" as const, locationCode: "R1-01", capacity: 1}];

        const slots = generateRackSlots(rack({rotation: 90}), 4, "r1", 2, existing);

        expect(slots.map((slot) => slot.locationCode)).toEqual(["R1-02", "R1-03", "R1-04", "R1-05"]);
        expect(slots.every((slot) => slot.rotation === 90 && slot.capacity === 2 && slot.width === 1.72)).toBe(true);
        expect(elementCenter(slots[0]).x).toBeCloseTo(14);
        expect(elementCenter(slots[0]).y).toBeCloseTo(7.5);
        expect(elementCenter(slots[3]).y).toBeCloseTo(13.5);
    });

    it("reports duplicated codes and elements outside the map", () => {
        const first = createElement("STORAGE_LOCATION", 1, 1, []);
        const second = {...createElement("STORAGE_LOCATION", 60, 1, []), locationCode: first.locationCode};

        const problems = validateLayout([first, second], 20, 20);

        expect(problems).toEqual(expect.arrayContaining([
            {type: "duplicateCode", value: first.locationCode},
            {type: "outside", value: first.locationCode},
        ]));
    });

    it("proposes the next free location code", () => {
        expect(nextLocationCode([createElement("STORAGE_LOCATION", 1, 1, [])])).toBe("L-02");
    });

    it("keeps the world point under the cursor when zooming", () => {
        const view = fitView(50, 30, 1000, 600);
        const cursor = {x: 300, y: 200};
        const before = screenToWorld(cursor, view);

        const after = screenToWorld(cursor, zoomAt(view, cursor, 2));

        expect(after.x).toBeCloseTo(before.x);
        expect(after.y).toBeCloseTo(before.y);
    });

    it("finds storage locations placed on a rack and rotates them together with it", () => {
        const base = rack();
        const slots = generateRackSlots(base, 2, "R1", 1, []);
        const outside = {...slots[0], elementId: "outside", x: 30, y: 30};

        const children = rackChildren(base, [...slots, outside]);
        const rotated = rotateAround(children[0], elementCenter(base), 90);

        expect(children.map((child) => child.elementId)).toEqual(slots.map((slot) => slot.elementId));
        expect(rotated.rotation).toBe(90);
        expect(elementCenter(rotated).x).toBeCloseTo(14);
        expect(elementCenter(rotated).y).toBeCloseTo(8.5);
    });
});
