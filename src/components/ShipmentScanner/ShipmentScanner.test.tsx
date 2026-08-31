import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import AuthService from "../../hooks/AuthService";
import DeviceService from "../../hooks/DeviceService";
import ShipmentCollectService from "../../hooks/ShipmentCollectService";
import pl from "../../i18n/translate";
import ShipmentScanner from "./ShipmentScanner";

jest.mock("../../hooks/AuthService", () => ({
    __esModule: true,
    default: {me: jest.fn()},
}));

jest.mock("../../hooks/DeviceService", () => ({
    __esModule: true,
    default: {
        issuePairingCode: jest.fn(),
        activateDevice: jest.fn(),
        startOperatorSession: jest.fn(),
        endOperatorSession: jest.fn(),
        heartbeat: jest.fn(),
    },
}));

jest.mock("../../hooks/ShipmentCollectService", () => {
    class MockCollectFaultError extends Error {
    }
    return {
        __esModule: true,
        CollectFaultError: MockCollectFaultError,
        default: {collect: jest.fn()},
    };
});

jest.mock("../../api/errorMessage", () => ({
    getBackendErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

const mockedAuthService = AuthService as jest.Mocked<typeof AuthService>;
const mockedDeviceService = DeviceService as jest.Mocked<typeof DeviceService>;
const mockedCollectService = ShipmentCollectService as jest.Mocked<typeof ShipmentCollectService>;

const translations = pl.shipmentScanner;

const scannerDevice = {
    deviceId: {value: "SC:1"},
    version: {value: "1.3.0"},
    deviceType: "SCANNER",
    username: {value: "7"},
    depotCode: {value: "KT1"},
    lastUpdate: null,
    active: true,
    assignmentMode: "SHARED" as const,
};

const storeActivatedBrowser = () => {
    window.localStorage.setItem("manager.browserDevice", JSON.stringify({
        deviceId: "SC:1",
        deviceType: "SCANNER",
        departmentCode: "KT1",
        version: "1.3.0",
        assignmentMode: "SHARED",
        pairKey: "pair-key",
    }));
};

const scanTrackingNumber = (trackingNumber: string) => {
    fireEvent.change(screen.getByLabelText(translations.scanCard.inputLabel), {target: {value: trackingNumber}});
    fireEvent.click(screen.getByRole("button", {name: translations.scanCard.submit}));
};

const renderScanner = () => render(<MemoryRouter><ShipmentScanner/></MemoryRouter>);

describe("ShipmentScanner", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.localStorage.clear();
        window.sessionStorage.clear();
        mockedAuthService.me.mockResolvedValue({data: {userId: {value: 7}, username: "courier", departmentCode: "KT1"}} as never);
        mockedDeviceService.heartbeat.mockResolvedValue({data: {updateRequired: false}} as never);
        mockedDeviceService.endOperatorSession.mockResolvedValue({data: undefined} as never);
        mockedDeviceService.startOperatorSession.mockResolvedValue({
            data: {device: scannerDevice, sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString()},
        } as never);
    });

    it("keeps scanned shipments in memory and rejects duplicates", async () => {
        renderScanner();
        await screen.findByRole("button", {name: translations.device.activateBrowser});

        scanTrackingNumber(" TRK-001 ");
        scanTrackingNumber("TRK-001");

        expect(screen.getByRole("button", {name: translations.pending.remove.replace("{trackingNumber}", "TRK-001")})).toBeInTheDocument();
        expect(screen.getByText(translations.feedback.duplicate)).toBeInTheDocument();
        expect(screen.getByText(translations.pending.count.replace("{count}", "1"))).toBeInTheDocument();
        expect(mockedCollectService.collect).not.toHaveBeenCalled();
    });

    it("requires an activated browser before sending the collect request", async () => {
        renderScanner();
        await screen.findByRole("button", {name: translations.device.activateBrowser});
        scanTrackingNumber("TRK-001");

        fireEvent.click(screen.getByRole("button", {name: translations.pending.save.replace("{count}", "1")}));

        expect(screen.getByText(translations.validation.deviceRequired)).toBeInTheDocument();
        expect(mockedCollectService.collect).not.toHaveBeenCalled();
    });

    it("activates the browser on the current account with one click", async () => {
        mockedDeviceService.issuePairingCode.mockResolvedValue({
            data: {activationCode: "WXYZ-2345", expiresAt: "2027-04-21T10:00:00Z"},
        } as never);
        mockedDeviceService.activateDevice.mockResolvedValue({
            data: {device: scannerDevice, pairKey: "account-pair-key", pairKeyExpiresAt: "2027-04-21T10:00:00Z"},
        } as never);
        renderScanner();

        fireEvent.click(await screen.findByRole("button", {name: translations.device.activateBrowser}));

        expect(await screen.findByText("SC:1")).toBeInTheDocument();
        expect(mockedDeviceService.activateDevice).toHaveBeenCalledWith(expect.objectContaining({
            activationCode: "WXYZ-2345",
            deviceType: "SCANNER",
            installationId: expect.stringMatching(/^web-/),
        }));
        await waitFor(() => expect(mockedDeviceService.startOperatorSession).toHaveBeenCalledWith("account-pair-key"));
    });

    it("activates the browser with an administrator code and starts an operator session", async () => {
        mockedDeviceService.activateDevice.mockResolvedValue({
            data: {device: scannerDevice, pairKey: "new-pair-key", pairKeyExpiresAt: "2027-04-21T10:00:00Z"},
        } as never);
        renderScanner();

        fireEvent.click(await screen.findByRole("button", {name: translations.device.adminCode}));
        fireEvent.change(screen.getByLabelText(translations.device.activationCodeLabel), {target: {value: "ABCD-EFGH"}});
        fireEvent.click(screen.getByRole("button", {name: translations.device.activate}));

        expect(await screen.findByText("SC:1")).toBeInTheDocument();
        expect(mockedDeviceService.activateDevice).toHaveBeenCalledWith(expect.objectContaining({activationCode: "ABCD-EFGH"}));
        expect(mockedDeviceService.issuePairingCode).not.toHaveBeenCalled();
        await waitFor(() => expect(mockedDeviceService.startOperatorSession).toHaveBeenCalledWith("new-pair-key"));
        expect(JSON.parse(window.localStorage.getItem("manager.browserDevice") || "{}").pairKey).toBe("new-pair-key");
    });

    it("sends all scanned shipments on behalf of the activated browser", async () => {
        storeActivatedBrowser();
        mockedCollectService.collect.mockResolvedValue({
            processId: "6f0f3a5e-2d0c-4b8e-9a39-2f7d0d3c1a11",
            success: false,
            details: [
                {trackingNumber: "TRK-001", shipmentId: "100", success: true, errorMessage: null},
                {trackingNumber: "TRK-002", shipmentId: null, success: false, errorMessage: "Shipment was not found"},
            ],
        });
        renderScanner();
        await screen.findByText(translations.page.readyStatus);
        scanTrackingNumber("TRK-001");
        scanTrackingNumber("TRK-002");

        fireEvent.click(screen.getByRole("button", {name: translations.pending.save.replace("{count}", "2")}));

        await screen.findByText(translations.feedback.partial);
        expect(mockedCollectService.collect).toHaveBeenCalledWith(expect.objectContaining({
            trackingNumbers: ["TRK-001", "TRK-002"],
            deviceInformation: expect.objectContaining({deviceId: "SC:1", pairKey: "pair-key", deviceType: "SCANNER"}),
        }));
        expect(screen.getByText("Shipment was not found")).toBeInTheDocument();
        expect(screen.getByText(translations.pending.empty)).toBeInTheDocument();
    });

    it("remembers scanned shipments after leaving the view", async () => {
        storeActivatedBrowser();
        const firstRender = renderScanner();
        await screen.findByText(translations.page.readyStatus);
        scanTrackingNumber("TRK-001");
        firstRender.unmount();

        renderScanner();

        expect(await screen.findByRole("button", {name: translations.pending.remove.replace("{trackingNumber}", "TRK-001")})).toBeInTheDocument();
    });

    it("forgets the browser device when the backend rejects its pair key", async () => {
        storeActivatedBrowser();
        mockedCollectService.collect.mockRejectedValue(new (jest.requireMock("../../hooks/ShipmentCollectService").CollectFaultError)("Invalid device pair key"));
        renderScanner();
        await screen.findByText(translations.page.readyStatus);
        scanTrackingNumber("TRK-001");

        fireEvent.click(screen.getByRole("button", {name: translations.pending.save.replace("{count}", "1")}));

        expect(await screen.findByText(translations.device.credentialsRevoked)).toBeInTheDocument();
        expect(screen.getByRole("button", {name: translations.device.activateBrowser})).toBeInTheDocument();
        expect(window.localStorage.getItem("manager.browserDevice")).toBeNull();
    });
});
