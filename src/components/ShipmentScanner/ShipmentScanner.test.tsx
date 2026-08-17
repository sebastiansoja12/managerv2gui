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
    default: {currentUserDevices: jest.fn()},
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

const scanTrackingNumber = (trackingNumber: string) => {
    fireEvent.change(screen.getByLabelText(pl.shipmentScanner.scanCard.inputLabel), {target: {value: trackingNumber}});
    fireEvent.click(screen.getByRole("button", {name: pl.shipmentScanner.scanCard.submit}));
};

describe("ShipmentScanner", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.localStorage.clear();
        window.sessionStorage.clear();
        mockedAuthService.me.mockResolvedValue({data: {userId: {value: 7}, username: "courier", departmentCode: "KT1"}} as never);
        mockedDeviceService.currentUserDevices.mockResolvedValue({
            data: [{
                deviceId: {value: "SC:1"},
                version: {value: "1.3.0"},
                deviceType: "SCANNER",
                username: {value: "courier"},
                depotCode: {value: "KT1"},
                lastUpdate: null,
                active: true,
            }],
        } as never);
    });

    const renderScanner = async () => {
        render(<MemoryRouter><ShipmentScanner/></MemoryRouter>);
        await screen.findByText(pl.shipmentScanner.device.pairKeyLabel);
    };

    it("keeps scanned shipments in memory and rejects duplicates", async () => {
        await renderScanner();

        scanTrackingNumber(" TRK-001 ");
        scanTrackingNumber("TRK-001");

        expect(screen.getByRole("button", {name: pl.shipmentScanner.pending.remove.replace("{trackingNumber}", "TRK-001")})).toBeInTheDocument();
        expect(screen.getByText(pl.shipmentScanner.feedback.duplicate)).toBeInTheDocument();
        expect(screen.getByText(pl.shipmentScanner.pending.count.replace("{count}", "1"))).toBeInTheDocument();
        expect(mockedCollectService.collect).not.toHaveBeenCalled();
    });

    it("requires a pair key before sending the collect request", async () => {
        await renderScanner();
        scanTrackingNumber("TRK-001");

        fireEvent.click(screen.getByRole("button", {name: pl.shipmentScanner.pending.save.replace("{count}", "1")}));

        expect(screen.getByText(pl.shipmentScanner.validation.pairKeyRequired)).toBeInTheDocument();
        expect(mockedCollectService.collect).not.toHaveBeenCalled();
    });

    it("sends all scanned shipments and shows which ones were not collected", async () => {
        mockedCollectService.collect.mockResolvedValue({
            processId: "6f0f3a5e-2d0c-4b8e-9a39-2f7d0d3c1a11",
            success: false,
            details: [
                {trackingNumber: "TRK-001", shipmentId: "100", success: true, errorMessage: null},
                {trackingNumber: "TRK-002", shipmentId: null, success: false, errorMessage: "Shipment was not found"},
            ],
        });
        await renderScanner();
        scanTrackingNumber("TRK-001");
        scanTrackingNumber("TRK-002");
        fireEvent.change(screen.getByLabelText(pl.shipmentScanner.device.pairKeyLabel), {target: {value: "pair-key"}});

        fireEvent.click(screen.getByRole("button", {name: pl.shipmentScanner.pending.save.replace("{count}", "2")}));

        await screen.findByText(pl.shipmentScanner.feedback.partial);
        expect(mockedCollectService.collect).toHaveBeenCalledWith(expect.objectContaining({
            trackingNumbers: ["TRK-001", "TRK-002"],
            deviceInformation: expect.objectContaining({deviceId: "SC:1", pairKey: "pair-key", deviceType: "SCANNER"}),
        }));
        expect(screen.getByText("Shipment was not found")).toBeInTheDocument();
        await waitFor(() => expect(screen.getByText(pl.shipmentScanner.result.summary
            .replace("{collected}", "1")
            .replace("{total}", "2"))).toBeInTheDocument());
        expect(screen.getByText(pl.shipmentScanner.pending.empty)).toBeInTheDocument();
    });

    it("remembers the pair key and scanned shipments after leaving the view", async () => {
        const firstRender = render(<MemoryRouter><ShipmentScanner/></MemoryRouter>);
        await screen.findByText(pl.shipmentScanner.device.pairKeyLabel);
        scanTrackingNumber("TRK-001");
        fireEvent.change(screen.getByLabelText(pl.shipmentScanner.device.pairKeyLabel), {target: {value: "pair-key"}});
        firstRender.unmount();

        render(<MemoryRouter><ShipmentScanner/></MemoryRouter>);

        await waitFor(() => expect(screen.getByLabelText(pl.shipmentScanner.device.pairKeyLabel)).toHaveValue("pair-key"));
        expect(screen.getByText(pl.shipmentScanner.device.pairKeySaved)).toBeInTheDocument();
        expect(screen.getByRole("button", {name: pl.shipmentScanner.pending.remove.replace("{trackingNumber}", "TRK-001")})).toBeInTheDocument();
    });

    it("forgets a pair key rejected by the backend", async () => {
        mockedCollectService.collect.mockRejectedValue(new (jest.requireMock("../../hooks/ShipmentCollectService").CollectFaultError)("Invalid device pair key"));
        await renderScanner();
        scanTrackingNumber("TRK-001");
        fireEvent.change(screen.getByLabelText(pl.shipmentScanner.device.pairKeyLabel), {target: {value: "expired-key"}});

        fireEvent.click(screen.getByRole("button", {name: pl.shipmentScanner.pending.save.replace("{count}", "1")}));

        await screen.findByText("Invalid device pair key");
        expect(screen.getByLabelText(pl.shipmentScanner.device.pairKeyLabel)).toHaveValue("");
        expect(window.localStorage.getItem("manager.devicePairKeys.7")).toBeNull();
    });
});
