import Department from "../../class/depots/Department";
import DeliveryNetworkService from "../../hooks/DeliveryNetworkService";
import {departmentRelationPairKey} from "../Departments/model/DepartmentRelation";
import {storageKeyFor, writeAreas} from "../Departments/deliveryAreaDraft";
import {generateDeliveryAreas, isEligibleForAutomaticAreas} from "../Departments/generateDeliveryAreas";
import {DepartmentConfiguration} from "./model/DepartmentConfiguration";

export type DepartmentAutomationResult = {
    assignedAreas: number;
    createdConnections: number;
    connectionSkipped: boolean;
};

export const applyDepartmentAutomations = async (
    configuration: DepartmentConfiguration,
    departments: Department[],
    operatorId?: number,
    newDepartmentCode?: string,
): Promise<DepartmentAutomationResult> => {
    const eligible = configuration.autoAssignDeliveryAreas
        ? departments.filter(isEligibleForAutomaticAreas) : [];
    const generated = eligible.length > 0 ? generateDeliveryAreas(eligible) : [];
    let previousDrafts: Array<{key: string; value: string | null}> = [];
    let createdConnections = 0;
    let connectionSkipped = false;

    try {
        previousDrafts = generated.map(({departmentId}) => {
            const key = storageKeyFor(operatorId, departmentId);
            return {key, value: window.localStorage.getItem(key)};
        });
        generated.forEach(({departmentId, areas}) => writeAreas(storageKeyFor(operatorId, departmentId), areas));

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
    } catch (error) {
        previousDrafts.forEach(({key, value}) => {
            try {
                if (value === null) window.localStorage.removeItem(key);
                else window.localStorage.setItem(key, value);
            } catch { /* Storage can be unavailable after a quota error. */ }
        });
        throw error;
    }

    return {assignedAreas: generated.length, createdConnections, connectionSkipped};
};
