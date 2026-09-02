export type DepartmentRelation = {
    sourceDepartmentId: string;
    targetDepartmentId: string;
};

const compareDepartmentIds = (firstDepartmentId: string, secondDepartmentId: string) => {
    if (firstDepartmentId.length !== secondDepartmentId.length) {
        return firstDepartmentId.length - secondDepartmentId.length;
    }

    if (firstDepartmentId === secondDepartmentId) {
        return 0;
    }

    return firstDepartmentId < secondDepartmentId ? -1 : 1;
};

export const canonicalDepartmentRelation = (relation: DepartmentRelation): DepartmentRelation => {
    const sourceComesFirst = compareDepartmentIds(
        relation.sourceDepartmentId,
        relation.targetDepartmentId,
    ) <= 0;

    return sourceComesFirst ? relation : {
        sourceDepartmentId: relation.targetDepartmentId,
        targetDepartmentId: relation.sourceDepartmentId,
    };
};

export const departmentRelationPairKey = (relation: DepartmentRelation) => {
    const canonicalRelation = canonicalDepartmentRelation(relation);

    return `${canonicalRelation.sourceDepartmentId}:${canonicalRelation.targetDepartmentId}`;
};
