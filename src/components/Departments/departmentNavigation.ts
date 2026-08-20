import pl from "../../i18n/translate";
import Department from "../../class/depots/Department";
import {AppTabDefinition} from "../AppShell/types";

export const departmentDetailsPath = (departmentId: number | string) =>
    `/departments/${encodeURIComponent(String(departmentId))}`;

export const departmentDetailsTab = (department: Pick<Department, "departmentId" | "departmentCode">): AppTabDefinition => ({
    label: `${pl.departments.view.tabTitle} ${department.departmentCode?.value || department.departmentId}`,
    path: departmentDetailsPath(department.departmentId),
});
