import React from "react";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {setAuthenticated, setUnauthenticated} from "../../auth/AuthState";
import {CurrentUserDto} from "../../auth/UserProfileDto";
import ImpersonationConsentService from "../../hooks/ImpersonationConsentService";
import ImpersonationService from "../../hooks/ImpersonationService";
import pl from "../../i18n/translate";
import ImpersonationConsentBanner from "./ImpersonationConsentBanner";
import ImpersonationConsentNotifications from "./ImpersonationConsentNotifications";
import {stopImpersonationConsentPolling} from "./impersonationConsentStore";
import {ImpersonationConsent} from "./model/ImpersonationConsent";

jest.mock("../../hooks/ImpersonationService", () => ({
    __esModule: true,
    default: {getCurrent: jest.fn()},
}));

jest.mock("../../hooks/ImpersonationConsentService", () => ({
    __esModule: true,
    default: {
        getPending: jest.fn(),
        getActive: jest.fn(),
        approve: jest.fn(),
        reject: jest.fn(),
        revoke: jest.fn(),
    },
}));

jest.mock("../../api/errorMessage", () => ({
    getBackendErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

const service = ImpersonationConsentService as jest.Mocked<typeof ImpersonationConsentService>;
const getCurrentMock = ImpersonationService.getCurrent as jest.Mock;
const texts = pl.impersonationConsent;

const pendingConsent: ImpersonationConsent = {
    id: 7,
    operatorId: 20,
    platformOwnerId: 1,
    platformOwnerUsername: "owner",
    reason: "Problem z etykietami",
    status: "PENDING",
    requestedAt: "2026-10-17T10:00:00Z",
    requestExpiresAt: "2026-10-18T10:00:00Z",
};

const activeConsent: ImpersonationConsent = {
    ...pendingConsent,
    status: "APPROVED",
    decidedByUsername: "superadmin",
    accessExpiresAt: "2026-10-17T11:00:00Z",
};

const signIn = (role: string) => {
    act(() => {
        setAuthenticated({username: "superadmin", role} as unknown as CurrentUserDto);
    });
};

const renderShell = () => render(
    <>
        <ImpersonationConsentBanner />
        <ImpersonationConsentNotifications />
    </>,
);

describe("ImpersonationConsentBanner", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getCurrentMock.mockResolvedValue(null);
        service.getPending.mockResolvedValue([]);
        service.getActive.mockResolvedValue([]);
    });

    afterEach(() => {
        act(() => {
            stopImpersonationConsentPolling();
            setUnauthenticated();
        });
    });

    test("does not poll consents for users below superadministrator", async () => {
        signIn("ADMIN");

        const {container} = render(<ImpersonationConsentBanner />);

        await waitFor(() => expect(container).toBeEmptyDOMElement());
        expect(getCurrentMock).not.toHaveBeenCalled();
        expect(service.getPending).not.toHaveBeenCalled();
    });

    test("does not ask the impersonating platform owner for consent", async () => {
        signIn("SUPERADMIN");
        getCurrentMock.mockResolvedValue({platformOwnerId: 1, platformOwnerUsername: "owner"});

        render(<ImpersonationConsentBanner />);

        await waitFor(() => expect(getCurrentMock).toHaveBeenCalled());
        expect(service.getPending).not.toHaveBeenCalled();
    });

    test("shows pending request in the top bar and notification badge", async () => {
        signIn("SUPERADMIN");
        service.getPending.mockResolvedValue([pendingConsent]);

        renderShell();

        expect(await screen.findByText(texts.requestTitle)).toBeInTheDocument();
        expect(screen.getByText(/Problem z etykietami/)).toBeInTheDocument();
        expect(screen.getByRole("button", {name: texts.notificationsCount.replace("{count}", "1")})).toBeInTheDocument();
    });

    test("approves request for the selected duration", async () => {
        signIn("SUPERADMIN");
        service.getPending.mockResolvedValueOnce([pendingConsent]).mockResolvedValue([]);
        service.getActive.mockResolvedValueOnce([]).mockResolvedValue([activeConsent]);
        service.approve.mockResolvedValue(activeConsent);

        render(<ImpersonationConsentBanner />);

        fireEvent.change(await screen.findByLabelText(texts.duration), {target: {value: "120"}});
        fireEvent.click(screen.getByRole("button", {name: texts.approve}));

        await waitFor(() => expect(service.approve).toHaveBeenCalledWith(7, 120));
        expect(await screen.findByText(texts.activeTitle)).toBeInTheDocument();
    });

    test("rejects request", async () => {
        signIn("SUPERADMIN");
        service.getPending.mockResolvedValueOnce([pendingConsent]).mockResolvedValue([]);
        service.reject.mockResolvedValue({...pendingConsent, status: "REJECTED"});

        const {container} = render(<ImpersonationConsentBanner />);

        fireEvent.click(await screen.findByRole("button", {name: texts.reject}));

        await waitFor(() => expect(service.reject).toHaveBeenCalledWith(7));
        await waitFor(() => expect(container).toBeEmptyDOMElement());
    });

    test("revokes active access", async () => {
        signIn("SUPERADMIN");
        service.getActive.mockResolvedValueOnce([activeConsent]).mockResolvedValue([]);
        service.revoke.mockResolvedValue({...activeConsent, status: "REVOKED"});

        render(<ImpersonationConsentBanner />);

        fireEvent.click(await screen.findByRole("button", {name: texts.revoke}));

        await waitFor(() => expect(service.revoke).toHaveBeenCalledWith(7));
    });

    test("lists requests in the notifications popover", async () => {
        signIn("SUPERADMIN");
        service.getPending.mockResolvedValue([pendingConsent]);

        renderShell();

        const bell = await screen.findByRole("button", {name: texts.notificationsCount.replace("{count}", "1")});
        fireEvent.click(bell);

        expect(screen.getByRole("dialog", {name: texts.notificationsTitle})).toBeInTheDocument();
        expect(screen.getAllByRole("button", {name: texts.approve})).toHaveLength(2);
    });

    test("shows empty notifications without a badge", async () => {
        renderShell();

        fireEvent.click(screen.getByRole("button", {name: pl.navigation.notifications}));

        expect(screen.getByText(texts.notificationsEmpty)).toBeInTheDocument();
    });
});
