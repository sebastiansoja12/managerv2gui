import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import DepartmentService from "../../hooks/DepartmentService";
import ReturnService from "../../hooks/ReturnService";
import pl from "../../i18n/translate";
import Returns from "./Returns";

jest.mock("../../auth/AuthState", () => ({
    useAuthState: () => ({user: {departmentCode: "WAW01"}}),
}));

jest.mock("../../hooks/ReturnService", () => ({
    __esModule: true,
    default: {
        cancel: jest.fn(),
        changeReasonCode: jest.fn(),
        complete: jest.fn(),
        create: jest.fn(),
        get: jest.fn(),
        getAllByDepartment: jest.fn(),
        validateToken: jest.fn(),
    },
}));

jest.mock("../../hooks/DepartmentService", () => ({
    __esModule: true,
    default: {
        getAll: jest.fn(),
    },
}));

const mockedReturnService = ReturnService as jest.Mocked<typeof ReturnService>;
const mockedDepartmentService = DepartmentService as jest.Mocked<typeof DepartmentService>;

const returnPackage = {
    returnPackageId: {value: "9223372036854775001"},
    shipmentId: {value: "582104"},
    reason: "Damaged parcel corner",
    returnStatus: "CREATED" as const,
    returnToken: {value: "RETURN-ABC-123"},
    assignedDepartmentCode: {value: "WAW01"},
    returnedDepartmentCode: {value: "KRK02"},
    assignedTo: {value: "41"},
    processedBy: {value: "12"},
    reasonCode: {value: "DAMAGED"},
    createdAt: "2026-08-14T08:00:00Z",
    updatedAt: "2026-08-14T09:00:00Z",
};

const renderReturns = (
    props: React.ComponentProps<typeof Returns> = {},
    initialPath = "/returns",
) => render(
    <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
            <Route path="/returns" element={<Returns {...props}/>} />
            <Route path="/returns/:returnId" element={<Returns {...props}/>} />
        </Routes>
    </MemoryRouter>,
);

