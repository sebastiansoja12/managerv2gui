import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import PlatformAnnouncementService from "../../../hooks/PlatformAnnouncementService";
import pl from "../../../i18n/translate";
import {Operator} from "../../Operators/model/Operator";
import AnnouncementsPanel from "./AnnouncementsPanel";

jest.mock("../../../hooks/PlatformAnnouncementService", () => ({
    __esModule: true,
    default: {
        getAll: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    },
}));

jest.mock("../../../hooks/OperatorService", () => ({
    __esModule: true,
    default: {getAll: jest.fn()},
}));

jest.mock("../../../api/errorMessage", () => ({
    getBackendErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

const service = PlatformAnnouncementService as jest.Mocked<typeof PlatformAnnouncementService>;

const operators = [
    {operatorId: {value: 20}, companyName: "Acme"},
    {operatorId: {value: 21}, companyName: "Beta"},
] as unknown as Operator[];

const texts = pl.superAdmin.announcements;

describe("AnnouncementsPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        service.getAll.mockResolvedValue([{
            id: 1,
            title: "Przestój",
            message: "Planowany przestój",
            severity: "WARNING",
            status: "SCHEDULED",
            validFrom: null,
            validTo: null,
            targetOperatorIds: [20],
            targetRoles: ["ADMIN"],
            createdBy: "owner",
        }]);
        service.create.mockResolvedValue({} as never);
        service.update.mockResolvedValue({} as never);
        service.remove.mockResolvedValue(undefined);
    });

    test("lists announcements with status and audience", async () => {
        render(<AnnouncementsPanel operators={operators} />);

        expect(await screen.findByText("Planowany przestój")).toBeInTheDocument();
        expect(screen.getByText(texts.statuses.SCHEDULED)).toBeInTheDocument();
        expect(screen.getByText(/Acme · /)).toBeInTheDocument();
    });

    test("creates announcement targeted to selected operator and role", async () => {
        render(<AnnouncementsPanel operators={operators} />);
        await screen.findByText("Planowany przestój");

        fireEvent.click(screen.getByRole("button", {name: texts.create}));
        const dialog = await screen.findByRole("dialog");
        fireEvent.change(within(dialog).getByPlaceholderText(texts.placeholder), {target: {value: "Aktualizacja"}});
        fireEvent.click(within(dialog).getByLabelText(/Beta/));
        fireEvent.click(within(dialog).getByLabelText(pl.usersManagement.roles.SUPERADMIN));
        fireEvent.click(within(dialog).getByRole("button", {name: texts.save}));

        await waitFor(() => expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
            message: "Aktualizacja",
            severity: "INFO",
            targetOperatorIds: [21],
            targetRoles: ["SUPERADMIN"],
            validFrom: null,
            validTo: null,
        })));
        await waitFor(() => expect(service.getAll).toHaveBeenCalledTimes(2));
    });

    test("updates existing announcement", async () => {
        render(<AnnouncementsPanel operators={operators} />);
        fireEvent.click(await screen.findByRole("button", {name: texts.edit}));
        const dialog = await screen.findByRole("dialog");

        fireEvent.click(within(dialog).getByRole("button", {name: texts.save}));

        await waitFor(() => expect(service.update).toHaveBeenCalledWith(1, expect.objectContaining({
            title: "Przestój",
            targetOperatorIds: [20],
            targetRoles: ["ADMIN"],
        })));
    });

    test("deletes announcement after confirmation", async () => {
        render(<AnnouncementsPanel operators={operators} />);
        fireEvent.click(await screen.findByRole("button", {name: texts.deleteAction}));

        fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", {name: texts.deleteAction}));

        await waitFor(() => expect(service.remove).toHaveBeenCalledWith(1));
    });
});
