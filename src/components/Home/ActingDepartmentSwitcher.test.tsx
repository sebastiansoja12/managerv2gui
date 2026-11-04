import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {switchActingDepartment} from "../../auth/AuthSession";
import Department from "../../class/depots/Department";
import pl from "../../i18n/translate";
import ActingDepartmentSwitcher from "./ActingDepartmentSwitcher";

jest.mock("../../auth/AuthSession", () => ({switchActingDepartment: jest.fn()}));

const departments = [
    {departmentId: 1, departmentCode: {value: "KT1"}},
    {departmentId: 2, departmentCode: {value: "WAW"}},
] as unknown as Department[];

describe("ActingDepartmentSwitcher", () => {
    beforeEach(() => (switchActingDepartment as jest.Mock).mockResolvedValue(undefined));

    it("switches the superadmin to another department", async () => {
        render(<ActingDepartmentSwitcher departmentCode="KT1" departments={departments} homeDepartmentCode="KT1"/>);

        fireEvent.change(screen.getByLabelText(pl.home.dashboard.actingDepartment.label), {target: {value: "WAW"}});

        await waitFor(() => expect(switchActingDepartment).toHaveBeenCalledWith("WAW"));
    });

    it("returns to the home department", async () => {
        render(<ActingDepartmentSwitcher departmentCode="WAW" departments={departments} homeDepartmentCode="KT1"/>);

        expect(screen.getByText(pl.home.dashboard.actingDepartment.note.replace("{code}", "WAW"))).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", {name: pl.home.dashboard.actingDepartment.reset}));

        await waitFor(() => expect(switchActingDepartment).toHaveBeenCalledWith(null));
    });
});
