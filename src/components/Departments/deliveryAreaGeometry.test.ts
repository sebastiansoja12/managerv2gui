import {AreaPoint, insertionIndex, isValidArea} from "./deliveryAreaGeometry";

const point = (latitude: number, longitude: number): AreaPoint => ({latitude, longitude});

describe("delivery area geometry", () => {
    it("accepts a closed boundary represented by three or more distinct vertices", () => {
        expect(isValidArea([point(50, 19), point(50, 20), point(51, 20)])).toBe(true);
    });

    it("rejects self-intersections and repeated vertices", () => {
        expect(isValidArea([
            point(50, 19), point(51, 20), point(50, 20), point(51, 19),
        ])).toBe(false);
        expect(isValidArea([
            point(50, 19), point(50, 20), point(51, 20), point(50, 20),
        ])).toBe(false);
    });

    it("inserts a new point after the closest edge", () => {
        const boundary = [point(50, 19), point(50, 20), point(51, 20), point(51, 19)];

        expect(insertionIndex(boundary, point(50.01, 19.5))).toBe(1);
        expect(insertionIndex(boundary, point(50.5, 19.01))).toBe(4);
    });
});
