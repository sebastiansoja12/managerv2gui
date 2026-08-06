import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import OperatorService from "../../../hooks/OperatorService";
import PlatformAuditService from "../../../hooks/PlatformAuditService";
import pl from "../../../i18n/translate";
import PlatformAuditPanel from "./PlatformAuditPanel";
import {PlatformAuditEntry} from "./model/PlatformAuditEntry";

jest.mock("../../../hooks/OperatorService", () => ({
    __esModule: true,
    default: {
        getAll: jest.fn(),
    },
}));

jest.mock("../../../hooks/PlatformAuditService", () => ({
    __esModule: true,
    default: {
        getLatest: jest.fn(),
    },
}));

const getOperatorsMock = OperatorService.getAll as jest.Mock;
const getLatestMock = PlatformAuditService.getLatest as jest.Mock;

const entries: PlatformAuditEntry[] = [
    {
        id: 1,
        platformOwnerId: 1,
        platformOwnerUsername: "owner",
        operatorId: 10,
        impersonation: true,
        httpMethod: "PUT",
        path: "/users/5/role",
        statusCode: 204,
        success: true,
        createdAt: "2026-10-17T09:00:00Z",
    },
    {
        id: 2,
        platformOwnerId: 1,
        platformOwnerUsername: "owner",
        operatorId: null,
        impersonation: false,
        httpMethod: "POST",
        path: "/platform/owners",
        statusCode: 400,
        success: false,
        createdAt: "2026-10-17T09:05:00Z",
    },
];

describe("PlatformAuditPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getOperatorsMock.mockResolvedValue({data: [{operatorId: {value: 10}, companyName: "Acme"}]});
        getLatestMock.mockResolvedValue(entries);
    });

    test("shows audited actions with operator name and result", async () => {
        render(<PlatformAuditPanel />);

        expect(await screen.findByText("/users/5/role")).toBeInTheDocument();
        expect(await screen.findAllByText("Acme · #10")).toHaveLength(2);
        expect(screen.getByText(pl.superAdmin.audit.impersonation)).toBeInTheDocument();
        expect(screen.getByText(`${pl.superAdmin.audit.failure} · 400`)).toBeInTheDocument();
    });

    test("reloads entries for selected operator", async () => {
        render(<PlatformAuditPanel />);
        await screen.findAllByText("Acme · #10");

        fireEvent.change(screen.getByLabelText(pl.superAdmin.audit.operator), {target: {value: "10"}});

        await waitFor(() => expect(getLatestMock).toHaveBeenLastCalledWith("10"));
    });

    test("shows empty state", async () => {
        getLatestMock.mockResolvedValue([]);

        render(<PlatformAuditPanel />);

        expect(await screen.findByText(pl.superAdmin.audit.empty)).toBeInTheDocument();
    });
});
