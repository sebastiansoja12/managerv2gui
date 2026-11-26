import React from "react";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import AuthService from "../../hooks/AuthService";
import McpService from "../../hooks/McpService";
import SubscriptionService from "../../hooks/SubscriptionService";
import pl from "../../i18n/translate";
import UserProfile from "./UserProfile";

const currentUser = {
    userId: {value: 1},
    username: "profile-user",
    firstName: "Profile",
    lastName: "User",
    email: "profile@example.com",
    role: "USER",
    departmentCode: "KT1",
    language: "pl",
    hasApiKey: true,
    rolePermissions: [],
    deleted: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
    Object.defineProperty(document, "hidden", {configurable: true, value: false});
    jest.spyOn(AuthService, "revealApiKey").mockResolvedValue({data: {apiKey: "mgr_saved-api-key"}} as never);
    jest.spyOn(McpService, "listKeys").mockResolvedValue({data: [], status: 200});
    jest.spyOn(McpService, "ownAccess").mockResolvedValue({data: {enabled: true, modules: {}}, status: 200});
    jest.spyOn(SubscriptionService, "getCurrent").mockResolvedValue({status: "NOT_ASSIGNED", accessAllowed: true});
});

afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
});

test("masks the stored API key and hides it five seconds after revealing", async () => {
    jest.spyOn(AuthService, "me").mockResolvedValue({data: currentUser} as never);
    render(<UserProfile />);
    await screen.findByText("profile-user");
    const input = screen.getByLabelText(pl.userProfile.fields.apiKey);
    expect(input).toHaveValue("********************************");
    expect(AuthService.revealApiKey).not.toHaveBeenCalled();
    jest.useFakeTimers();
    await act(async () => { fireEvent.click(screen.getByRole("button", {name: pl.userProfile.apiKeyReveal})); });
    expect(input).toHaveValue("mgr_saved-api-key");

    act(() => { jest.advanceTimersByTime(5000); });
    expect(input).toHaveValue("********************************");
    expect(screen.queryByDisplayValue("mgr_saved-api-key")).not.toBeInTheDocument();
});

test("keeps a regenerated API key masked until it is explicitly revealed", async () => {
    jest.spyOn(AuthService, "me").mockResolvedValue({data: currentUser} as never);
    const generate = jest.spyOn(AuthService, "generateApiKey").mockResolvedValue({data: {apiKey: "mgr_generated-api-key"}} as never);
    render(<UserProfile />);
    await screen.findByText("profile-user");
    fireEvent.click(screen.getByRole("button", {name: pl.userProfile.actions.regenerateApiKey}));

    await waitFor(() => expect(generate).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(pl.userProfile.messages.apiKeyGenerated)).toBeInTheDocument();
    expect(screen.getByLabelText(pl.userProfile.fields.apiKey)).toHaveValue("********************************");
    expect(screen.queryByDisplayValue("mgr_generated-api-key")).not.toBeInTheDocument();
});

test("changes the current user's first and last name", async () => {
    jest.spyOn(AuthService, "me").mockResolvedValue({data: currentUser} as never);
    const changeFullName = jest.spyOn(AuthService, "changeFullName").mockResolvedValue({} as never);

    render(<UserProfile />);

    expect(await screen.findByText("Profile User")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {name: pl.userProfile.actions.editFullName}));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(pl.userProfile.fields.firstName), {target: {value: "Jan"}});
    fireEvent.change(screen.getByLabelText(pl.userProfile.fields.lastName), {target: {value: "Kowalski"}});
    fireEvent.click(screen.getByRole("button", {name: pl.userProfile.actions.saveFullName}));

    await waitFor(() => expect(changeFullName).toHaveBeenCalledWith({firstName: "Jan", lastName: "Kowalski"}));
    expect(await screen.findByText("Jan Kowalski")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("copies an existing API key without displaying it and deletes it", async () => {
    jest.spyOn(AuthService, "me").mockResolvedValue({data: currentUser} as never);
    const deleteApiKey = jest.spyOn(AuthService, "deleteApiKey").mockResolvedValue({} as never);
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {configurable: true, value: {writeText}});
    jest.spyOn(window, "confirm").mockReturnValue(true);
    render(<UserProfile />);
    await screen.findByText("profile-user");
    fireEvent.click(screen.getByRole("button", {name: pl.userProfile.actions.copyApiKey}));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("mgr_saved-api-key"));
    expect(await screen.findByText(pl.userProfile.messages.apiKeyCopied)).toBeInTheDocument();
    expect(screen.getByLabelText(pl.userProfile.fields.apiKey)).toHaveValue("********************************");
    fireEvent.click(screen.getByRole("button", {name: pl.userProfile.actions.deleteApiKey}));
    await waitFor(() => expect(deleteApiKey).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByLabelText(pl.userProfile.fields.apiKey)).toHaveValue(""));
});

test("places the MCP key and options directly below the API key before access permissions", async () => {
    jest.spyOn(AuthService, "me").mockResolvedValue({data: currentUser} as never);
    render(<UserProfile />);
    await screen.findByText("profile-user");

    const apiKeySection = screen.getByLabelText(pl.userProfile.fields.apiKey).closest(".user-profile-api-key-detail");
    const mcpSection = screen.getByRole("region", {name: pl.mcp.title});
    expect(apiKeySection?.nextElementSibling).toBe(mcpSection);
    expect(mcpSection).toContainElement(screen.getByLabelText(pl.mcp.keyTitle));
    expect(mcpSection).toContainElement(screen.getByLabelText(pl.mcp.name));
    expect(mcpSection).toContainElement(screen.getByLabelText(pl.mcp.expiresAt));
});
