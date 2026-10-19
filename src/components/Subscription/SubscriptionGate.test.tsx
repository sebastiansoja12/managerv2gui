import React from "react";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {logoutAuthSession} from "../../auth/AuthSession";
import {setAuthenticated, setUnauthenticated} from "../../auth/AuthState";
import {CurrentUserDto} from "../../auth/UserProfileDto";
import SubscriptionService from "../../hooks/SubscriptionService";
import pl from "../../i18n/translate";
import {formatSubscriptionDate} from "./model/Subscription";
import SubscriptionGate from "./SubscriptionGate";
import {clearInactiveSubscription, isInactiveSubscriptionResponse, reportInactiveSubscription} from "./subscriptionStore";

jest.mock("../../hooks/SubscriptionService", () => ({
    __esModule: true,
    default: {
        getCurrent: jest.fn(),
    },
}));

jest.mock("../../auth/AuthSession", () => ({
    logoutAuthSession: jest.fn(() => Promise.resolve()),
}));

const getCurrent = SubscriptionService.getCurrent as jest.Mock;

const operatorUser = {
    userId: {value: 7},
    operatorId: {value: 20},
    username: "admin",
} as unknown as CurrentUserDto;

describe("SubscriptionGate", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        act(() => {
            clearInactiveSubscription();
            setAuthenticated(operatorUser);
        });
    });

    afterEach(() => {
        act(() => setUnauthenticated());
    });

    test("renders application when subscription allows access", async () => {
        getCurrent.mockResolvedValue({status: "ACTIVE", plan: "BASIC", accessAllowed: true});

        render(<SubscriptionGate><span>Aplikacja</span></SubscriptionGate>);

        expect(await screen.findByText("Aplikacja")).toBeInTheDocument();
        expect(getCurrent).toHaveBeenCalled();
    });

    test("does not render application before subscription is verified", async () => {
        getCurrent.mockReturnValue(new Promise(() => undefined));

        render(<SubscriptionGate><span>Aplikacja</span></SubscriptionGate>);

        await waitFor(() => expect(getCurrent).toHaveBeenCalled());
        expect(screen.queryByText("Aplikacja")).not.toBeInTheDocument();
    });

    test("shows support message when no plan is assigned", async () => {
        getCurrent.mockResolvedValue({status: "NOT_ASSIGNED", accessAllowed: false});

        render(<SubscriptionGate><span>Aplikacja</span></SubscriptionGate>);

        expect(await screen.findByText(pl.subscription.notAssignedTitle)).toBeInTheDocument();
        expect(screen.getByText(pl.subscription.notAssignedMessage)).toBeInTheDocument();
        expect(screen.queryByText("Aplikacja")).not.toBeInTheDocument();
    });

    test("shows support message when plan expired", async () => {
        getCurrent.mockResolvedValue({
            status: "EXPIRED",
            plan: "ENTERPRISE",
            startDate: "2026-01-01",
            endDate: "2026-10-31",
            accessAllowed: false,
        });

        render(<SubscriptionGate><span>Aplikacja</span></SubscriptionGate>);

        expect(await screen.findByText(pl.subscription.expiredTitle)).toBeInTheDocument();
        expect(screen.getByText(pl.subscription.expiredMessage
            .replace("{plan}", pl.subscription.plans.ENTERPRISE)
            .replace("{date}", formatSubscriptionDate("2026-10-31", pl.common.locale)))).toBeInTheDocument();
        expect(screen.queryByText("Aplikacja")).not.toBeInTheDocument();
    });

    test("shows start date when plan has not started", async () => {
        getCurrent.mockResolvedValue({
            status: "NOT_STARTED",
            plan: "MINI",
            startDate: "2026-11-01",
            endDate: "2026-11-30",
            accessAllowed: false,
        });

        render(<SubscriptionGate><span>Aplikacja</span></SubscriptionGate>);

        expect(await screen.findByText(pl.subscription.notStartedTitle)).toBeInTheDocument();
    });

    test("blocks application when backend rejects request because of subscription", async () => {
        getCurrent.mockResolvedValue({status: "ACTIVE", plan: "BASIC", accessAllowed: true});
        render(<SubscriptionGate><span>Aplikacja</span></SubscriptionGate>);
        expect(await screen.findByText("Aplikacja")).toBeInTheDocument();

        act(() => reportInactiveSubscription({status: "EXPIRED", plan: "BASIC", endDate: "2026-10-18", accessAllowed: false}));

        expect(await screen.findByText(pl.subscription.expiredTitle)).toBeInTheDocument();
    });

    test("restores application after plan renewal", async () => {
        getCurrent.mockResolvedValueOnce({status: "EXPIRED", plan: "BASIC", endDate: "2026-10-18", accessAllowed: false})
            .mockResolvedValueOnce({status: "ACTIVE", plan: "BASIC", accessAllowed: true});
        render(<SubscriptionGate><span>Aplikacja</span></SubscriptionGate>);

        fireEvent.click(await screen.findByRole("button", {name: pl.subscription.retry}));

        expect(await screen.findByText("Aplikacja")).toBeInTheDocument();
    });

    test("allows signing out from blocked screen", async () => {
        getCurrent.mockResolvedValue({status: "EXPIRED", plan: "BASIC", endDate: "2026-10-18", accessAllowed: false});
        render(<SubscriptionGate><span>Aplikacja</span></SubscriptionGate>);

        fireEvent.click(await screen.findByRole("button", {name: pl.subscription.logout}));

        await waitFor(() => expect(logoutAuthSession).toHaveBeenCalled());
    });

    test("does not check subscription before sign in", () => {
        act(() => setUnauthenticated());

        render(<SubscriptionGate><span>Logowanie</span></SubscriptionGate>);

        expect(screen.getByText("Logowanie")).toBeInTheDocument();
        expect(getCurrent).not.toHaveBeenCalled();
    });

    test("recognizes inactive subscription responses", () => {
        expect(isInactiveSubscriptionResponse(402, {subscriptionInactive: true})).toBe(true);
        expect(isInactiveSubscriptionResponse(402, {})).toBe(false);
        expect(isInactiveSubscriptionResponse(403, {subscriptionInactive: true})).toBe(false);
    });
});

describe("formatSubscriptionDate", () => {
    test("keeps calendar day regardless of browser time zone", () => {
        expect(formatSubscriptionDate("2026-10-31", "en-US")).toBe("10/31/2026");
        expect(formatSubscriptionDate("2026-01-01", "en-US")).toBe("1/1/2026");
    });

    test("returns empty text for missing date", () => {
        expect(formatSubscriptionDate(null, "en-US")).toBe("");
    });
});
