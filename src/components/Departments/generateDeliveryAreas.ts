import {intersection} from "polygon-clipping";
import Department from "../../class/depots/Department";
import {DeliveryArea} from "./deliveryAreaDraft";
import {AreaPoint, isValidArea} from "./deliveryAreaGeometry";
import polandBoundary from "./data/poland-boundary.json";

export type GeneratedDepartmentAreas = {
    departmentId: string;
    departmentCode: string;
    areas: DeliveryArea[];
};

const longitudeScale = Math.cos(52 * Math.PI / 180);
const countryRing: Array<[number, number]> = polandBoundary.coordinates.map(
    ([longitude, latitude]) => [longitude, latitude],
);

type Point = [number, number];

const clipByBisector = (cell: Point[], site: Point, other: Point): Point[] => {
    const dx = other[0] - site[0];
    const dy = other[1] - site[1];
    const threshold = (other[0] ** 2 + other[1] ** 2 - site[0] ** 2 - site[1] ** 2) / 2;
    const side = ([x, y]: Point) => dx * x + dy * y - threshold;
    const result: Point[] = [];
    for (let index = 0; index < cell.length; index += 1) {
        const start = cell[index];
        const end = cell[(index + 1) % cell.length];
        const startSide = side(start);
        const endSide = side(end);
        if (startSide <= 1e-12) result.push(start);
        if ((startSide < 0 && endSide > 0) || (startSide > 0 && endSide < 0)) {
            const fraction = startSide / (startSide - endSide);
            result.push([start[0] + fraction * (end[0] - start[0]),
                start[1] + fraction * (end[1] - start[1])]);
        }
    }
    return result;
};

export const isInsidePoland = (point: AreaPoint) => {
    const x = point.longitude;
    const y = point.latitude;
    let inside = false;
    for (let index = 0, previous = countryRing.length - 1; index < countryRing.length; previous = index, index += 1) {
        const [firstX, firstY] = countryRing[index];
        const [secondX, secondY] = countryRing[previous];
        const crossesLatitude = (firstY > y) !== (secondY > y);
        if (crossesLatitude && x < (secondX - firstX) * (y - firstY) / (secondY - firstY) + firstX) {
            inside = !inside;
        }
    }
    return inside;
};

export const isEligibleForAutomaticAreas = (department: Department) => {
    const latitude = department.coordinates?.latitude;
    const longitude = department.coordinates?.longitude;
    return department.status === "ACTIVE" && department.address?.countryCode === "PL"
        && Number.isFinite(latitude) && Number.isFinite(longitude)
        && isInsidePoland({latitude: latitude as number, longitude: longitude as number});
};

export const generateDeliveryAreas = (departments: Department[]): GeneratedDepartmentAreas[] => {
    if (departments.length === 0 || departments.some((department) => !isEligibleForAutomaticAreas(department))) {
        throw new Error("INVALID_DEPARTMENTS");
    }

    const positions: Point[] = departments.map((department) => [
        (department.coordinates as {longitude: number}).longitude * longitudeScale,
        (department.coordinates as {latitude: number}).latitude,
    ]);
    const coordinateKeys = new Set(positions.map(([x, y]) => `${x.toFixed(8)}:${y.toFixed(8)}`));
    if (coordinateKeys.size !== departments.length) {
        throw new Error("DUPLICATE_COORDINATES");
    }

    const xCoordinates = countryRing.map(([longitude]) => longitude * longitudeScale);
    const yCoordinates = countryRing.map(([, latitude]) => latitude);
    const left = Math.min(...xCoordinates) - 1;
    const bottom = Math.min(...yCoordinates) - 1;
    const right = Math.max(...xCoordinates) + 1;
    const top = Math.max(...yCoordinates) + 1;

    return departments.map((department, index) => {
        let cell: Point[] = [[left, bottom], [right, bottom], [right, top], [left, top]];
        positions.forEach((other, otherIndex) => {
            if (otherIndex !== index && cell.length > 0) {
                cell = clipByBisector(cell, positions[index], other);
            }
        });
        if (cell.length < 3) {
            throw new Error("EMPTY_CELL");
        }
        const cellRing: Point[] = cell.map(([x, y]) => [x / longitudeScale, y]);
        cellRing.push(cellRing[0]);
        const clipped = intersection([countryRing], [cellRing]);
        if (clipped.length === 0) {
            throw new Error("EMPTY_CELL");
        }
        const areas = clipped.map((rings, partIndex) => {
            const outerRing = rings[0];
            const points = outerRing.slice(0, -1).map(([longitude, latitude]) => ({latitude, longitude}));
            if (!isValidArea(points)) {
                throw new Error("INVALID_RESULT");
            }
            return {
                id: `automatic-${department.departmentId}-${partIndex + 1}`,
                name: `${department.departmentCode.value} · ${partIndex + 1}`,
                points,
            };
        });
        return {
            departmentId: String(department.departmentId),
            departmentCode: department.departmentCode.value,
            areas,
        };
    });
};

export const countryBoundary = countryRing;
