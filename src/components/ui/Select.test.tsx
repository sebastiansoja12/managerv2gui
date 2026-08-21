import {fireEvent, render, screen} from "@testing-library/react";
import React from "react";
import {MenuItem, TextField} from "./index";

describe("technical select", () => {
    it("opens a custom option panel and reports the selected value", () => {
        const handleChange = jest.fn();

        render(
            <TextField label="Provider" select value="first" onChange={handleChange}>
                <MenuItem value="first">First provider</MenuItem>
                <MenuItem value="second">Second provider</MenuItem>
            </TextField>,
        );

        fireEvent.click(screen.getByRole("combobox", {name: "Provider"}));
        expect(screen.getByRole("listbox")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("option", {name: "Second provider"}));
        expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
            target: expect.objectContaining({value: "second"}),
        }));
    });

    it("stays open while its long option list scrolls", () => {
        render(
            <TextField label="Country" select value="PL" onChange={jest.fn()}>
                {Array.from({length: 50}, (_, index) => (
                    <MenuItem key={index} value={index === 35 ? "PL" : `C${index}`}>
                        {index === 35 ? "PL" : `C${index}`}
                    </MenuItem>
                ))}
            </TextField>,
        );

        fireEvent.click(screen.getByRole("combobox", {name: "Country"}));
        fireEvent.scroll(screen.getByRole("listbox"));

        expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("opens above the field when there is no room below it", () => {
        render(
            <TextField label="Plan" select value="" onChange={jest.fn()}>
                <MenuItem value="MINI">Mini</MenuItem>
                <MenuItem value="BASIC">Basic</MenuItem>
            </TextField>,
        );
        const trigger = screen.getByRole("combobox", {name: "Plan"});
        jest.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
            bottom: window.innerHeight - 20,
            height: 40,
            left: 100,
            right: 400,
            top: window.innerHeight - 60,
            width: 300,
            x: 100,
            y: window.innerHeight - 60,
            toJSON: () => ({}),
        });

        fireEvent.click(trigger);

        const menu = screen.getByRole("listbox");
        expect(menu.style.bottom).toBe("66px");
        expect(menu.style.top).toBe("");
    });

    it("does not allow selecting a disabled option", () => {
        const handleChange = jest.fn();

        render(
            <TextField label="Provider" select value="first" onChange={handleChange}>
                <MenuItem value="first">First provider</MenuItem>
                <MenuItem disabled value="second">Second provider</MenuItem>
            </TextField>,
        );

        fireEvent.click(screen.getByRole("combobox", {name: "Provider"}));
        fireEvent.click(screen.getByRole("option", {name: "Second provider"}));

        expect(handleChange).not.toHaveBeenCalled();
    });

    it("does not present the first option as selected when the controlled value is empty", () => {
        render(
            <TextField label="Department" select value="" onChange={jest.fn()}>
                <MenuItem value="WAW01">WAW01 - Warszawa</MenuItem>
                <MenuItem value="KRK01">KRK01 - Kraków</MenuItem>
            </TextField>,
        );

        expect(screen.getByRole("combobox", {name: "Department"})).toHaveTextContent("—");
        expect(screen.getByRole("combobox", {name: "Department"})).not.toHaveTextContent("WAW01");
    });
});
