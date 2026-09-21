import React, {useState} from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import Department from "../../class/depots/Department";
import pl from "../../i18n/translate";
import DepartmentPicker from "./DepartmentPicker";

const department = (departmentId: number, code: string, city: string, departmentType = "BRANCH") => ({
    departmentId,
    departmentCode: {value: code},
    address: {city, street: "Street", postalCode: "00-001", countryCode: "PL"},
    departmentType,
    status: "ACTIVE",
} as unknown as Department);

const departments = [
    department(1, "KT1", "Gliwice"),
    department(2, "GDP", "Gdańsk"),
    department(3, "NCS", "Łódź", "SORTING_FACILITY"),
];

const Harness = ({disabledIds}: {disabledIds?: Set<string>}) => {
    const [value, setValue] = useState("");
    return (
        <>
            <DepartmentPicker departments={departments} disabledDepartmentIds={disabledIds} label="Department"
                              value={value} onChange={setValue} />
            <output data-testid="selected">{value}</output>
        </>
    );
};

describe("DepartmentPicker", () => {
    it("filters departments by city without diacritics and selects with the keyboard", () => {
        render(<Harness />);
        const input = screen.getByRole("combobox", {name: "Department"});

        fireEvent.focus(input);
        fireEvent.change(input, {target: {value: "gdans"}});

        expect(screen.getAllByRole("option")).toHaveLength(1);
        fireEvent.keyDown(input, {key: "Enter"});
        expect(screen.getByTestId("selected")).toHaveTextContent("2");
        expect(input).toHaveValue("GDP · Gdańsk");
    });

    it("matches sorting facilities by translated type and skips disabled departments", () => {
        render(<Harness disabledIds={new Set(["3"])} />);
        const input = screen.getByRole("combobox", {name: "Department"});

        fireEvent.focus(input);
        fireEvent.change(input, {target: {value: pl.departments.type.SORTING_FACILITY}});
        fireEvent.mouseDown(screen.getByRole("option", {name: /NCS/}));

        expect(screen.getByTestId("selected")).toBeEmptyDOMElement();
    });

    it("shows an empty state when nothing matches", () => {
        render(<Harness />);
        const input = screen.getByRole("combobox", {name: "Department"});

        fireEvent.focus(input);
        fireEvent.change(input, {target: {value: "xyz"}});

        expect(screen.getByText(pl.departments.picker.noResults)).toBeInTheDocument();
    });
});
