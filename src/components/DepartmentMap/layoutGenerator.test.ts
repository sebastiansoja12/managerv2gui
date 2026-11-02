import {generateLayout} from "./layoutGenerator";
import {elementCenter, validateLayout} from "./mapGeometry";

const labels = {hall: "Hala", inbound: "Przyjęcie", inboundRamp: "Rampa przyjęć", infeed: "Wjazd",
    workstation: "Stanowisko", sorter: "Sorter", chute: "Zrzutnia"};
const directionCodes = ["KT1", "PO1", "WA1"];

describe("layoutGenerator", () => {
    it.each([[60, 40], [120, 80], [30, 90], [15, 12]])("creates a valid layout for %i × %i m", (width, height) => {
        const layout = generateLayout({width, height, directionCodes, labels});

        expect(validateLayout(layout.elements, width, height, directionCodes)).toEqual([]);
        expect(layout.elements.every((element) => {
            const center = elementCenter(element);
            return center.x > 0 && center.y > 0 && center.x < width && center.y < height;
        })).toBe(true);
        expect(new Set(layout.elements.map((element) => element.elementId)).size).toBe(layout.elements.length);
    });

    it("does not generate pallet storage", () => {
        const layout = generateLayout({width: 80, height: 50, directionCodes, labels});

        expect(layout.elements.some((element) => element.type === "RACK" || element.type === "STORAGE_LOCATION"))
            .toBe(false);
    });

    it("runs the sorter through the whole hall and feeds it from inbound ramps with workstations", () => {
        const layout = generateLayout({width: 60, height: 40, directionCodes, labels});
        const mainSorter = layout.elements.find((element) => element.label === "Sorter");
        const inboundRamps = layout.elements.filter((element) => element.type === "INBOUND_RAMP");
        const infeeds = layout.elements.filter((element) => element.type === "SORTER" && element !== mainSorter);
        const inbound = layout.elements.find((element) => element.type === "INBOUND");

        expect(mainSorter?.width).toBeCloseTo(60 - 3);
        expect(inboundRamps).toHaveLength(layout.inboundRampCount);
        expect(infeeds).toHaveLength(inboundRamps.length);
        expect(layout.elements.filter((element) => element.type === "WORKSTATION")).toHaveLength(layout.workstationCount);
        expect(layout.workstationCount).toBe(inboundRamps.length * 2);
        inboundRamps.forEach((ramp, index) => {
            expect(elementCenter(infeeds[index]).x).toBeCloseTo(elementCenter(ramp).x, 1);
            expect(elementCenter(ramp).x).toBeLessThan((inbound?.x || 0) + (inbound?.width || 0));
        });
    });

    it("drops parcels from the sorter through chutes to a ramp for every connected department", () => {
        const layout = generateLayout({width: 60, height: 40, directionCodes, labels});
        const inbound = layout.elements.find((element) => element.type === "INBOUND");
        const chutes = layout.elements.filter((element) => element.type === "CHUTE");
        const ramps = layout.elements.filter((element) => element.type === "RAMP");

        expect(chutes.map((chute) => chute.destinationDepartmentCode)).toEqual(directionCodes);
        expect(ramps.map((ramp) => ramp.label)).toEqual(directionCodes);
        expect(layout.rampCount).toBe(3);
        chutes.forEach((chute, index) => {
            expect(elementCenter(chute).x).toBeCloseTo(elementCenter(ramps[index]).x, 1);
            expect(elementCenter(chute).x).toBeGreaterThan((inbound?.x || 0) + (inbound?.width || 0));
        });
        expect(new Set(ramps.map((ramp) => elementCenter(ramp).y > 20)).size).toBe(2);
    });

    it("builds the inbound and sorter without outbound ramps when the department has no connections", () => {
        const layout = generateLayout({width: 60, height: 40, directionCodes: [], labels});

        expect(layout.rampCount).toBe(0);
        expect(layout.elements.some((element) => element.type === "INBOUND_RAMP")).toBe(true);
        expect(layout.elements.some((element) => element.type === "RAMP" || element.type === "CHUTE")).toBe(false);
    });

    it("keeps huge maps within the element limit", () => {
        const layout = generateLayout({width: 2000, height: 2000, directionCodes, labels});

        expect(layout.elements.length).toBeLessThanOrEqual(5000);
    });
});
