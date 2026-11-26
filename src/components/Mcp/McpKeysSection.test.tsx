import React from "react";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import McpService from "../../hooks/McpService";
import pl from "../../i18n/translate";
import McpKeysSection from "./McpKeysSection";
import {McpKey} from "./model/McpAccess";

jest.mock("../../api/errorMessage", () => ({
    getBackendErrorMessage: (error: {message?: string}, fallback: string) => error.message || fallback,
}));

const key: McpKey = {
    mcpKeyId: {value: "key-id"}, name: "Assistant", keyPrefix: "mcp_prefix", status: "ACTIVE",
    createdAt: "2026-11-23T10:00:00Z", expiresAt: null, lastUsedAt: null, revokedAt: null,
};
const maskedKey = "********************************";

beforeEach(() => {
    jest.spyOn(McpService, "listKeys").mockResolvedValue({data: [], status: 200});
    jest.spyOn(McpService, "ownAccess").mockResolvedValue({data: {enabled: true, modules: {}}, status: 200});
    jest.spyOn(McpService, "revealKey").mockResolvedValue({data: {key: "mcp_secret"}, status: 200});
    Object.defineProperty(document, "hidden", {configurable: true, value: false});
});
afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
});

const activeProfile = async () => {
    jest.spyOn(McpService, "listKeys").mockResolvedValue({data: [key], status: 200});
    const result = render(<McpKeysSection />);
    await waitFor(() => expect(screen.getByRole("button", {name: pl.mcp.reveal})).toBeEnabled());
    return result;
};

test("keeps a saved key masked and fetches its secret only after clicking reveal", async () => {
    await activeProfile();

    expect(screen.getByLabelText(pl.mcp.keyTitle)).toHaveValue(maskedKey);
    expect(McpService.revealKey).not.toHaveBeenCalled();
    expect(screen.queryByLabelText(pl.mcp.name)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {name: pl.mcp.reveal}));

    expect(await screen.findByDisplayValue("mcp_secret")).toHaveAttribute("readonly");
    expect(McpService.revealKey).toHaveBeenCalledWith("key-id");
});

test("hides the secret after five seconds and allows manual hiding", async () => {
    await activeProfile();
    jest.useFakeTimers();
    await act(async () => { fireEvent.click(screen.getByRole("button", {name: pl.mcp.reveal})); });
    expect(screen.getByLabelText(pl.mcp.keyTitle)).toHaveValue("mcp_secret");

    act(() => { jest.advanceTimersByTime(5000); });
    expect(screen.getByLabelText(pl.mcp.keyTitle)).toHaveValue(maskedKey);
    expect(screen.queryByDisplayValue("mcp_secret")).not.toBeInTheDocument();

    await act(async () => { fireEvent.click(screen.getByRole("button", {name: pl.mcp.reveal})); });
    fireEvent.click(screen.getByRole("button", {name: pl.mcp.hide}));
    expect(screen.getByLabelText(pl.mcp.keyTitle)).toHaveValue(maskedKey);
});

test("hides on window blur and ignores a reveal response that arrives after blur", async () => {
    await activeProfile();
    fireEvent.click(screen.getByRole("button", {name: pl.mcp.reveal}));
    await screen.findByDisplayValue("mcp_secret");
    fireEvent.blur(window);
    expect(screen.getByLabelText(pl.mcp.keyTitle)).toHaveValue(maskedKey);
    let finish: (response: {data: {key: string}; status: number}) => void = () => {};
    jest.spyOn(McpService, "revealKey").mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    fireEvent.click(screen.getByRole("button", {name: pl.mcp.reveal}));
    fireEvent.blur(window);
    await act(async () => { finish({data: {key: "mcp_late-secret"}, status: 200}); });

    expect(screen.getByLabelText(pl.mcp.keyTitle)).toHaveValue(maskedKey);
    expect(screen.queryByDisplayValue("mcp_late-secret")).not.toBeInTheDocument();
});

test("hides the secret when the tab becomes hidden", async () => {
    await activeProfile();
    fireEvent.click(screen.getByRole("button", {name: pl.mcp.reveal}));
    await screen.findByDisplayValue("mcp_secret");
    Object.defineProperty(document, "hidden", {configurable: true, value: true});
    fireEvent(document, new Event("visibilitychange"));

    expect(screen.getByLabelText(pl.mcp.keyTitle)).toHaveValue(maskedKey);
});

