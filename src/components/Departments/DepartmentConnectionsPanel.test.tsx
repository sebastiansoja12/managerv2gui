import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import Department from "../../class/depots/Department";
import DeliveryNetworkService from "../../hooks/DeliveryNetworkService";
import departmentService from "../../hooks/DepartmentService";
import pl from "../../i18n/translate";
import DepartmentConnectionsPanel from "./DepartmentConnectionsPanel";

jest.mock("../../hooks/DeliveryNetworkService", () => ({
    __esModule: true,
    default: {getCurrentNetwork: jest.fn(), replaceCurrentNetwork: jest.fn()},
}));

jest.mock("../../hooks/DepartmentService", () => ({
    __esModule: true,
    default: {getAll: jest.fn()},
}));

const mockedNetworkService = DeliveryNetworkService as jest.Mocked<typeof DeliveryNetworkService>;
const mockedDepartmentService = departmentService as jest.Mocked<typeof departmentService>;

const department = (departmentId: number, code: string, city: string, departmentType = "BRANCH") => ({
    departmentId,
    departmentCode: {value: code},
    address: {city, street: "Street", postalCode: "00-001", countryCode: "PL"},
    departmentType,
    status: "ACTIVE",
} as unknown as Department);

const kt1 = department(1, "KT1", "Gliwice");
const departments = [kt1, department(2, "GDP", "Gdańsk"), department(3, "NCS", "Łódź", "SORTING_FACILITY")];

const renderPanel = () => render(
    <MemoryRouter>
        <DepartmentConnectionsPanel canEdit department={kt1} />
    </MemoryRouter>,
);

describe("DepartmentConnectionsPanel", () => {
    beforeEach(() => {
        mockedDepartmentService.getAll.mockResolvedValue({data: departments} as never);
        mockedNetworkService.replaceCurrentNetwork.mockReset();
    });

    it("lists connected departments and warns about a missing sorting facility", async () => {
        mockedNetworkService.getCurrentNetwork.mockResolvedValue({
            data: [{sourceDepartmentId: "1", targetDepartmentId: "2"}],
            status: 200,
        });

        renderPanel();

        expect(await screen.findByRole("button", {name: /^GDP/})).toBeInTheDocument();
        expect(screen.getByText(pl.departments.connections.missingSortingFacility)).toBeInTheDocument();
        expect(screen.getByText(pl.departments.connections.count.replace("{count}", "1"))).toBeInTheDocument();
    });

    it("connects the department with a searched department and saves the whole network", async () => {
        mockedNetworkService.getCurrentNetwork.mockResolvedValue({
            data: [{sourceDepartmentId: "1", targetDepartmentId: "2"}],
            status: 200,
        });
        mockedNetworkService.replaceCurrentNetwork.mockImplementation(async (relations) => ({data: relations, status: 200}));

        renderPanel();
        const input = await screen.findByRole("combobox", {name: pl.departments.connections.addLabel});
        fireEvent.focus(input);
        fireEvent.change(input, {target: {value: "ncs"}});
        fireEvent.mouseDown(screen.getByRole("option", {name: /NCS/}));
        fireEvent.click(screen.getByRole("button", {name: pl.departments.connections.connect}));

        expect(await screen.findByText(pl.departments.connections.connected.replace("{code}", "NCS")))
            .toBeInTheDocument();
        expect(mockedNetworkService.replaceCurrentNetwork).toHaveBeenCalledWith([
            {sourceDepartmentId: "1", targetDepartmentId: "2"},
            {sourceDepartmentId: "1", targetDepartmentId: "3"},
        ]);
        expect(screen.queryByText(pl.departments.connections.missingSortingFacility)).not.toBeInTheDocument();
    });

    it("removes a connection", async () => {
        mockedNetworkService.getCurrentNetwork.mockResolvedValue({
            data: [{sourceDepartmentId: "1", targetDepartmentId: "3"}, {sourceDepartmentId: "2", targetDepartmentId: "1"}],
            status: 200,
        });
        mockedNetworkService.replaceCurrentNetwork.mockImplementation(async (relations) => ({data: relations, status: 200}));

        renderPanel();
        fireEvent.click(await screen.findByRole("button", {
            name: pl.departments.connections.disconnect.replace("{code}", "GDP"),
        }));

        expect(await screen.findByText(pl.departments.connections.disconnected.replace("{code}", "GDP")))
            .toBeInTheDocument();
        expect(mockedNetworkService.replaceCurrentNetwork).toHaveBeenCalledWith([
            {sourceDepartmentId: "1", targetDepartmentId: "3"},
        ]);
    });
});
