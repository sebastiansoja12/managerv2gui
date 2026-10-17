import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import OperatorAdministrationService from "../../../hooks/OperatorAdministrationService";
import pl from "../../../i18n/translate";
import {Operator} from "../../Operators/model/Operator";
import {User} from "../../Users/model/User";
import OperatorAccessPanel from "./OperatorAccessPanel";

jest.mock("../../../hooks/OperatorAdministrationService", () => ({
    __esModule: true,
    default: {
        getAccess: jest.fn(),
        revokeSessions: jest.fn(),
    },
}));

jest.mock("../../../api/errorMessage", () => ({
    getBackendErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

const service = OperatorAdministrationService as jest.Mocked<typeof OperatorAdministrationService>;

const operator = {
    operatorId: {value: 20},
    companyName: "Acme",
    status: "ACTIVE",
} as unknown as Operator;

const user = (id: number, role: User["role"], deleted = false) => ({
    userId: {value: id},
    username: `user${id}`,
    firstName: `First${id}`,
    lastName: "Last",
    email: `user${id}@test.pl`,
    role,
    deleted,
} as unknown as User);

const users = [user(1, "USER"), user(2, "ADMIN"), user(3, "SUPERADMIN"), user(4, "ADMIN", true)];

describe("OperatorAccessPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        service.getAccess.mockResolvedValue({operatorId: 20, activeSessions: 3});
        service.revokeSessions.mockResolvedValue(undefined);
    });

    test("shows active sessions and only active administrators", async () => {
        render(<OperatorAccessPanel onChangeStatus={jest.fn()} onImpersonate={jest.fn()} operator={operator} users={users} />);

        await waitFor(() => expect(screen.getByTestId("operator-active-sessions")).toHaveTextContent("3"));
        expect(screen.getByText("@user3")).toBeInTheDocument();
        expect(screen.getByText("@user2")).toBeInTheDocument();
        expect(screen.queryByText("@user1")).not.toBeInTheDocument();
        expect(screen.queryByText("@user4")).not.toBeInTheDocument();
    });

    test("revokes all sessions after confirmation", async () => {
        render(<OperatorAccessPanel onChangeStatus={jest.fn()} onImpersonate={jest.fn()} operator={operator} users={users} />);
        await waitFor(() => expect(screen.getByTestId("operator-active-sessions")).toHaveTextContent("3"));

        fireEvent.click(screen.getByRole("button", {name: pl.superAdmin.operatorAccess.revoke}));
        fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", {name: pl.superAdmin.operatorAccess.confirm}));

        await waitFor(() => expect(service.revokeSessions).toHaveBeenCalledWith("20"));
        expect(await screen.findByText(pl.superAdmin.operatorAccess.revoked)).toBeInTheDocument();
        expect(service.getAccess).toHaveBeenCalledTimes(2);
    });

    test("blocks active operator through status callback", async () => {
        const onChangeStatus = jest.fn().mockResolvedValue(undefined);
        render(<OperatorAccessPanel onChangeStatus={onChangeStatus} onImpersonate={jest.fn()} operator={operator} users={users} />);

        fireEvent.click(screen.getByRole("button", {name: pl.superAdmin.operatorAccess.block}));
        fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", {name: pl.superAdmin.operatorAccess.confirm}));

        await waitFor(() => expect(onChangeStatus).toHaveBeenCalledWith("INACTIVE"));
    });

    test("offers unblocking for blocked operator", async () => {
        const onChangeStatus = jest.fn().mockResolvedValue(undefined);
        render(<OperatorAccessPanel onChangeStatus={onChangeStatus} onImpersonate={jest.fn()} operator={{...operator, status: "INACTIVE"}} users={users} />);

        expect(screen.getByText(pl.superAdmin.operatorAccess.statusBlocked)).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", {name: pl.superAdmin.operatorAccess.unblock}));
        fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", {name: pl.superAdmin.operatorAccess.confirm}));

        await waitFor(() => expect(onChangeStatus).toHaveBeenCalledWith("ACTIVE"));
    });

    test("disables revoking when there are no sessions", async () => {
        service.getAccess.mockResolvedValue({operatorId: 20, activeSessions: 0});

        render(<OperatorAccessPanel onChangeStatus={jest.fn()} onImpersonate={jest.fn()} operator={operator} users={users} />);

        await waitFor(() => expect(screen.getByTestId("operator-active-sessions")).toHaveTextContent("0"));
        expect(screen.getByRole("button", {name: pl.superAdmin.operatorAccess.revoke})).toBeDisabled();
    });
});
