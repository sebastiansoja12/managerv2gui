import Department from "../../class/depots/Department";
import {getDepartmentNetwork} from "./DepartmentNetworkMap";

const department = (departmentId: number, code: string) => ({
    departmentId,
    departmentCode: {value: code},
} as Department);

test("selects only direct connections of the logged-in user's department", () => {
    const departments = [
        department(1, "WAW-01"),
        department(2, "GDA-01"),
        department(3, "POZ-01"),
        department(4, "KRK-01"),
    ];
    const network = getDepartmentNetwork("GDA-01", departments, [
        {sourceDepartmentId: "1", targetDepartmentId: "2"},
        {sourceDepartmentId: "2", targetDepartmentId: "3"},
        {sourceDepartmentId: "3", targetDepartmentId: "4"},
    ]);

    expect(network.currentDepartment?.departmentId).toBe(2);
    expect(network.linkedDepartments.map((item) => item.departmentId)).toEqual([1, 3]);
    expect(network.relations).toHaveLength(2);
});
