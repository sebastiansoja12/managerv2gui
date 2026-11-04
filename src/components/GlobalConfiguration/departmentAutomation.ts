import Department from "../../class/depots/Department";
import DeliveryAreaService from "../../hooks/DeliveryAreaService";
import {notifyDeliveryAreasChanged} from "../Departments/model/DeliveryArea";
import {isEligibleForAutomaticAreas} from "../Departments/polandBoundary";
import {DepartmentConfiguration} from "./model/DepartmentConfiguration";

export type DepartmentAutomationResult = {
    assignedAreas: number;
};

export const applyDepartmentAutomations = async (
    configuration: DepartmentConfiguration,
    departments: Department[],
): Promise<DepartmentAutomationResult> => {
    const eligible = configuration.autoAssignDeliveryAreas
        ? departments.filter(isEligibleForAutomaticAreas) : [];
    if (eligible.length === 0) {
        return {assignedAreas: 0};
    }
    const assignedAreas = ((await DeliveryAreaService.applyAutomatic(
        eligible.map((department) => department.departmentId))).data || []).length;
    notifyDeliveryAreasChanged();
    return {assignedAreas};
};
