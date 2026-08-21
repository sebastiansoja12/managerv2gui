import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import OperatorAdministrationService from "../../../hooks/OperatorAdministrationService";
import pl from "../../../i18n/translate";
import OperatorSubscriptionPanel from "./OperatorSubscriptionPanel";

jest.mock("../../../hooks/OperatorAdministrationService", () => ({
    __esModule: true,
    default: {
        getSubscription: jest.fn(),
        assignSubscription: jest.fn(),
    },
}));

jest.mock("../../../api/errorMessage", () => ({
    getBackendErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

const service = OperatorAdministrationService as jest.Mocked<typeof OperatorAdministrationService>;

const expiredSubscription = {
    operatorId: {value: 20},
    plan: "BASIC" as const,
    startDate: "2026-01-01",
    endDate: "2026-09-30",
    status: "EXPIRED" as const,
    updatedBy: "owner",
    updatedAt: "2026-01-01T10:00:00Z",
};

describe("OperatorSubscriptionPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("shows assigned plan with translated status", async () => {
        service.getSubscription.mockResolvedValue(expiredSubscription);

        render(<OperatorSubscriptionPanel operatorId="20" />);

        expect(await screen.findByText(pl.superAdmin.subscription.statuses.EXPIRED)).toBeInTheDocument();
        expect(screen.getByRole("combobox", {name: pl.superAdmin.subscription.plan})).toHaveTextContent(pl.subscription.plans.BASIC);
        expect(screen.getByLabelText(pl.superAdmin.subscription.endDate)).toHaveValue("2026-09-30");
        expect(service.getSubscription).toHaveBeenCalledWith("20");
    });

    test("explains that operator without plan is not restricted", async () => {
        service.getSubscription.mockResolvedValue(null);

        render(<OperatorSubscriptionPanel operatorId="20" />);

        expect(await screen.findByText(pl.superAdmin.subscription.empty)).toBeInTheDocument();
        expect(screen.getByRole("button", {name: pl.superAdmin.subscription.save})).toBeDisabled();
        expect(screen.getByText(pl.superAdmin.subscription.required)).toBeInTheDocument();
    });

    test("changes plan and validity period", async () => {
        service.getSubscription.mockResolvedValue(expiredSubscription);
        service.assignSubscription.mockResolvedValue({
            ...expiredSubscription,
            plan: "ENTERPRISE",
            startDate: "2026-10-01",
            endDate: "2027-09-30",
            status: "ACTIVE",
        });
        render(<OperatorSubscriptionPanel operatorId="20" />);
        await waitFor(() => expect(screen.getByRole("button", {name: pl.superAdmin.subscription.save})).toBeEnabled());

        fireEvent.change(screen.getByRole("combobox", {name: pl.superAdmin.subscription.plan}), {target: {value: "ENTERPRISE"}});
        fireEvent.change(screen.getByLabelText(pl.superAdmin.subscription.startDate), {target: {value: "2026-10-01"}});
        fireEvent.change(screen.getByLabelText(pl.superAdmin.subscription.endDate), {target: {value: "2027-09-30"}});
        fireEvent.click(screen.getByRole("button", {name: pl.superAdmin.subscription.save}));

        await waitFor(() => expect(service.assignSubscription).toHaveBeenCalledWith("20", {
            plan: "ENTERPRISE",
            startDate: "2026-10-01",
            endDate: "2027-09-30",
        }));
        expect(await screen.findByText(pl.superAdmin.subscription.saved)).toBeInTheDocument();
        expect(screen.getByText(pl.superAdmin.subscription.statuses.ACTIVE)).toBeInTheDocument();
    });

    test("blocks end date before start date", async () => {
        service.getSubscription.mockResolvedValue(expiredSubscription);
        render(<OperatorSubscriptionPanel operatorId="20" />);
        await waitFor(() => expect(screen.getByRole("button", {name: pl.superAdmin.subscription.save})).toBeEnabled());

        fireEvent.change(screen.getByLabelText(pl.superAdmin.subscription.startDate), {target: {value: "2026-10-31"}});
        fireEvent.change(screen.getByLabelText(pl.superAdmin.subscription.endDate), {target: {value: "2026-10-01"}});

        expect(screen.getByRole("button", {name: pl.superAdmin.subscription.save})).toBeDisabled();
        expect(screen.getByText(pl.superAdmin.subscription.rangeInvalid)).toBeInTheDocument();
        expect(service.assignSubscription).not.toHaveBeenCalled();
    });

    test("shows backend error when saving fails", async () => {
        service.getSubscription.mockResolvedValue(expiredSubscription);
        service.assignSubscription.mockRejectedValue(new Error("forbidden"));
        render(<OperatorSubscriptionPanel operatorId="20" />);
        await waitFor(() => expect(screen.getByRole("button", {name: pl.superAdmin.subscription.save})).toBeEnabled());

        fireEvent.click(screen.getByRole("button", {name: pl.superAdmin.subscription.save}));

        expect(await screen.findByText(pl.superAdmin.subscription.saveError)).toBeInTheDocument();
    });
});
