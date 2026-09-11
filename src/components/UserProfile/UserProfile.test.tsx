import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import AuthService from "../../hooks/AuthService";
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
    apiKey: "mgr_existing-api-key",
    rolePermissions: [],
    deleted: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
};

afterEach(() => {
    jest.restoreAllMocks();
});

test("displays the current API key and replaces it after regeneration", async () => {
    jest.spyOn(AuthService, "me").mockResolvedValue({data: currentUser} as never);
    const generateApiKey = jest.spyOn(AuthService, "generateApiKey").mockResolvedValue({
        data: {apiKey: "mgr_generated-api-key"},
    } as never);

    render(<UserProfile />);

    expect(await screen.findByText("profile-user")).toBeInTheDocument();
    expect(screen.getByDisplayValue("mgr_existing-api-key")).toHaveAttribute("readonly");

    fireEvent.click(screen.getByRole("button", {name: pl.userProfile.actions.regenerateApiKey}));

    await waitFor(() => expect(generateApiKey).toHaveBeenCalledTimes(1));
    expect(await screen.findByDisplayValue("mgr_generated-api-key")).toHaveAttribute("readonly");
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

test("copies and deletes the current API key from its field", async () => {
    jest.spyOn(AuthService, "me").mockResolvedValue({data: currentUser} as never);
    const deleteApiKey = jest.spyOn(AuthService, "deleteApiKey").mockResolvedValue({} as never);
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {configurable: true, value: {writeText}});
    jest.spyOn(window, "confirm").mockReturnValue(true);

    render(<UserProfile />);

    expect(await screen.findByDisplayValue("mgr_existing-api-key")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {name: pl.userProfile.actions.copyApiKey}));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("mgr_existing-api-key"));

    fireEvent.click(screen.getByRole("button", {name: pl.userProfile.actions.deleteApiKey}));
    await waitFor(() => expect(deleteApiKey).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByPlaceholderText(pl.userProfile.apiKeyMissing)).toHaveValue(""));
});
