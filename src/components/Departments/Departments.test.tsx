import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import departmentService from "../../hooks/DepartmentService";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import DepartmentLoadService from "../../hooks/DepartmentLoadService";
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
jest.mock("../../hooks/DepartmentLoadService", () => ({
    __esModule: true,
    default: {getAll: jest.fn()},
}));
jest.mock("../../hooks/OperatorConfigurationService", () => ({
    __esModule: true,
    default: {getCurrentDepartmentConfiguration: jest.fn(), getDepartmentConfiguration: jest.fn()},
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
const loadService = DepartmentLoadService as jest.Mocked<typeof DepartmentLoadService>;
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
        configurationService.getDepartmentConfiguration.mockResolvedValue(
            {data: departmentConfiguration, status: 200});
        departments.getAll.mockResolvedValue({data: [{
            departmentId: "9007199254740993",
            departmentCode: {value: "KT1"},
            address: {city: "Katowice", street: "Bankowa 12", postalCode: "40-007", countryCode: "PL"},
            taxId: "", telephoneNumber: "", openingHours: "", email: "", departmentType: "WAREHOUSE", status: "ACTIVE",
            createdAt: "", updatedAt: "",
        }]} as never);
        usersService.getAll.mockResolvedValue({data: []} as never);
        loadService.getAll.mockResolvedValue({data: []} as never);
    });

    it("selects a row on click and opens the department only on double click", async () => {
        const onOpenTab = jest.fn();
        render(<Departments onOpenTab={onOpenTab} />);
        const row = (await screen.findAllByText("KT1", {selector: "td strong"}))[0].closest("tr") as HTMLElement;

        fireEvent.click(row);

        expect(onOpenTab).not.toHaveBeenCalled();
        expect(row).toHaveClass("departments-row-selected");

        fireEvent.doubleClick(row);

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

    it("requires a status change reason before deactivating when the department demands it", async () => {
        configurationService.getDepartmentConfiguration.mockResolvedValue({data: {
            ...departmentConfiguration,
            lifecyclePolicy: {
                requireStatusChangeReason: true, blockDeactivationWithActiveWork: true,
                workTransferOnDeactivation: "MANUAL", autoArchiveInactiveAfterDays: 0,
            },
        }, status: 200});
        departments.changeStatus.mockResolvedValue({data: undefined} as never);
        render(<Departments />);
        await screen.findAllByText("KT1", {selector: "td strong"});

        fireEvent.click(screen.getByRole("button", {name: pl.departments.actions.deactivate}));
        const confirm = await screen.findByRole("button", {name: pl.departments.actions.deactivateDialogConfirm});
        await waitFor(() => expect(confirm).toBeDisabled());

        fireEvent.change(screen.getByLabelText(new RegExp(pl.departments.actions.reason)),
            {target: {value: "Remont"}});
        fireEvent.click(confirm);

        await waitFor(() => expect(departments.changeStatus).toHaveBeenCalledWith({
            departmentCode: {value: "KT1"}, status: "INACTIVE", reason: "Remont",
        }));
    });

    it("shows today's load and warns when the threshold is exceeded", async () => {
        loadService.getAll.mockResolvedValue({data: [{
            departmentId: "9007199254740993", deliveriesToday: 90, dailyCapacity: 100,
            utilizationPercent: 90, warning: true, overloaded: false,
        }]} as never);
        render(<Departments />);

        expect(await screen.findByText("90 / 100 (90%)")).toBeInTheDocument();
        expect(screen.getByTitle(pl.departments.capacity.warning)).toBeInTheDocument();
    });

    it("hides archiving when the selected department disallows it", async () => {
        configurationService.getDepartmentConfiguration.mockResolvedValue(
            {data: {...departmentConfiguration, preventDepartmentArchiving: true}, status: 200});
        render(<Departments />);
        await screen.findAllByText("KT1", {selector: "td strong"});
        await waitFor(() => expect(configurationService.getDepartmentConfiguration)
            .toHaveBeenCalledWith("9007199254740993"));
        await waitFor(() => expect(screen.queryByRole("button", {name: "Archiwizuj"})).not.toBeInTheDocument());
    });
});
