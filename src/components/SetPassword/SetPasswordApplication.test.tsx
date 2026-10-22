import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import UserInvitationService from "../../hooks/UserInvitationService";
import pl from "../../i18n/translate";
import SetPasswordApplication from "./SetPasswordApplication";

jest.mock("../../hooks/UserInvitationService", () => ({
    __esModule: true,
    default: {
        verify: jest.fn(),
        accept: jest.fn(),
    },
}));

const mockedService = UserInvitationService as jest.Mocked<typeof UserInvitationService>;

const renderPage = (search = "?token=abc") => render(
    <MemoryRouter initialEntries={[`/set-password${search}`]}>
        <SetPasswordApplication/>
    </MemoryRouter>,
);

const passwordField = () => screen.getByLabelText(new RegExp(`^${pl.setPassword.password}`)) as HTMLInputElement;
const confirmationField = () => screen.getByLabelText(new RegExp(`^${pl.setPassword.passwordConfirmation}`)) as HTMLInputElement;

describe("SetPasswordApplication", () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("sets the password for a valid invitation", async () => {
        mockedService.verify.mockResolvedValue({data: {username: "KUR-01", expiresAt: "2026-10-25T08:00:00Z"}, status: 200});
        mockedService.accept.mockResolvedValue({data: undefined, status: 204});

        renderPage();

        expect(await screen.findByText("KUR-01")).toBeInTheDocument();
        fireEvent.change(passwordField(), {target: {value: "Secret123"}});
        fireEvent.change(confirmationField(), {target: {value: "Secret123"}});
        fireEvent.click(screen.getByRole("button", {name: pl.setPassword.submit}));

        await waitFor(() => expect(mockedService.accept).toHaveBeenCalledWith({token: "abc", password: "Secret123"}));
        expect(await screen.findByText(pl.setPassword.success)).toBeInTheDocument();
    });

    it("does not submit mismatched passwords", async () => {
        mockedService.verify.mockResolvedValue({data: {username: "KUR-01", expiresAt: "2026-10-25T08:00:00Z"}, status: 200});

        renderPage();

        await screen.findByText("KUR-01");
        fireEvent.change(passwordField(), {target: {value: "Secret123"}});
        fireEvent.change(confirmationField(), {target: {value: "Secret124"}});
        fireEvent.click(screen.getByRole("button", {name: pl.setPassword.submit}));

        expect(await screen.findByText(pl.setPassword.errors.mismatch)).toBeInTheDocument();
        expect(mockedService.accept).not.toHaveBeenCalled();
    });

    it("explains an expired invitation", async () => {
        mockedService.verify.mockRejectedValue({status: 400, message: "expired", details: {code: "EXPIRED"}});

        renderPage();

        expect(await screen.findByText(pl.setPassword.errors.expired)).toBeInTheDocument();
        expect(screen.queryByRole("button", {name: pl.setPassword.submit})).not.toBeInTheDocument();
    });

    it("rejects a link without a token", () => {
        renderPage("");

        expect(screen.getByText(pl.setPassword.errors.notFound)).toBeInTheDocument();
        expect(mockedService.verify).not.toHaveBeenCalled();
    });
});