test("copies an existing key without displaying it", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {configurable: true, value: {writeText}});
    await activeProfile();
    fireEvent.click(screen.getByRole("button", {name: pl.mcp.copy}));

    expect(await screen.findByText(pl.mcp.copied)).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith("mcp_secret");
    expect(screen.getByLabelText(pl.mcp.keyTitle)).toHaveValue(maskedKey);
});

test("generates a key and initially keeps its value masked", async () => {
    jest.spyOn(McpService, "listKeys").mockResolvedValueOnce({data: [], status: 200})
        .mockResolvedValue({data: [key], status: 200});
    const generate = jest.spyOn(McpService, "generateKey").mockResolvedValue({data: {mcpKey: key, key: "mcp_secret"}, status: 201});
    render(<McpKeysSection />);
    await waitFor(() => expect(screen.getByRole("button", {name: pl.mcp.generate})).toBeEnabled());
    fireEvent.change(screen.getByLabelText(pl.mcp.name), {target: {value: " Assistant "}});
    fireEvent.click(screen.getByRole("button", {name: pl.mcp.generate}));

    await waitFor(() => expect(screen.getByLabelText(pl.mcp.keyTitle)).toHaveValue(maskedKey));
    expect(generate).toHaveBeenCalledWith({name: "Assistant", expiresAt: null});
    expect(screen.queryByDisplayValue("mcp_secret")).not.toBeInTheDocument();
    expect(McpService.revealKey).not.toHaveBeenCalled();
});

test("explains why a legacy hash-only key cannot be revealed", async () => {
    jest.spyOn(McpService, "revealKey").mockRejectedValue({status: 409, message: "Legacy key"});
    await activeProfile();
    fireEvent.click(screen.getByRole("button", {name: pl.mcp.reveal}));

    expect(await screen.findByText(pl.mcp.revealUnavailable)).toBeInTheDocument();
    expect(screen.getByLabelText(pl.mcp.keyTitle)).toHaveValue(maskedKey);
});

test("disables creating and revealing keys when the administrator blocks MCP", async () => {
    jest.spyOn(McpService, "listKeys").mockResolvedValue({data: [key], status: 200});
    jest.spyOn(McpService, "ownAccess").mockResolvedValue({data: {enabled: false, modules: {}}, status: 200});
    render(<McpKeysSection />);
    await screen.findByText(pl.mcp.disabled);

    expect(screen.getByRole("button", {name: pl.mcp.reveal})).toBeDisabled();
    expect(screen.getByRole("button", {name: pl.mcp.newKeyOptions})).toBeDisabled();
});

test("validates the name and expiry before calling the backend", async () => {
    const generate = jest.spyOn(McpService, "generateKey");
    render(<McpKeysSection />);
    await waitFor(() => expect(screen.getByRole("button", {name: pl.mcp.generate})).toBeEnabled());
    fireEvent.click(screen.getByRole("button", {name: pl.mcp.generate}));
    expect(await screen.findByText(pl.mcp.nameRequired)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(pl.mcp.name), {target: {value: "Assistant"}});
    fireEvent.change(screen.getByLabelText(pl.mcp.expiresAt), {target: {value: "2000-01-01T10:00"}});
    fireEvent.click(screen.getByRole("button", {name: pl.mcp.generate}));

    expect(await screen.findByText(pl.mcp.expiryInvalid)).toBeInTheDocument();
    expect(generate).not.toHaveBeenCalled();
});

test("revokes an existing key and refreshes its status", async () => {
    jest.spyOn(McpService, "listKeys").mockResolvedValueOnce({data: [key], status: 200})
        .mockResolvedValue({data: [{...key, status: "REVOKED"}], status: 200});
    jest.spyOn(window, "confirm").mockReturnValue(true);
    const revoke = jest.spyOn(McpService, "revokeKey").mockResolvedValue({data: undefined, status: 204});
    render(<McpKeysSection />);
    const button = await screen.findByRole("button", {name: pl.mcp.revoke});
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);

    await waitFor(() => expect(revoke).toHaveBeenCalledWith("key-id"));
    await waitFor(() => expect(screen.getByLabelText(pl.mcp.keyTitle)).toHaveValue(""));
});

test("keeps creation disabled when loading permissions fails", async () => {
    jest.spyOn(McpService, "ownAccess").mockRejectedValue({message: "Permission service unavailable"});
    render(<McpKeysSection />);

    expect(await screen.findByText("Permission service unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", {name: pl.mcp.generate})).toBeDisabled();
});
