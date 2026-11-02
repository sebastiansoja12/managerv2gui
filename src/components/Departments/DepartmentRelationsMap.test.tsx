import React, {useState} from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import Department from "../../class/depots/Department";
import pl from "../../i18n/translate";
import DepartmentRelationsMap, {
    getDepartmentsMissingSortingRelation,
    getRelationsWithAutomaticSortingAssignments,
    getUniqueDepartmentRelations,
    spreadOverlappingDepartments,
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

    it("spreads departments with identical coordinates so each marker stays clickable", () => {
        const [first, second, third] = spreadOverlappingDepartments([
            {department: departments[0], position: [54.35, 18.65]},
            {department: departments[1], position: [54.35, 18.65]},
            {department: departments[2], position: [50.06, 19.94]},
        ]);

        expect(first.position).not.toEqual(second.position);
        expect(Math.abs(first.position[0] - 54.35)).toBeLessThan(0.02);
        expect(third.position).toEqual([50.06, 19.94]);
    });

    it("collapses opposite directions into one bidirectional relation", () => {
        expect(getUniqueDepartmentRelations([
            {sourceDepartmentId: "1", targetDepartmentId: "2"},
            {sourceDepartmentId: "2", targetDepartmentId: "1"},
        ])).toEqual([{sourceDepartmentId: "1", targetDepartmentId: "2"}]);
    });

    it("automatically connects missing departments to their nearest active sorting facility", () => {
        const locatedDepartments = [
            {...department(1, "WAW01"), coordinates: {latitude: 52.23, longitude: 21.01}},
            {...department(2, "SORT-WAW", "SORTING_FACILITY"), coordinates: {latitude: 52.25, longitude: 21.02}},
            {...department(3, "KRK01"), coordinates: {latitude: 50.06, longitude: 19.94}},
            {...department(4, "SORT-KRK", "SORTING_FACILITY"), coordinates: {latitude: 50.08, longitude: 19.96}},
        ];
        const existingRelations = [{sourceDepartmentId: "1", targetDepartmentId: "2"}];

        expect(getRelationsWithAutomaticSortingAssignments(locatedDepartments, existingRelations)).toEqual([
            ...existingRelations,
            {sourceDepartmentId: "3", targetDepartmentId: "4"},
        ]);
    });

    it("offers automatic assignment in the editor and stages the generated relations", () => {
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

        fireEvent.click(screen.getByRole("button", {
            name: pl.departments.relations.automaticAction.replace("{count}", "2"),
        }));

        expect(screen.getByText(pl.departments.relations.validationSuccess)).toBeInTheDocument();
        expect(screen.getByText("2", {selector: ".department-relations-list-heading span"})).toBeInTheDocument();
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

        const chooseDepartment = (label: string, query: string, code: string) => {
            const input = screen.getByRole("combobox", {name: label});
            fireEvent.focus(input);
            fireEvent.change(input, {target: {value: query}});
            fireEvent.mouseDown(screen.getByRole("option", {name: new RegExp(`^${code}`)}));
        };

        chooseDepartment(pl.departments.relations.source, "waw", "WAW01");
        chooseDepartment(pl.departments.relations.target, "sort", "SORT01");
        fireEvent.click(screen.getByRole("button", {name: pl.departments.relations.addRelation}));

        expect(screen.getByRole("status")).toHaveTextContent(
            pl.departments.relations.relationAdded.replace("{relation}", "WAW01 ↔ SORT01"),
        );

        expect(screen.getByRole("button", {name: removeRelationLabel})).toBeInTheDocument();
        expect(screen.getByText("↔")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", {name: removeRelationLabel}));

        expect(screen.getByText(pl.departments.relations.emptyRelations)).toBeInTheDocument();
    });
});
