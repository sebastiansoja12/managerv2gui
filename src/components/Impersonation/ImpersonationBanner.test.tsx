import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {logoutAuthSession} from "../../auth/AuthSession";
import ImpersonationService from "../../hooks/ImpersonationService";
import pl from "../../i18n/translate";
import ImpersonationBanner from "./ImpersonationBanner";

jest.mock("../../hooks/ImpersonationService", () => ({
    __esModule: true,
    default: {
        getCurrent: jest.fn(),
    },
}));

jest.mock("../../auth/AuthSession", () => ({
    logoutAuthSession: jest.fn(),
}));

const getCurrentMock = ImpersonationService.getCurrent as jest.Mock;
const logoutMock = logoutAuthSession as jest.Mock;

describe("ImpersonationBanner", () => {
    const originalLocation = window.location;

    beforeEach(() => {
        jest.clearAllMocks();
        Object.defineProperty(window, "location", {
            configurable: true,
            value: {...originalLocation, assign: jest.fn()},
        });
    });

    afterEach(() => {
        Object.defineProperty(window, "location", {configurable: true, value: originalLocation});
    });

    test("renders nothing for a regular session", async () => {
        getCurrentMock.mockResolvedValue(null);

        const {container} = render(<ImpersonationBanner />);

        await waitFor(() => expect(getCurrentMock).toHaveBeenCalled());
        expect(container).toBeEmptyDOMElement();
    });

    test("shows platform owner who impersonates the operator", async () => {
        getCurrentMock.mockResolvedValue({platformOwnerId: 3, platformOwnerUsername: "owner"});

        render(<ImpersonationBanner />);

        expect(await screen.findByText(pl.superAdmin.impersonation.bannerTitle)).toBeInTheDocument();
        expect(screen.getByText(/@owner/)).toBeInTheDocument();
    });

    test("ends session and returns to operator panel", async () => {
        getCurrentMock.mockResolvedValue({platformOwnerId: 3, platformOwnerUsername: "owner"});
        logoutMock.mockResolvedValue(undefined);
        render(<ImpersonationBanner />);

        fireEvent.click(await screen.findByRole("button", {name: pl.superAdmin.impersonation.end}));

        await waitFor(() => expect(window.location.assign).toHaveBeenCalledWith("/super-admin/operators"));
        expect(logoutMock).toHaveBeenCalled();
    });

    test("stays hidden when impersonation status cannot be loaded", async () => {
        getCurrentMock.mockRejectedValue(new Error("network"));

        const {container} = render(<ImpersonationBanner />);

        await waitFor(() => expect(getCurrentMock).toHaveBeenCalled());
        expect(container).toBeEmptyDOMElement();
    });
});
