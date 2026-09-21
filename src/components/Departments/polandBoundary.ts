import Department from "../../class/depots/Department";
import {AreaPoint} from "./deliveryAreaGeometry";
import polandBoundary from "./data/poland-boundary.json";

export const countryBoundary: Array<[number, number]> = polandBoundary.coordinates.map(
    ([longitude, latitude]) => [longitude, latitude],
);

export const isInsidePoland = (point: AreaPoint) => {
    const x = point.longitude;
    const y = point.latitude;
    let inside = false;
    for (let index = 0, previous = countryBoundary.length - 1; index < countryBoundary.length; previous = index, index += 1) {
        const [firstX, firstY] = countryBoundary[index];
        const [secondX, secondY] = countryBoundary[previous];
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
