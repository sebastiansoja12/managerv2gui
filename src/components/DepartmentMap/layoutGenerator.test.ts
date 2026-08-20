import {generateLayout, rackCode} from "./layoutGenerator";
import {elementCenter, validateLayout} from "./mapGeometry";

const labels = {hall: "Hala", inbound: "Przyjęcia", outbound: "Wydania", sorter: "Sorter", chute: "Zrzutnia",
    mainAisle: "Alejka główna", aisle: "Alejka"};

describe("layoutGenerator", () => {
    it.each([[60, 40], [120, 80], [30, 90], [15, 12]])("creates a valid layout for %i × %i m", (width, height) => {
        const layout = generateLayout({width, height, seed: 42, includeSorter: true, slotCapacity: 2, labels});

        expect(validateLayout(layout.elements, width, height)).toEqual([]);
        expect(layout.elements.every((element) => {
            const center = elementCenter(element);
            return center.x > 0 && center.y > 0 && center.x < width && center.y < height;
        })).toBe(true);
        const locations = layout.elements.filter((element) => element.type === "STORAGE_LOCATION");
        expect(locations).toHaveLength(layout.locationCount);
        expect(locations.every((location) => location.capacity === 2)).toBe(true);
        expect(new Set(layout.elements.map((element) => element.elementId)).size).toBe(layout.elements.length);
    });

    it("places walls, dock zones, a sorter with chutes and racks on a typical warehouse", () => {
        const layout = generateLayout({width: 60, height: 40, seed: 7, includeSorter: true, slotCapacity: 1, labels});
        const types = layout.elements.map((element) => element.type);

        expect(types.filter((type) => type === "WALL")).toHaveLength(4);
        expect(types.filter((type) => type === "ZONE")).toHaveLength(2);
        expect(layout.elements.filter((element) => element.type === "SORTER").length).toBeGreaterThan(1);
        expect(layout.rackCount).toBeGreaterThan(4);
        expect(layout.locationCount).toBeGreaterThan(40);
        expect(layout.elements.find((element) => element.label === "Sorter")).toBeDefined();
    });

    it("omits the sorter when not requested and is deterministic for a seed", () => {
        const first = generateLayout({width: 50, height: 30, seed: 99, includeSorter: false, slotCapacity: 1, labels});
        const second = generateLayout({width: 50, height: 30, seed: 99, includeSorter: false, slotCapacity: 1, labels});
        const strip = (layout: typeof first) => layout.elements.map(({elementId, ...rest}) => rest);

        expect(first.elements.some((element) => element.type === "SORTER")).toBe(false);
        expect(strip(first)).toEqual(strip(second));
    });

    it("keeps huge maps within the element limit", () => {
        const layout = generateLayout({width: 2000, height: 2000, seed: 3, includeSorter: true, slotCapacity: 1, labels});

        expect(layout.elements.length).toBeLessThanOrEqual(5000);
    });

    it("names racks with consecutive letters", () => {
        expect([0, 1, 25, 26, 27].map(rackCode)).toEqual(["A", "B", "Z", "AA", "AB"]);
    });
});
