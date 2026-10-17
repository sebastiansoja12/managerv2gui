import React from "react";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import ImpersonationService from "../../hooks/ImpersonationService";
import MaintenanceService from "../../hooks/MaintenanceService";
import pl from "../../i18n/translate";
import MaintenanceGate from "./MaintenanceGate";
import {clearMaintenance, isMaintenanceResponse, reportMaintenance} from "./maintenanceStore";

jest.mock("../../hooks/MaintenanceService", () => ({
    __esModule: true,
    default: {
        getPublicStatus: jest.fn(),
    },
}));

jest.mock("../../hooks/ImpersonationService", () => ({
    __esModule: true,
    default: {
        getCurrent: jest.fn(),
    },
}));

const getPublicStatus = MaintenanceService.getPublicStatus as jest.Mock;
const getImpersonation = ImpersonationService.getCurrent as jest.Mock;

describe("MaintenanceGate", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        act(() => clearMaintenance());
        getImpersonation.mockResolvedValue(null);
    });

    test("renders application when maintenance is disabled", async () => {
        getPublicStatus.mockResolvedValue({enabled: false});

        render(<MaintenanceGate><span>Aplikacja</span></MaintenanceGate>);

        await waitFor(() => expect(getPublicStatus).toHaveBeenCalled());
        expect(screen.getByText("Aplikacja")).toBeInTheDocument();
    });

    test("shows maintenance screen with custom message", async () => {
        getPublicStatus.mockResolvedValue({enabled: true, message: "Wracamy o 22:00"});

        render(<MaintenanceGate><span>Aplikacja</span></MaintenanceGate>);

        expect(await screen.findByText("Wracamy o 22:00")).toBeInTheDocument();
        expect(screen.getByText(pl.maintenance.title)).toBeInTheDocument();
        expect(screen.queryByText("Aplikacja")).not.toBeInTheDocument();
    });

    test("lets impersonating platform owner work during maintenance", async () => {
        getPublicStatus.mockResolvedValue({enabled: true, message: null});
        getImpersonation.mockResolvedValue({platformOwnerId: 1, platformOwnerUsername: "owner"});

        render(<MaintenanceGate><span>Aplikacja</span></MaintenanceGate>);

        await waitFor(() => expect(getImpersonation).toHaveBeenCalled());
        expect(screen.getByText("Aplikacja")).toBeInTheDocument();
    });

    test("returns to application when maintenance ends", async () => {
        getPublicStatus
            .mockResolvedValueOnce({enabled: true, message: null})
            .mockResolvedValueOnce({enabled: false});
        render(<MaintenanceGate><span>Aplikacja</span></MaintenanceGate>);
        expect(await screen.findByText(pl.maintenance.defaultMessage)).toBeInTheDocument();

        fireEvent.click((await screen.findByText(pl.maintenance.retry)).closest("button") as HTMLButtonElement);

        expect(await screen.findByText("Aplikacja")).toBeInTheDocument();
        expect(getPublicStatus).toHaveBeenCalledTimes(2);
    });

    test("reports maintenance from failed requests", () => {
        getPublicStatus.mockReturnValue(new Promise(() => undefined));
        render(<MaintenanceGate><span>Aplikacja</span></MaintenanceGate>);

        act(() => reportMaintenance("  Przerwa techniczna  "));

        expect(screen.getByText("Przerwa techniczna")).toBeInTheDocument();
    });

    test("recognizes maintenance responses only", () => {
        expect(isMaintenanceResponse(503, {maintenance: true})).toBe(true);
        expect(isMaintenanceResponse(503, "Service Unavailable")).toBe(false);
        expect(isMaintenanceResponse(500, {maintenance: true})).toBe(false);
    });
});
