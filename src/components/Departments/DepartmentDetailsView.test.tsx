import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import departmentService from "../../hooks/DepartmentService";
import UserManagementService from "../../hooks/UserManagementService";
import pl from "../../i18n/translate";
import DepartmentDetailsView from "./DepartmentDetailsView";

jest.mock("../../auth/AuthState", () => ({
    useAuthState: () => ({user: {role: "ADMIN", departmentCode: "KT1"}}),
}));
jest.mock("../../hooks/DepartmentService", () => ({
    __esModule: true,
    default: {
        getById: jest.fn(),
        getAll: jest.fn(),
        getArchived: jest.fn(),
        updateAddress: jest.fn(),
        changeEmail: jest.fn(),
        changeIdentificationNumber: jest.fn(),
        changeType: jest.fn(),
        changeStatus: jest.fn(),
    },
}));
jest.mock("../../hooks/UserManagementService", () => ({
    __esModule: true,
    default: {getAll: jest.fn()},
}));
jest.mock("../DepartmentMap/DepartmentMapWorkspace", () => ({
    __esModule: true,
    default: ({departmentId, departmentCode}: {departmentId: string; departmentCode: string}) => (
        <div>{`map-workspace ${departmentId} ${departmentCode}`}</div>
    ),
}));
jest.mock("./DeliveryAreaEditor", () => ({
    __esModule: true,
    default: ({departmentId, departmentCode}: {departmentId: string; departmentCode: string}) => (
        <div>{`delivery-area-editor ${departmentId} ${departmentCode}`}</div>
    ),
}));

const departments = departmentService as jest.Mocked<typeof departmentService>;
const usersService = UserManagementService as jest.Mocked<typeof UserManagementService>;

const department = {
    departmentId: 100,
    departmentCode: {value: "KT1"},
    address: {city: "Katowice", street: "Bankowa 12", postalCode: "40-007", countryCode: "PL"},
    coordinates: null,
    taxId: "1234567890",
    telephoneNumber: "123456789",
    openingHours: "08:00-16:00",
    email: "kt1@example.com",
    departmentType: "WAREHOUSE",
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
};

const renderView = () => render(
    <MemoryRouter initialEntries={["/departments/100"]}>
        <Routes>
            <Route path="/departments/:departmentId" element={<DepartmentDetailsView />} />
        </Routes>
    </MemoryRouter>,
);

describe("DepartmentDetailsView", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.localStorage.clear();
        departments.getById.mockResolvedValue({data: department} as never);
        usersService.getAll.mockResolvedValue({data: [
            {userId: {value: 1}, firstName: "Anna", lastName: "Nowak", username: "anowak", departmentCode: "KT1", role: "USER"},
            {userId: {value: 2}, firstName: "Jan", lastName: "Kowal", username: "jkowal", departmentCode: "WR1", role: "USER"},
        ]} as never);
    });

    it("loads the department by id and lists its users", async () => {
        renderView();

        expect(await screen.findByRole("heading", {name: "KT1"})).toBeInTheDocument();
        expect(departments.getById).toHaveBeenCalledWith("100");
        expect(screen.getByText("kt1@example.com")).toBeInTheDocument();
        expect(await screen.findByText("Anna Nowak")).toBeInTheDocument();
        expect(screen.queryByText("Jan Kowal")).not.toBeInTheDocument();
    });

    it("edits department data inside the component instead of a dialog", async () => {
        departments.updateAddress.mockResolvedValue({data: undefined} as never);
        departments.changeEmail.mockResolvedValue({data: undefined} as never);
        renderView();
        await screen.findByRole("heading", {name: "KT1"});

        fireEvent.click(screen.getByRole("button", {name: pl.common.edit}));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        fireEvent.change(screen.getByLabelText(new RegExp(`^${pl.departments.create.fields.city}`)), {target: {value: "Gliwice"}});
        fireEvent.change(screen.getByLabelText(pl.departments.create.fields.email), {target: {value: "gl@example.com"}});
        fireEvent.click(screen.getByRole("button", {name: pl.common.saveChanges}));

        await waitFor(() => expect(departments.updateAddress).toHaveBeenCalledWith({
            departmentCode: {value: "KT1"},
            address: {city: "Gliwice", street: "Bankowa 12", postalCode: "40-007", countryCode: "PL"},
        }));
        expect(departments.changeEmail).toHaveBeenCalledWith({departmentCode: {value: "KT1"}, email: "gl@example.com"});
        expect(departments.changeType).not.toHaveBeenCalled();
        expect(await screen.findByText(pl.departments.edit.success)).toBeInTheDocument();
    });

    it("opens the department map tab", async () => {
        renderView();
        await screen.findByRole("heading", {name: "KT1"});

        fireEvent.click(screen.getByRole("tab", {name: new RegExp(pl.departments.view.mapTab)}));

        expect(screen.getByText("map-workspace 100 KT1")).toBeInTheDocument();
    });

    it("opens a separate delivery area tab for the selected department", async () => {
        renderView();
        await screen.findByRole("heading", {name: "KT1"});

        fireEvent.click(screen.getByRole("tab", {name: pl.departments.view.deliveryAreaTab}));

        expect(screen.getByText("delivery-area-editor 100 KT1")).toBeInTheDocument();
        expect(screen.queryByText("map-workspace 100 KT1")).not.toBeInTheDocument();
    });

    it("omits archived status when configuration blocks archiving", async () => {
        window.localStorage.setItem("manager.department-configuration.v1.unknown",
            JSON.stringify({preventDepartmentArchiving: true}));
        renderView();
        await screen.findByRole("heading", {name: "KT1"});
        fireEvent.click(screen.getByRole("button", {name: pl.common.edit}));
        expect(screen.queryByRole("option", {name: pl.departments.status.ARCHIVED})).not.toBeInTheDocument();
        expect(departments.changeStatus).not.toHaveBeenCalled();
    });
});
