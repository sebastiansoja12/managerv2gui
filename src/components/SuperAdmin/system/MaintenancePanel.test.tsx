import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import PlatformSystemService from "../../../hooks/PlatformSystemService";
import pl from "../../../i18n/translate";
import MaintenancePanel from "./MaintenancePanel";

jest.mock("../../../hooks/PlatformSystemService", () => ({
    __esModule: true,
    default: {
        getMaintenance: jest.fn(),
        updateMaintenance: jest.fn(),
    },
}));

jest.mock("../../../api/errorMessage", () => ({
    getBackendErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

const service = PlatformSystemService as jest.Mocked<typeof PlatformSystemService>;

describe("MaintenancePanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("enables maintenance with message after confirmation", async () => {
        service.getMaintenance.mockResolvedValue({enabled: false});
        service.updateMaintenance.mockResolvedValue({enabled: true, message: "Aktualizacja", updatedBy: "owner"});
        render(<MaintenancePanel />);
        await screen.findByText(pl.superAdmin.maintenance.disabled);

        fireEvent.change(screen.getByPlaceholderText(pl.superAdmin.maintenance.messagePlaceholder), {target: {value: " Aktualizacja "}});
        fireEvent.click(screen.getByRole("button", {name: pl.superAdmin.maintenance.enable}));
        fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", {name: pl.superAdmin.maintenance.enable}));

        await waitFor(() => expect(service.updateMaintenance).toHaveBeenCalledWith({enabled: true, message: "Aktualizacja"}));
        expect(await screen.findByText(pl.superAdmin.maintenance.enabledNotice)).toBeInTheDocument();
        expect(screen.getByText(/@owner/)).toBeInTheDocument();
    });

    test("disables maintenance without confirmation", async () => {
        service.getMaintenance.mockResolvedValue({enabled: true, message: "Przerwa"});
        service.updateMaintenance.mockResolvedValue({enabled: false, message: "Przerwa"});
        render(<MaintenancePanel />);

        fireEvent.click(await screen.findByRole("button", {name: pl.superAdmin.maintenance.disable}));

        await waitFor(() => expect(service.updateMaintenance).toHaveBeenCalledWith({enabled: false, message: "Przerwa"}));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    test("shows load error", async () => {
        service.getMaintenance.mockRejectedValue(new Error("network"));

        render(<MaintenancePanel />);

        expect(await screen.findByText(pl.superAdmin.maintenance.loadError)).toBeInTheDocument();
    });
});
