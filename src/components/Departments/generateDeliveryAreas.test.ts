import Department from "../../class/depots/Department";
import {countryBoundary, generateDeliveryAreas, isInsidePoland} from "./generateDeliveryAreas";
import {AreaPoint} from "./deliveryAreaGeometry";

const department = (departmentId: number, code: string, latitude: number, longitude: number): Department => ({
    departmentId,
    departmentCode: {value: code},
    address: {city: code, street: "", postalCode: "", countryCode: "PL"},
    coordinates: {latitude, longitude},
    status: "ACTIVE",
    taxId: "", telephoneNumber: "", openingHours: "", email: "", departmentType: "",
    createdAt: "", updatedAt: "",
});

const areaSize = (points: AreaPoint[]) => Math.abs(points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point.longitude * next.latitude - next.longitude * point.latitude;
}, 0) / 2);

const contains = (point: AreaPoint, polygon: AreaPoint[]) => {
    let inside = false;
    for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
        const first = polygon[index];
        const second = polygon[previous];
        if ((first.latitude > point.latitude) !== (second.latitude > point.latitude)
            && point.longitude < (second.longitude - first.longitude) * (point.latitude - first.latitude)
            / (second.latitude - first.latitude) + first.longitude) inside = !inside;
    }
    return inside;
};

describe("generateDeliveryAreas", () => {
    it("assigns the whole country to one department", () => {
        const generated = generateDeliveryAreas([department(1, "WAW", 52.23, 21.01)]);
        expect(generated).toHaveLength(1);
        expect(generated[0].areas.length).toBeGreaterThan(0);
        expect(generated[0].areas.flatMap((area) => area.points).length).toBeGreaterThan(100);
    });

    it("splits Poland between departments without gaps in the sampled interior", () => {
        const generated = generateDeliveryAreas([
            department(1, "SZC", 53.43, 14.55),
            department(2, "WAW", 52.23, 21.01),
            department(3, "KRK", 50.06, 19.94),
        ]);
        expect(generated).toHaveLength(3);
        const countryPoints = countryBoundary.slice(0, -1).map(([longitude, latitude]) => ({latitude, longitude}));
        const totalArea = generated.flatMap((branch) => branch.areas).reduce((sum, area) => sum + areaSize(area.points), 0);
        expect(totalArea).toBeCloseTo(areaSize(countryPoints), 4);

        for (let latitude = 49.25; latitude < 55; latitude += 0.25) {
            for (let longitude = 14.25; longitude < 24; longitude += 0.25) {
                const point = {latitude, longitude};
                if (!isInsidePoland(point)) continue;
                const owners = generated.flatMap((branch) => branch.areas)
                    .filter((area) => contains(point, area.points));
                expect(owners).toHaveLength(1);
            }
        }
    });

    it("rejects departments at identical locations", () => {
        expect(() => generateDeliveryAreas([
            department(1, "A", 52, 21), department(2, "B", 52, 21),
        ])).toThrow("DUPLICATE_COORDINATES");
    });
});
