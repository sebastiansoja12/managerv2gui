import Department from "../../class/depots/Department";
import DeliveryAreaService from "../../hooks/DeliveryAreaService";
import DeliveryNetworkService from "../../hooks/DeliveryNetworkService";
import {notifyDeliveryAreasChanged} from "../Departments/model/DeliveryArea";
import {departmentRelationPairKey} from "../Departments/model/DepartmentRelation";
import {isEligibleForAutomaticAreas} from "../Departments/polandBoundary";
import {DepartmentConfiguration} from "./model/DepartmentConfiguration";

export type DepartmentAutomationResult = {
    assignedAreas: number;
    createdConnections: number;
    connectionSkipped: boolean;
};

export const applyDepartmentAutomations = async (
    configuration: DepartmentConfiguration,
    departments: Department[],
    newDepartmentCode?: string,
): Promise<DepartmentAutomationResult> => {
    const eligible = configuration.autoAssignDeliveryAreas
        ? departments.filter(isEligibleForAutomaticAreas) : [];
    let assignedAreas = 0;
    let createdConnections = 0;
    let connectionSkipped = false;

    if (eligible.length > 0) {
        assignedAreas = ((await DeliveryAreaService.applyAutomatic(
            eligible.map((department) => department.departmentId))).data || []).length;
        notifyDeliveryAreasChanged();
    }

    if (configuration.autoConnectDepartments && newDepartmentCode) {
        const created = departments.find((department) => department.departmentCode.value === newDepartmentCode);
        const candidates = departments.filter((department) => department.departmentType === "SORTING_FACILITY"
            && department.status === "ACTIVE" && department.departmentCode.value !== newDepartmentCode);
        const latitude = created?.coordinates?.latitude;
        const longitude = created?.coordinates?.longitude;
        const withDistance = candidates.map((candidate) => {
            const targetLatitude = candidate.coordinates?.latitude;
            const targetLongitude = candidate.coordinates?.longitude;
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
                || !Number.isFinite(targetLatitude) || !Number.isFinite(targetLongitude)) {
                return {candidate, distance: Number.POSITIVE_INFINITY};
            }
            const horizontal = ((targetLongitude as number) - (longitude as number))
                * Math.cos(((targetLatitude as number) + (latitude as number)) * Math.PI / 360);
            const vertical = (targetLatitude as number) - (latitude as number);
            return {candidate, distance: horizontal * horizontal + vertical * vertical};
        }).sort((first, second) => first.distance - second.distance);
        const nearest = withDistance[0];
        if (created && nearest && Number.isFinite(nearest.distance)) {
            const current = (await DeliveryNetworkService.getCurrentNetwork()).data;
            const relation = {
                sourceDepartmentId: String(created.departmentId),
                targetDepartmentId: String(nearest.candidate.departmentId),
            };
            if (!current.some((item) => departmentRelationPairKey(item) === departmentRelationPairKey(relation))) {
                await DeliveryNetworkService.replaceCurrentNetwork([...current, relation]);
                createdConnections = 1;
            }
        } else {
            connectionSkipped = true;
        }
    }

    return {assignedAreas, createdConnections, connectionSkipped};
};
