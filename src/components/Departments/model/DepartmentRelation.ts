export type DepartmentRelation = {
    sourceDepartmentId: number;
    targetDepartmentId: number;
};

export const departmentRelationKey = (relation: DepartmentRelation) => (
    `${relation.sourceDepartmentId}:${relation.targetDepartmentId}`
);
