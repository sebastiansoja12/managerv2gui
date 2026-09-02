import React, {useState} from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import Department from "../../class/depots/Department";
import pl from "../../i18n/translate";
import DepartmentRelationsMap, {
    getDepartmentsMissingSortingRelation,
    getUniqueDepartmentRelations,
} from "./DepartmentRelationsMap";
import {DepartmentRelation} from "./model/DepartmentRelation";

const department = (departmentId: number, code: string, departmentType = "BRANCH"): Department => ({
    departmentId,
    departmentCode: {value: code},
    address: {
        city: `City ${departmentId}`,
        street: `Street ${departmentId}`,
        postalCode: "00-001",
        countryCode: "PL",
    },
    coordinates: null,
    taxId: "",
    telephoneNumber: "",
    openingHours: "",
    email: "",
    departmentType,
    status: "ACTIVE",
    createdAt: "",
    updatedAt: "",
});

const departments = [
    department(1, "WAW01"),
    department(2, "SORT01", "SORTING_FACILITY"),
    department(3, "KRK01"),
];

describe("DepartmentRelationsMap", () => {
    it("finds active non-sorting departments without a relation to a sorting facility", () => {
        const relations: DepartmentRelation[] = [{
            sourceDepartmentId: "2",
            targetDepartmentId: "1",
        }];

        expect(getDepartmentsMissingSortingRelation(departments, relations).map((item) => item.departmentId))
            .toEqual([3]);
    });

    it("ignores relations to archived sorting facilities", () => {
        const archivedSortingFacility = {...departments[1], status: "ARCHIVED"};

        expect(getDepartmentsMissingSortingRelation(
            [departments[0], archivedSortingFacility],
            [{sourceDepartmentId: "1", targetDepartmentId: "2"}],
        ).map((item) => item.departmentId)).toEqual([1]);
    });

    it("collapses opposite directions into one bidirectional relation", () => {
        expect(getUniqueDepartmentRelations([
            {sourceDepartmentId: "1", targetDepartmentId: "2"},
            {sourceDepartmentId: "2", targetDepartmentId: "1"},
        ])).toEqual([{sourceDepartmentId: "1", targetDepartmentId: "2"}]);
    });

    it("creates and removes one bidirectional relation with the accessible form", () => {
        const Harness = () => {
            const [relations, setRelations] = useState<DepartmentRelation[]>([]);
            return (
                <DepartmentRelationsMap
                    departments={departments}
                    relations={relations}
                    onRelationsChange={setRelations}
                />
            );
        };

        render(<Harness />);

        const removeRelationLabel = pl.departments.relations.removeRelation.replace(
            "{relation}",
            "WAW01 ↔ SORT01",
        );

        fireEvent.change(screen.getByLabelText(pl.departments.relations.source), {target: {value: "1"}});
        fireEvent.change(screen.getByLabelText(pl.departments.relations.target), {target: {value: "2"}});
        fireEvent.click(screen.getByRole("button", {name: pl.departments.relations.addRelation}));

        expect(screen.getByRole("button", {name: removeRelationLabel})).toBeInTheDocument();
        expect(screen.getByText("↔")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", {name: removeRelationLabel}));

        expect(screen.getByText(pl.departments.relations.emptyRelations)).toBeInTheDocument();
    });
});
