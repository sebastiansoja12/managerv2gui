import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import PlatformOwnerAccountService from "../../../hooks/PlatformOwnerAccountService";
import pl from "../../../i18n/translate";
import PlatformOwnersPanel from "./PlatformOwnersPanel";
import {PlatformOwnerAccount} from "./model/PlatformOwnerAccount";

jest.mock("../../../hooks/PlatformOwnerAccountService", () => ({
    __esModule: true,
    default: {
        getAll: jest.fn(),
        create: jest.fn(),
        block: jest.fn(),
        unblock: jest.fn(),
        changePassword: jest.fn(),
    },
}));

jest.mock("../../../api/errorMessage", () => ({
    getBackendErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

jest.mock("../auth/PlatformOwnerSession", () => ({
    usePlatformOwnerSession: () => ({status: "authenticated", platformOwner: {platformOwnerId: 1, username: "owner"}}),
}));

const service = PlatformOwnerAccountService as jest.Mocked<typeof PlatformOwnerAccountService>;

const owners: PlatformOwnerAccount[] = [
    {platformOwnerId: 1, username: "owner", firstName: "Sebastian", lastName: "Soja", email: "owner@test.pl", active: true},
    {platformOwnerId: 2, username: "anna", firstName: "Anna", lastName: "Nowak", email: "anna@test.pl", active: true},
    {platformOwnerId: 3, username: "jan", firstName: "Jan", lastName: "Kowalski", email: "jan@test.pl", active: false},
];

const rowOf = (username: string) => screen.getByText(`@${username}`).closest(".super-admin-owner-row") as HTMLElement;

describe("PlatformOwnersPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        service.getAll.mockResolvedValue(owners);
        service.block.mockResolvedValue({} as never);
        service.unblock.mockResolvedValue({} as never);
        service.create.mockResolvedValue({} as never);
    });

    test("marks current owner and does not allow blocking own account", async () => {
        render(<PlatformOwnersPanel />);

        await screen.findByText("@owner");
        const ownRow = rowOf("owner");

        expect(within(ownRow).getByText(pl.superAdmin.owners.you)).toBeInTheDocument();
        expect(within(ownRow).getByRole("button", {name: pl.superAdmin.owners.block})).toBeDisabled();
    });

    test("blocks other active owner and reloads list", async () => {
        render(<PlatformOwnersPanel />);
        await screen.findByText("@anna");

        fireEvent.click(within(rowOf("anna")).getByRole("button", {name: pl.superAdmin.owners.block}));

        await waitFor(() => expect(service.block).toHaveBeenCalledWith(2));
        await waitFor(() => expect(service.getAll).toHaveBeenCalledTimes(2));
    });

    test("unblocks blocked owner", async () => {
        render(<PlatformOwnersPanel />);
        await screen.findByText("@jan");

        fireEvent.click(within(rowOf("jan")).getByRole("button", {name: pl.superAdmin.owners.unblock}));

        await waitFor(() => expect(service.unblock).toHaveBeenCalledWith(3));
        expect(service.block).not.toHaveBeenCalled();
    });

    test("shows error when owners cannot be loaded", async () => {
        service.getAll.mockRejectedValue(new Error("network"));

        render(<PlatformOwnersPanel />);

        expect(await screen.findByText(pl.superAdmin.owners.loadError)).toBeInTheDocument();
    });
});
