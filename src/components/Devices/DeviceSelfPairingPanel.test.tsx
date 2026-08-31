import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import QRCode from "qrcode";
import DeviceService from "../../hooks/DeviceService";
import pl from "../../i18n/translate";
import DeviceSelfPairingPanel from "./DeviceSelfPairingPanel";

jest.mock("../../hooks/DeviceService", () => ({
    __esModule: true,
    default: {issuePairingCode: jest.fn()},
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
const translations = pl.devices.selfPairing;

describe("DeviceSelfPairingPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (mockedQrCode.toDataURL as jest.Mock).mockResolvedValue("data:image/png;base64,qr");
    });

    it("shows a pairing QR code generated for the current account", async () => {
        mockedDeviceService.issuePairingCode.mockResolvedValue({
            data: {activationCode: "WXYZ-2345", expiresAt: new Date(Date.now() + 60_000).toISOString()},
        } as never);
        render(<DeviceSelfPairingPanel/>);

        fireEvent.click(screen.getByRole("button", {name: translations.generate}));

        expect(await screen.findByText("WXYZ-2345")).toBeInTheDocument();
        expect(screen.getByAltText(translations.qrAlt)).toBeInTheDocument();
        expect(screen.getByText(translations.nextStep)).toBeInTheDocument();
        const payload = JSON.parse((mockedQrCode.toDataURL as jest.Mock).mock.calls[0][0]);
        expect(payload).toEqual(expect.objectContaining({type: "MANAGER_DEVICE_ACTIVATION", activationCode: "WXYZ-2345"}));
    });

    it("reports an error when the code cannot be generated", async () => {
        mockedDeviceService.issuePairingCode.mockRejectedValue(new Error("boom"));
        render(<DeviceSelfPairingPanel/>);

        fireEvent.click(screen.getByRole("button", {name: translations.generate}));

        expect(await screen.findByText(translations.error)).toBeInTheDocument();
    });
});