describe("Returns", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedReturnService.getAllByDepartment.mockResolvedValue([returnPackage]);
        mockedDepartmentService.getAll.mockResolvedValue({
            data: [
                {
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
                },
                {
                    departmentId: 2,
                    departmentCode: {value: "KT1"},
                    address: {city: "Katowice", street: "Leśna 2", postalCode: "40-001", countryCode: "PL"},
                    taxId: "",
                    telephoneNumber: "",
                    openingHours: "",
                    email: "",
                    departmentType: "BRANCH",
                    status: "INACTIVE",
                    createdAt: "",
                    updatedAt: "",
                },
                {
                    departmentId: 3,
                    departmentCode: {value: "KRK02"},
                    address: {city: "Kraków", street: "Długa 3", postalCode: "30-001", countryCode: "PL"},
                    taxId: "",
                    telephoneNumber: "",
                    openingHours: "",
                    email: "",
                    departmentType: "BRANCH",
                    status: "ACTIVE",
                    createdAt: "",
                    updatedAt: "",
                },
            ],
        } as any);
    });

    it("loads the returns table immediately for the default department", async () => {
        renderReturns();

        await waitFor(() => expect(mockedReturnService.getAllByDepartment).toHaveBeenCalledWith("WAW01"));
        expect(await screen.findByRole("rowheader", {name: returnPackage.returnPackageId.value})).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
        expect(screen.queryByText(pl.returns.empty.description)).not.toBeInTheDocument();
        expect(screen.queryByText(`#${returnPackage.returnPackageId.value}`)).not.toBeInTheDocument();
    });

    it("opens a searched return in a separate application tab", async () => {
        const onOpenTab = jest.fn();

        renderReturns({onOpenTab});

        await screen.findByRole("rowheader", {name: returnPackage.returnPackageId.value});

        fireEvent.change(screen.getByLabelText(pl.returns.fields.returnId), {
            target: {value: "9223372036854775001"},
        });
        fireEvent.click(screen.getByRole("button", {name: pl.returns.actions.search}));

        expect(onOpenTab).toHaveBeenCalledWith({
            label: `${pl.returns.details.title} #9223372036854775001`,
            path: "/returns/9223372036854775001",
        });
        expect(mockedReturnService.get).not.toHaveBeenCalled();
        expect(screen.queryByRole("button", {name: pl.returns.actions.complete})).not.toBeInTheDocument();
    });

    it("opens a table row in a separate application tab", async () => {
        const onOpenTab = jest.fn();

        renderReturns({onOpenTab});

        await screen.findByRole("rowheader", {name: returnPackage.returnPackageId.value});
        fireEvent.click(screen.getByRole("button", {name: pl.returns.actions.open}));

        expect(onOpenTab).toHaveBeenCalledWith({
            label: `${pl.returns.details.title} #${returnPackage.returnPackageId.value}`,
            path: `/returns/${returnPackage.returnPackageId.value}`,
        });
        expect(screen.queryByText(`#${returnPackage.returnPackageId.value}`)).not.toBeInTheDocument();
    });

    it("loads details and backend-supported actions on the dedicated route", async () => {
        mockedReturnService.get.mockResolvedValue({data: returnPackage, status: 200});

        renderReturns({}, `/returns/${returnPackage.returnPackageId.value}`);

        await waitFor(() => expect(mockedReturnService.get).toHaveBeenCalledWith(returnPackage.returnPackageId.value));
        expect(await screen.findByRole("button", {name: pl.returns.actions.complete})).toBeInTheDocument();
        expect(screen.queryByRole("table", {name: pl.returns.list.tableLabel})).not.toBeInTheDocument();
        expect(screen.getByRole("button", {name: pl.returns.actions.cancelReturn})).toBeInTheDocument();
    });

    it("reloads the table when the handling department changes", async () => {
        const krakowReturn = {
            ...returnPackage,
            returnPackageId: {value: "9223372036854775002"},
            shipmentId: {value: "582105"},
            assignedDepartmentCode: {value: "KRK02"},
        };
        mockedReturnService.getAllByDepartment.mockImplementation(async (code) => (
            code === "KRK02" ? [krakowReturn] : [returnPackage]
        ));

        renderReturns();

        await screen.findByRole("rowheader", {name: returnPackage.returnPackageId.value});

        fireEvent.change(screen.getByRole("combobox", {name: pl.returns.list.departmentFilter}), {
            target: {value: "KRK02"},
        });

        expect(await screen.findByRole("rowheader", {name: krakowReturn.returnPackageId.value})).toBeInTheDocument();
        expect(screen.queryByRole("rowheader", {name: returnPackage.returnPackageId.value})).not.toBeInTheDocument();
        expect(mockedReturnService.getAllByDepartment).toHaveBeenLastCalledWith("KRK02");
        await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
    });

    it("submits a new return using the manager shipment endpoint contract", async () => {
        mockedReturnService.create.mockResolvedValue({data: {status: "OK"}, status: 200});

        renderReturns();

        await screen.findByRole("rowheader", {name: returnPackage.returnPackageId.value});
        await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());

        fireEvent.click(screen.getByRole("button", {name: pl.returns.actions.create}));
        const dialog = screen.getByRole("dialog");
        const departmentSelect = within(dialog).getByRole("combobox", {name: /Oddział obsługujący/});
        fireEvent.mouseDown(departmentSelect);
        const warsawOption = await screen.findByRole("option", {name: "WAW01 — Warszawa"});
        expect(screen.queryByRole("option", {name: /KT1/})).not.toBeInTheDocument();
        fireEvent.change(within(dialog).getByRole("textbox", {name: /ID przesyłki/}), {target: {value: "582104"}});
        fireEvent.click(warsawOption);
        fireEvent.change(within(dialog).getByRole("textbox", {name: /Opis powodu/}), {target: {value: "Damaged parcel corner"}});
        fireEvent.click(within(dialog).getByRole("button", {name: pl.returns.actions.create}));

        await waitFor(() => expect(mockedReturnService.create).toHaveBeenCalledWith({
            shipmentId: {value: "582104"},
            reason: "Damaged parcel corner",
            reasonCode: {value: "DAMAGED"},
            departmentCode: {value: "WAW01"},
            returnStatus: "CREATED",
        }));
        expect(await screen.findByText(pl.returns.messages.createSuccess)).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
    });

    it("cancels a return without reloading the cancelled return by id", async () => {
        mockedReturnService.cancel.mockResolvedValue({data: {status: "OK"}, status: 200});
        mockedReturnService.get.mockResolvedValue({data: returnPackage, status: 200});

        renderReturns({}, `/returns/${returnPackage.returnPackageId.value}`);

        fireEvent.click(await screen.findByRole("button", {name: pl.returns.actions.cancelReturn}));
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", {
            name: pl.returns.actions.cancelReturn,
        }));

        await waitFor(() => expect(mockedReturnService.cancel).toHaveBeenCalledWith(
            returnPackage.returnPackageId.value,
        ));
        expect(mockedReturnService.get).toHaveBeenCalledTimes(1);
        expect(await screen.findByText(pl.returns.messages.cancelSuccess)).toBeInTheDocument();
        expect(screen.getByText(pl.returns.status.CANCELLED)).toBeInTheDocument();
    });
});
