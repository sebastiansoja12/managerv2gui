import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import CourierService from "../../hooks/CourierService";
import DepartmentService from "../../hooks/DepartmentService";
import pl from "../../i18n/translate";
import Couriers from "./Couriers";

jest.mock("../../hooks/CourierService", () => ({
    __esModule: true,
    default: {
        activate: jest.fn(),
        create: jest.fn(),
        deactivate: jest.fn(),
        getAll: jest.fn(),
    },
}));

jest.mock("../../hooks/DepartmentService", () => ({
    __esModule: true,
    default: {
        getAll: jest.fn(),
    },
}));

const mockedCourierService = CourierService as jest.Mocked<typeof CourierService>;
const mockedDepartmentService = DepartmentService as jest.Mocked<typeof DepartmentService>;

describe("Couriers", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedCourierService.getAll.mockResolvedValue({data: []} as any);
        mockedCourierService.create.mockResolvedValue({data: {supplierCode: "KUR-01"}} as any);
        mockedDepartmentService.getAll.mockResolvedValue({
            data: [{
                departmentId: 1,
                departmentCode: {value: "WAW01"},
                address: {city: "Warszawa", street: "Prosta 1", postalCode: "00-001", countryCode: "PL"},
                taxId: "",
                telephoneNumber: "",
                openingHours: "",
                email: "",
                departmentType: "BRANCH",
                status: "ACTIVE",
                createdAt: "",
                updatedAt: "",
            }],
        } as any);
    });

    it("uses a real department value and submits a completed create form", async () => {
        render(<MemoryRouter><Couriers/></MemoryRouter>);

        await waitFor(() => expect(mockedCourierService.getAll).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(mockedDepartmentService.getAll).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
        fireEvent.click(screen.getByRole("button", {name: pl.couriers.create.title}));
        const dialog = screen.getByRole("dialog");

        await waitFor(() => expect(
            within(dialog).getByRole("combobox", {name: pl.couriers.fields.department}),
        ).toHaveTextContent("WAW01 - Warszawa"));

        fireEvent.change(within(dialog).getByRole("textbox", {name: pl.couriers.create.fields.supplierCode}), {
            target: {value: "KUR-01"},
        });
        fireEvent.change(within(dialog).getByRole("textbox", {name: pl.couriers.fields.firstName}), {
            target: {value: "Jan"},
        });
        fireEvent.change(within(dialog).getByRole("textbox", {name: pl.couriers.fields.lastName}), {
            target: {value: "Kowalski"},
        });
        fireEvent.change(within(dialog).getByRole("textbox", {name: pl.couriers.fields.telephoneNumber}), {
            target: {value: "+48123456789"},
        });
        fireEvent.click(within(dialog).getByRole("button", {name: pl.couriers.create.submit}));

        await waitFor(() => expect(mockedCourierService.create).toHaveBeenCalledWith({
            supplierCode: {value: "KUR-01"},
            firstName: "Jan",
            lastName: "Kowalski",
            telephoneNumber: "+48123456789",
            departmentCode: {value: "WAW01"},
        }));
        expect(await screen.findByText(pl.couriers.create.success)).toBeInTheDocument();
        await waitFor(() => expect(mockedCourierService.getAll).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
    });
});
