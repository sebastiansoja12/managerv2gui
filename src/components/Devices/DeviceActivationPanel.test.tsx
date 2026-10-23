import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import QRCode from "qrcode";
import DeviceService from "../../hooks/DeviceService";
import pl from "../../i18n/translate";
import DeviceActivationPanel from "./DeviceActivationPanel";

jest.mock("../../hooks/DeviceService", () => ({
    __esModule: true,
    default: {
        allDevices: jest.fn(),
        issueActivationCode: jest.fn(),
        revokePairing: jest.fn(),
        updateOwnership: jest.fn(),
    },
}));

jest.mock("qrcode", () => ({
    __esModule: true,
    default: {toDataURL: jest.fn()},
}));

jest.mock("../../api/errorMessage", () => ({
    getBackendErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

const mockedDeviceService = DeviceService as jest.Mocked<typeof DeviceService>;
const mockedQrCode = QRCode as jest.Mocked<typeof QRCode>;

const translations = pl.devices.activation;

const device = {
    deviceId: {value: "MB:1"},
    version: {value: "1.0.0"},
    deviceType: "MOBILE",
    username: {value: "7"},
    depotCode: {value: "KT1"},
    lastUpdate: null,
    active: true,
    assignmentMode: "PERSONAL" as const,
};

describe("DeviceActivationPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedDeviceService.allDevices.mockResolvedValue({data: [device]} as never);
        (mockedQrCode.toDataURL as jest.Mock).mockResolvedValue("data:image/png;base64,qr");
    });

    it("shows the activation code and QR for the selected device", async () => {
        mockedDeviceService.issueActivationCode.mockResolvedValue({
            data: {activationCode: "ABCD-EFGH", expiresAt: new Date(Date.now() + 60_000).toISOString()},
        } as never);
        render(<DeviceActivationPanel onNotice={jest.fn()}/>);

        fireEvent.click(await screen.findByRole("button", {name: translations.actions.activate}));

        expect(await screen.findByText("ABCD-EFGH")).toBeInTheDocument();
        expect(screen.getByAltText(translations.dialog.qrAlt)).toBeInTheDocument();
        expect(mockedDeviceService.issueActivationCode).toHaveBeenCalledWith("MB:1");
        const payload = JSON.parse((mockedQrCode.toDataURL as jest.Mock).mock.calls[0][0]);
        expect(payload).toEqual(expect.objectContaining({type: "MANAGER_DEVICE_ACTIVATION", activationCode: "ABCD-EFGH"}));
    });

    it("deregisters a device only after confirmation", async () => {
        mockedDeviceService.revokePairing.mockResolvedValue({data: undefined} as never);
        const onNotice = jest.fn();
        render(<DeviceActivationPanel onNotice={onNotice}/>);

        fireEvent.click(await screen.findByRole("button", {name: translations.actions.revoke}));
        expect(mockedDeviceService.revokePairing).not.toHaveBeenCalled();
        const confirmButtons = screen.getAllByRole("button", {name: translations.revokeDialog.confirm});
        fireEvent.click(confirmButtons[confirmButtons.length - 1]);

        await waitFor(() => expect(mockedDeviceService.revokePairing).toHaveBeenCalledWith("MB:1"));
        await waitFor(() => expect(onNotice).toHaveBeenCalledWith({severity: "success", message: translations.messages.revoked}));
    });

    it("reports a load error when devices cannot be fetched", async () => {
        mockedDeviceService.allDevices.mockRejectedValue(new Error("boom"));

        render(<DeviceActivationPanel onNotice={jest.fn()}/>);

        expect(await screen.findByText(translations.messages.loadError)).toBeInTheDocument();
    });
});
