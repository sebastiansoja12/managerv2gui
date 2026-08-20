import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import departmentService from "../../hooks/DepartmentService";
import UserManagementService from "../../hooks/UserManagementService";
import Departments from "../Departments";

jest.mock("../../auth/AuthState", () => ({
    useAuthState: () => ({user: {role: "MANAGER", departmentCode: "KT1"}}),
}));
jest.mock("../../hooks/DepartmentService", () => ({
    __esModule: true,
    default: {getAll: jest.fn(), getArchived: jest.fn()},
}));
jest.mock("../../hooks/UserManagementService", () => ({
    __esModule: true,
    default: {getAll: jest.fn()},
}));
jest.mock("../../hooks/DeliveryNetworkService", () => ({__esModule: true, default: {}}));
jest.mock("./DepartmentRelationsMap", () => ({
    __esModule: true,
    default: () => null,
    getDepartmentsMissingSortingRelation: () => [],
}));

const departments = departmentService as jest.Mocked<typeof departmentService>;
const usersService = UserManagementService as jest.Mocked<typeof UserManagementService>;

describe("Departments", () => {
    beforeEach(() => {
        departments.getAll.mockResolvedValue({data: [{
            departmentId: "9007199254740993",
            departmentCode: {value: "KT1"},
            address: {city: "Katowice", street: "Bankowa 12", postalCode: "40-007", countryCode: "PL"},
            taxId: "", telephoneNumber: "", openingHours: "", email: "", departmentType: "WAREHOUSE", status: "ACTIVE",
            createdAt: "", updatedAt: "",
        }]} as never);
        usersService.getAll.mockResolvedValue({data: []} as never);
    });

    it("opens the department component in a new tab when a row is clicked", async () => {
        const onOpenTab = jest.fn();
        render(<Departments onOpenTab={onOpenTab} />);

        fireEvent.click((await screen.findAllByText("KT1", {selector: "td strong"}))[0]);

        expect(onOpenTab).toHaveBeenCalledWith({
            label: expect.stringContaining("KT1"),
            path: "/departments/9007199254740993",
        });
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
});
