import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import departmentService from "../../hooks/DepartmentService";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import UserManagementService from "../../hooks/UserManagementService";
import pl from "../../i18n/translate";
import Departments from "../Departments";
import {deliveryAreasChangedEvent} from "./model/DeliveryArea";

let mockRole = "MANAGER";

jest.mock("../../auth/AuthState", () => ({
    useAuthState: () => ({user: {role: mockRole, departmentCode: "KT1"}}),
}));
jest.mock("../../hooks/DepartmentService", () => ({
    __esModule: true,
    default: {getAll: jest.fn(), getArchived: jest.fn(), changeStatus: jest.fn()},
}));
jest.mock("../../hooks/UserManagementService", () => ({
    __esModule: true,
    default: {getAll: jest.fn()},
}));
jest.mock("../../hooks/DeliveryNetworkService", () => ({__esModule: true, default: {}}));
jest.mock("../../hooks/OperatorConfigurationService", () => ({
    __esModule: true,
    default: {getCurrentDepartmentConfiguration: jest.fn()},
}));
jest.mock("./DepartmentRelationsMap", () => ({
    __esModule: true,
    default: () => null,
    getDepartmentsMissingSortingRelation: () => [],
}));
jest.mock("./DeliveryAreasMap", () => ({
    __esModule: true,
    default: () => <div>Mapa granic doręczeń</div>,
}));

const departments = departmentService as jest.Mocked<typeof departmentService>;
const usersService = UserManagementService as jest.Mocked<typeof UserManagementService>;
const configurationService = OperatorConfigurationService as jest.Mocked<typeof OperatorConfigurationService>;
const departmentConfiguration = {
    autoAssignDeliveryAreas: false, autoConnectDepartments: false,
    preventDepartmentDeletion: false, preventDepartmentArchiving: false,
};

describe("Departments", () => {
    beforeEach(() => {
        mockRole = "MANAGER";
        window.localStorage.clear();
        configurationService.getCurrentDepartmentConfiguration.mockResolvedValue(
            {data: departmentConfiguration, status: 200});
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

    it("keeps automatic boundary settings off the department list", async () => {
        render(<Departments />);
        await screen.findAllByText("KT1", {selector: "td strong"});
        expect(screen.getByText("Mapa granic doręczeń")).toBeInTheDocument();
        expect(screen.queryByRole("button", {name: "Wyznacz automatycznie dla Polski"})).not.toBeInTheDocument();
    });

    it("refreshes delivery areas after a department is deleted", async () => {
        mockRole = "ADMIN";
        departments.getArchived.mockResolvedValue({data: []} as never);
        departments.changeStatus.mockResolvedValue({data: undefined} as never);
        const deliveryAreasChanged = jest.fn();
        window.addEventListener(deliveryAreasChangedEvent, deliveryAreasChanged);
        render(<Departments />);
        await screen.findAllByText("KT1", {selector: "td strong"});

        fireEvent.click(screen.getByRole("button", {name: pl.common.delete}));
        fireEvent.click(await screen.findByRole("button", {name: pl.departments.actions.deleteDialogConfirm}));

        await waitFor(() => expect(deliveryAreasChanged).toHaveBeenCalledTimes(1));
        expect(departments.changeStatus).toHaveBeenCalledWith({departmentCode: {value: "KT1"}, status: "DELETED"});
        window.removeEventListener(deliveryAreasChangedEvent, deliveryAreasChanged);
    });

    it("hides archiving when department settings disallow it", async () => {
        configurationService.getCurrentDepartmentConfiguration.mockResolvedValue(
            {data: {...departmentConfiguration, preventDepartmentArchiving: true}, status: 200});
        render(<Departments />);
        await screen.findAllByText("KT1", {selector: "td strong"});
        expect(screen.queryByRole("button", {name: "Archiwizuj"})).not.toBeInTheDocument();
    });
});
