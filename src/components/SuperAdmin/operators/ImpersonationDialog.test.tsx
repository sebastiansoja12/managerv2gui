import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import ImpersonationConsentService from "../../../hooks/ImpersonationConsentService";
import SuperAdminAuthService from "../../../hooks/SuperAdminAuthService";
import pl from "../../../i18n/translate";
import {ImpersonationConsent} from "../../Impersonation/model/ImpersonationConsent";
import ImpersonationDialog from "./ImpersonationDialog";

jest.mock("../../../hooks/ImpersonationConsentService", () => ({
    __esModule: true,
    default: {
        getLatest: jest.fn(),
        request: jest.fn(),
    },
}));

jest.mock("../../../hooks/SuperAdminAuthService", () => ({
    __esModule: true,
    default: {
        startImpersonation: jest.fn(),
    },
}));

jest.mock("../../../api/errorMessage", () => ({
    getBackendErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

const consentService = ImpersonationConsentService as jest.Mocked<typeof ImpersonationConsentService>;
const startMock = SuperAdminAuthService.startImpersonation as jest.Mock;
const texts = pl.superAdmin.impersonation;

const consent = (status: ImpersonationConsent["status"]): ImpersonationConsent => ({
    id: 7,
    operatorId: 20,
    platformOwnerId: 1,
    platformOwnerUsername: "owner",
    status,
    requestedAt: "2026-10-17T10:00:00Z",
    requestExpiresAt: "2026-10-18T10:00:00Z",
    decidedByUsername: status === "PENDING" ? null : "superadmin",
    accessExpiresAt: status === "APPROVED" ? "2026-10-17T11:00:00Z" : null,
});

const renderDialog = () => render(
    <ImpersonationDialog onClose={jest.fn()} open operatorId="20" operatorName="Acme" />,
);

describe("ImpersonationDialog", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("requires consent before entering the operator application", async () => {
        consentService.getLatest.mockResolvedValue(null);
        consentService.request.mockResolvedValue(consent("PENDING"));

        renderDialog();

        expect(await screen.findByText(texts.consentRequired)).toBeInTheDocument();
        expect(screen.getByRole("button", {name: texts.confirm})).toBeDisabled();

        fireEvent.change(screen.getByLabelText(texts.reasonLabel), {target: {value: "Pomoc"}});
        fireEvent.click(screen.getByRole("button", {name: texts.requestConsent}));

        await waitFor(() => expect(consentService.request).toHaveBeenCalledWith("20", "Pomoc"));
        const pendingPrefix = texts.pending.split("{")[0];
        expect(await screen.findByText((content) => content.startsWith(pendingPrefix))).toBeInTheDocument();
        expect(screen.getByRole("button", {name: texts.confirm})).toBeDisabled();
    });

    test("shows that operator did not consent", async () => {
        consentService.getLatest.mockResolvedValue(consent("REJECTED"));

        renderDialog();

        expect(await screen.findByText(texts.rejected.replace("{user}", "@superadmin"))).toBeInTheDocument();
        expect(screen.getByRole("button", {name: texts.confirm})).toBeDisabled();
        expect(screen.getByRole("button", {name: texts.requestConsent})).toBeEnabled();
    });

    test("enters the application after approval", async () => {
        consentService.getLatest.mockResolvedValue(consent("APPROVED"));
        startMock.mockResolvedValue({data: {}});
        const openMock = jest.spyOn(window, "open").mockImplementation(() => null);

        renderDialog();

        const enter = await screen.findByRole("button", {name: texts.confirm});
        await waitFor(() => expect(enter).toBeEnabled());
        fireEvent.click(enter);

        await waitFor(() => expect(startMock).toHaveBeenCalledWith("20"));
        expect(openMock).toHaveBeenCalledWith("/", "_blank", "noopener");
        openMock.mockRestore();
    });
});
