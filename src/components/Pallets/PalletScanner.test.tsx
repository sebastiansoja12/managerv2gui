import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import PalletService from "../../hooks/PalletService";
import pl from "../../i18n/translate";
import PalletScanner, {resolveScanState} from "./PalletScanner";

jest.mock("../../hooks/PalletService", () => ({
    __esModule: true,
    palletErrorCode: (error: {details?: {properties?: {code?: string}}}) => error?.details?.properties?.code ?? null,
    palletErrorDetail: () => null,
    default: {scan: jest.fn()},
}));

const mockedPalletService = PalletService as jest.Mocked<typeof PalletService>;

const scan = (trackingNumber: string) => {
    fireEvent.change(screen.getByLabelText(pl.pallets.scanner.inputLabel), {target: {value: trackingNumber}});
    fireEvent.click(screen.getByRole("button", {name: pl.pallets.scanner.submit}));
};

describe("PalletScanner", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("shows loaded pallet with shipment results", async () => {
        mockedPalletService.scan.mockResolvedValue({
            status: 200,
            data: {
                palletId: "pallet-1",
                trackingNumber: "PAL1",
                palletStatus: "READY",
                success: true,
                alreadyLoaded: false,
                shipments: [{shipmentId: {value: "9007199254740993"}, success: true, shipmentStatus: "SENT"}],
            },
        });
        render(<PalletScanner />);

        scan(" pal1 ");

        expect(await screen.findByText(pl.pallets.scanner.feedback.loaded)).toBeInTheDocument();
        expect(mockedPalletService.scan).toHaveBeenCalledWith("PAL1");
        expect(screen.getByText("9007199254740993")).toBeInTheDocument();
    });

    it("shows partial failure when some shipments were not updated", async () => {
        mockedPalletService.scan.mockResolvedValue({
            status: 200,
            data: {
                palletId: "pallet-1",
                trackingNumber: "PAL1",
                palletStatus: "READY",
                success: false,
                alreadyLoaded: false,
                errorCode: "SHIPMENT_STATUS_UPDATE_FAILED",
                shipments: [
                    {shipmentId: {value: "1"}, success: true, shipmentStatus: "SENT"},
                    {shipmentId: {value: "2"}, success: false, errorMessage: "Delivered shipment cannot be changed"},
                ],
            },
        });
        render(<PalletScanner />);

        scan("PAL1");

        expect(await screen.findByText(pl.pallets.scanner.feedback.partial)).toBeInTheDocument();
        expect(screen.getByText("Delivered shipment cannot be changed")).toBeInTheDocument();
    });

    it("shows translated message when pallet service is unavailable", async () => {
        mockedPalletService.scan.mockRejectedValue({
            status: 503,
            message: "Backend request failed",
            details: {properties: {code: "PALLET_SERVICE_UNAVAILABLE"}},
        });
        render(<PalletScanner />);

        scan("PAL1");

        expect(await screen.findByText(pl.pallets.errors.PALLET_SERVICE_UNAVAILABLE)).toBeInTheDocument();
    });

    it("does not call backend for an empty tracking number", () => {
        render(<PalletScanner />);

        scan("   ");

        expect(mockedPalletService.scan).not.toHaveBeenCalled();
        expect(screen.getByText(pl.pallets.scanner.validation.trackingNumberRequired)).toBeInTheDocument();
    });

    it("resolves rejected state for scan without shipment results", () => {
        expect(resolveScanState({trackingNumber: "PAL1", success: false, alreadyLoaded: false, shipments: []})).toBe("rejected");
        expect(resolveScanState({trackingNumber: "PAL1", success: true, alreadyLoaded: true, shipments: []})).toBe("alreadyLoaded");
    });
});
