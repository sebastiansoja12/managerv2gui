import Department from "../../../class/depots/Department";
import {valueObjectValue} from "../../../utils/valueObject";
import {ShipmentRoute, ShipmentRouteDepartment} from "./ShipmentRoute";

export type RouteRole = "origin" | "transfer" | "destination";

export type ShipmentRouteStop = {
    role: RouteRole;
    routeDepartment: ShipmentRouteDepartment;
    department?: Department;
    position: [number, number] | null;
    distanceFromPreviousInKilometers: number | null;
};

const EARTH_RADIUS_IN_KILOMETERS = 6371;

const toRadians = (degrees: number) => degrees * Math.PI / 180;

export const distanceInKilometers = ([firstLatitude, firstLongitude]: [number, number],
                                     [secondLatitude, secondLongitude]: [number, number]) => {
    const latitudeDelta = toRadians(secondLatitude - firstLatitude);
    const longitudeDelta = toRadians(secondLongitude - firstLongitude);
    const haversine = Math.sin(latitudeDelta / 2) ** 2
        + Math.cos(toRadians(firstLatitude)) * Math.cos(toRadians(secondLatitude)) * Math.sin(longitudeDelta / 2) ** 2;
    return 2 * EARTH_RADIUS_IN_KILOMETERS * Math.asin(Math.sqrt(haversine));
};

const departmentPosition = (department?: Department): [number, number] | null => {
    const latitude = department?.coordinates?.latitude;
    const longitude = department?.coordinates?.longitude;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
    }
    return [latitude as number, longitude as number];
};

const resolveRole = (index: number, stopsCount: number): RouteRole => {
    if (index === stopsCount - 1 && stopsCount > 1) {
        return "destination";
    }
    return index === 0 ? "origin" : "transfer";
};

export const buildShipmentRouteStops = (route: ShipmentRoute, departments: Department[]): ShipmentRouteStop[] => {
    const departmentsByCode = new Map(departments.map((department) => [
        valueObjectValue(department.departmentCode).toUpperCase(),
        department,
    ]));

    return route.departments.reduce<ShipmentRouteStop[]>((stops, routeDepartment, index) => {
        const department = departmentsByCode.get(routeDepartment.departmentCode.toUpperCase());
        const position = departmentPosition(department);
        const previousPosition = stops[index - 1]?.position ?? null;
        stops.push({
            role: resolveRole(index, route.departments.length),
            routeDepartment,
            department,
            position,
            distanceFromPreviousInKilometers: position && previousPosition
                ? distanceInKilometers(previousPosition, position)
                : null,
        });
        return stops;
    }, []);
};
