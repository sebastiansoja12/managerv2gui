import React from "react";
import {render, screen} from "@testing-library/react";
import SubscriptionService from "../../hooks/SubscriptionService";
import pl from "../../i18n/translate";
import {formatSubscriptionDate} from "./model/Subscription";
import OperatorPlanSection from "./OperatorPlanSection";

jest.mock("../../hooks/SubscriptionService", () => ({
    __esModule: true,
    default: {
        getCurrent: jest.fn(),
    },
}));

const getCurrent = SubscriptionService.getCurrent as jest.Mock;

describe("OperatorPlanSection", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("shows operator plan, status and validity period", async () => {
        getCurrent.mockResolvedValue({
            plan: "ENTERPRISE",
            startDate: "2026-01-01",
            endDate: "2026-12-31",
            status: "ACTIVE",
            accessAllowed: true,
        });

        render(<OperatorPlanSection />);

        expect(await screen.findByText(pl.subscription.plans.ENTERPRISE)).toBeInTheDocument();
        expect(screen.getByText(pl.subscription.profile.statuses.ACTIVE)).toBeInTheDocument();
        expect(screen.getByText(formatSubscriptionDate("2026-01-01", pl.common.locale))).toBeInTheDocument();
        expect(screen.getByText(formatSubscriptionDate("2026-12-31", pl.common.locale))).toBeInTheDocument();
        expect(screen.getByText(pl.subscription.profile.renewHint)).toBeInTheDocument();
    });

    test("informs when no plan is assigned", async () => {
        getCurrent.mockResolvedValue({status: "NOT_ASSIGNED", accessAllowed: true});

        render(<OperatorPlanSection />);

        expect(await screen.findByText(pl.subscription.profile.notAssigned)).toBeInTheDocument();
    });

    test("shows error when plan cannot be loaded", async () => {
        getCurrent.mockRejectedValue(new Error("network"));

        render(<OperatorPlanSection />);

        expect(await screen.findByRole("alert")).toHaveTextContent(pl.subscription.profile.loadError);
    });
});
