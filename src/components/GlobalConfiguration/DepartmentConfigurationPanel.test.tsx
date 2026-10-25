import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import departmentService from "../../hooks/DepartmentService";
import pl from "../../i18n/translate";
import DepartmentConfigurationPanel from "./DepartmentConfigurationPanel";
import {applyDepartmentAutomations} from "./departmentAutomation";

jest.mock("../../auth/AuthState", () => ({
    useAuthState: () => ({user: {operatorId: {value: 7}}}),
}));
jest.mock("../../hooks/DepartmentService", () => ({
    __esModule: true,
    default: {getAll: jest.fn()},
}));
jest.mock("./departmentAutomation", () => ({applyDepartmentAutomations: jest.fn()}));

describe("DepartmentConfigurationPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.localStorage.clear();
        (departmentService.getAll as jest.Mock).mockResolvedValue({data: []});
        (applyDepartmentAutomations as jest.Mock).mockResolvedValue({assignedAreas: 0, createdConnections: 0});
    });

    it("saves all four department rules for the current operator", async () => {
        render(<DepartmentConfigurationPanel />);
        const settings = pl.globalConfiguration.departmentConfiguration.settings;
        for (const setting of Object.values(settings)) {
            fireEvent.click(screen.getByRole("checkbox", {name: setting.label}));
        }
        fireEvent.click(screen.getByRole("button", {name: pl.common.saveChanges}));

        await waitFor(() => expect(applyDepartmentAutomations).toHaveBeenCalled());
        expect(departmentService.getAll).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(JSON.parse(window.localStorage.getItem("manager.department-configuration.v1.7") || "{}"))
            .toEqual({autoAssignDeliveryAreas: true, autoConnectDepartments: true,
                preventDepartmentDeletion: true, preventDepartmentArchiving: true}));
    });
});
