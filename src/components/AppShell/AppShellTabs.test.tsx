import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import AppShell from "./AppShell";
import {AppTabDefinition} from "./types";

jest.mock("../../auth/AuthSession", () => ({initializeAuthSession: jest.fn()}));
jest.mock("../../auth/AuthState", () => ({
    useAuthState: () => ({status: "authenticated", user: {role: "ADMIN", username: "admin", userId: {value: 1}}}),
}));
jest.mock("./OperatorCapabilitiesContext", () => ({useOperatorCapabilities: () => ({returnsStatus: "available"})}));
jest.mock("../Announcements/AnnouncementBanner", () => () => null);
jest.mock("../Impersonation/ImpersonationBanner", () => () => null);
jest.mock("../Impersonation/ImpersonationConsentBanner", () => () => null);
jest.mock("./AppFooter", () => () => null);
jest.mock("../Chat/OrganizationChatDock", () => () => null);
jest.mock("../Onboarding/UserOnboardingFlow", () => () => null);
jest.mock("../Chat/ChatDockContext", () => ({
    OrganizationChatDockProvider: ({children}: {children: React.ReactNode}) => <>{children}</>,
}));
jest.mock("../Navbar/Navbar", () => ({onOpenTab}: {onOpenTab: (tab: AppTabDefinition) => void}) => (
    <nav>
        <button type="button" onClick={() => onOpenTab({label: "Scanner", path: "/shipment-scanner"})}>open scanner</button>
        <button type="button" onClick={() => onOpenTab({label: "Route", path: "/shipment-route"})}>open route</button>
    </nav>
));
jest.mock("./AppTabs", () => ({openTabs, onSelectTab}: {
    openTabs: AppTabDefinition[];
    onSelectTab: (path: string) => void;
}) => (
    <div>
        {openTabs.map((tab) => (
            <button key={tab.path} type="button" onClick={() => onSelectTab(tab.path)}>{`tab ${tab.path}`}</button>
        ))}
    </div>
));
jest.mock("./AppRoutes", () => ({location}: {location: string | {pathname: string}}) => (
    <input aria-label={`field ${typeof location === "string" ? location : location.pathname}`} />
));

describe("AppShell tabs", () => {
    it("keeps the state of a tab after switching to another tab and back", () => {
        render(
            <MemoryRouter initialEntries={["/"]}>
                <AppShell />
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole("button", {name: "open route"}));
        fireEvent.change(screen.getByLabelText("field /shipment-route"), {target: {value: "TN-1"}});
        fireEvent.click(screen.getByRole("button", {name: "open scanner"}));

        expect(screen.getByLabelText("field /shipment-scanner")).toBeVisible();
        expect(screen.getByLabelText("field /shipment-route")).not.toBeVisible();

        fireEvent.click(screen.getByRole("button", {name: "tab /shipment-route"}));

        expect(screen.getByLabelText("field /shipment-route")).toBeVisible();
        expect(screen.getByLabelText("field /shipment-route")).toHaveValue("TN-1");
    });
});
