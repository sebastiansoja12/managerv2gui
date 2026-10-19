export type DepartmentRelation = {
    sourceDepartmentId: string;
    targetDepartmentId: string;
    bidirectional?: boolean;
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
        ...relation,
        sourceDepartmentId: relation.targetDepartmentId,
        targetDepartmentId: relation.sourceDepartmentId,
    };
};

export const isOneWayRelation = (relation: DepartmentRelation) => relation.bidirectional === false;

export const nextRelationDirection = (relation: DepartmentRelation): DepartmentRelation => {
    if (!isOneWayRelation(relation)) {
        return {...relation, bidirectional: false};
    }
    const canonicalRelation = canonicalDepartmentRelation({...relation, bidirectional: true});
    if (canonicalRelation.sourceDepartmentId === relation.sourceDepartmentId) {
        return {
            sourceDepartmentId: relation.targetDepartmentId,
            targetDepartmentId: relation.sourceDepartmentId,
            bidirectional: false,
        };
    }
    return {...canonicalRelation, bidirectional: true};
};

export const departmentRelationPairKey = (relation: DepartmentRelation) => {
    const canonicalRelation = canonicalDepartmentRelation(relation);

    return `${canonicalRelation.sourceDepartmentId}:${canonicalRelation.targetDepartmentId}`;
};
