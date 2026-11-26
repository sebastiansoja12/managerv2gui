import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import McpService from "../../hooks/McpService";
import pl from "../../i18n/translate";
import {User} from "../Users/model/User";
import McpAccessDialog from "./McpAccessDialog";

jest.mock("../../api/errorMessage", () => ({
    getBackendErrorMessage: (error: {message?: string}, fallback: string) => error.message || fallback,
}));

const user: User = {
    userId: {value: 5}, username: "assistant-user", firstName: "Jan", lastName: "Nowak", email: "user@example.com",
    role: "USER", departmentCode: "KT1", language: "pl", deleted: false, operatorId: {value: 1}, rolePermissions: [],
};

beforeEach(() => {
    jest.spyOn(McpService, "getAccess").mockResolvedValue({data: {enabled: true, modules: {SHIPMENTS: "WRITE"}}, status: 200});
});
afterEach(() => jest.restoreAllMocks());

test("saves per-module visibility and read-only access", async () => {
    const save = jest.spyOn(McpService, "updateAccess").mockResolvedValue({data: undefined, status: 204});
    render(<McpAccessDialog user={user} onClose={jest.fn()} />);
    fireEvent.click(await screen.findByRole("combobox", {name: `${pl.mcp.access}: ${pl.mcp.modules.SHIPMENTS}`}));
    fireEvent.click(screen.getByRole("option", {name: pl.mcp.levels.READ}));
    fireEvent.click(screen.getByRole("button", {name: pl.mcp.save}));

    await waitFor(() => expect(save).toHaveBeenCalledWith(5, {enabled: true, modules: {SHIPMENTS: "READ"}}));
    expect(await screen.findByText(pl.mcp.saved)).toBeInTheDocument();
});

test("blocks all MCP access and disables module inputs", async () => {
    const save = jest.spyOn(McpService, "updateAccess").mockResolvedValue({data: undefined, status: 204});
    render(<McpAccessDialog user={user} onClose={jest.fn()} />);
    fireEvent.click(await screen.findByRole("checkbox", {name: pl.mcp.enabled}));
    expect(screen.getByRole("combobox", {name: `${pl.mcp.access}: ${pl.mcp.modules.SHIPMENTS}`})).toBeDisabled();
    fireEvent.click(screen.getByRole("button", {name: pl.mcp.save}));

    await waitFor(() => expect(save).toHaveBeenCalledWith(5, {enabled: false, modules: {SHIPMENTS: "WRITE"}}));
    expect(await screen.findByText(pl.mcp.saved)).toBeInTheDocument();
});

test("revokes user keys through the administrative endpoint", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true);
    const revoke = jest.spyOn(McpService, "revokeUserKeys").mockResolvedValue({data: undefined, status: 204});
    render(<McpAccessDialog user={user} onClose={jest.fn()} />);
    await screen.findByRole("checkbox", {name: pl.mcp.enabled});
    fireEvent.click(screen.getByRole("button", {name: pl.mcp.revokeAll}));

    await waitFor(() => expect(revoke).toHaveBeenCalledWith(5));
    expect(await screen.findByText(pl.mcp.keysRevoked)).toBeInTheDocument();
});

test("clears the previous user's policy while loading another user", async () => {
    const {rerender} = render(<McpAccessDialog user={user} onClose={jest.fn()} />);
    await screen.findByRole("checkbox", {name: pl.mcp.enabled});
    jest.spyOn(McpService, "getAccess").mockReturnValue(new Promise(() => {}));
    rerender(<McpAccessDialog user={{...user, userId: {value: 6}}} onClose={jest.fn()} />);

    expect(screen.queryByRole("checkbox", {name: pl.mcp.enabled})).not.toBeInTheDocument();
    expect(screen.getByRole("button", {name: pl.mcp.save})).toBeDisabled();
});
