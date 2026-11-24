import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import PalletService from "../../hooks/PalletService";
import ShipmentService from "../../hooks/ShipmentService";
import pl from "../../i18n/translate";
import PalletUnload from "./PalletUnload";
import {missingShipments, resolveUnloadScan} from "./palletUnloadScan";

jest.mock("../../hooks/PalletService", () => ({
    __esModule: true,
    palletErrorCode: () => null,
    palletErrorDetail: () => null,
    default: {getByTrackingNumber: jest.fn(), unload: jest.fn()},
}));
jest.mock("../../hooks/ShipmentService", () => ({__esModule: true, default: {getControlCenter: jest.fn()}}));
jest.mock("../ShipmentScanner/scanFeedbackSound", () => ({playScanFeedback: jest.fn()}));

const palletService = PalletService as jest.Mocked<typeof PalletService>;
const shipmentService = ShipmentService as jest.Mocked<typeof ShipmentService>;
const translations = pl.pallets.unload;

const pallet = {
    palletId: "pallet-1",
    trackingNumber: "PAL000000000001",
    palletStatus: "IN_TRANSIT",
    shipmentIds: ["9007199254740993", "9007199254740995"],
    empty: false,
    loadable: false,
};

const trackingNumbers: Record<string, string> = {"9007199254740993": "FTM-1", "9007199254740995": "FTM-2"};

const renderUnload = (path = "/pallets/unload/PAL000000000001") => render(
    <MemoryRouter initialEntries={[path]}>
        <Routes>
            <Route path="/pallets/unload" element={<PalletUnload />} />
            <Route path="/pallets/unload/:trackingNumber" element={<PalletUnload />} />
        </Routes>
    </MemoryRouter>
);

const scanShipment = (code: string) => {
    fireEvent.change(screen.getByLabelText(translations.shipmentInputLabel), {target: {value: code}});
    fireEvent.click(screen.getByRole("button", {name: translations.shipmentSubmit}));
};

describe("resolveUnloadScan", () => {
    const shipments = [{shipmentId: "1", trackingNumber: "FTM-1"}, {shipmentId: "2", trackingNumber: null}];

    it("matches tracking numbers case-insensitively and shipment IDs", () => {
        expect(resolveUnloadScan(" ftm-1 ", shipments, new Set())).toEqual({state: "scanned", shipment: shipments[0]});
        expect(resolveUnloadScan("2", shipments, new Set())).toEqual({state: "scanned", shipment: shipments[1]});
    });

    it("reports duplicates, foreign shipments and empty codes", () => {
        expect(resolveUnloadScan("FTM-1", shipments, new Set(["1"])).state).toBe("duplicate");
        expect(resolveUnloadScan("FTM-9", shipments, new Set())).toEqual({state: "notOnPallet", code: "FTM-9"});
        expect(resolveUnloadScan("  ", shipments, new Set()).state).toBe("invalidCode");
        expect(missingShipments(shipments, new Set(["1"]))).toEqual([shipments[1]]);
    });
});

describe("PalletUnload", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        palletService.getByTrackingNumber.mockResolvedValue({status: 200, data: pallet} as never);
        shipmentService.getControlCenter.mockImplementation((shipmentId: string) => Promise.resolve(
            {status: 200, data: {shipment: {trackingNumber: {value: trackingNumbers[shipmentId]}}}} as never));
        palletService.unload.mockResolvedValue({status: 200, data: {...pallet, palletStatus: "DELIVERED"}} as never);
    });

    it("unloads without missing shipments when everything is scanned", async () => {
        renderUnload();
        await screen.findByText("FTM-1");

        scanShipment("FTM-1");
        expect(await screen.findByText(translations.feedback.scanned)).toBeInTheDocument();
        scanShipment("FTM-1");
        expect(await screen.findByText(translations.feedback.duplicate)).toBeInTheDocument();
        scanShipment("FTM-9");
        expect(await screen.findByText(translations.feedback.notOnPallet)).toBeInTheDocument();
        scanShipment("ftm-2");
        expect(await screen.findByText(translations.feedback.allScanned)).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", {name: translations.finish}));

        await waitFor(() => expect(palletService.unload).toHaveBeenCalledWith("pallet-1", []));
        expect(await screen.findByText(translations.feedback.unloaded)).toBeInTheDocument();
    });

    it("reports unscanned shipments as missing after confirmation", async () => {
        renderUnload();
        await screen.findByText("FTM-1");
        scanShipment("FTM-1");

        fireEvent.click(screen.getByRole("button", {name: translations.finish}));
        const dialog = await screen.findByRole("dialog");
        expect(within(dialog).getByText("FTM-2")).toBeInTheDocument();
        fireEvent.click(within(dialog).getByRole("button", {name: translations.confirmFinish}));

        await waitFor(() => expect(palletService.unload).toHaveBeenCalledWith("pallet-1", ["9007199254740995"]));
        expect(await screen.findByText(translations.feedback.unloadedWithMissing)).toBeInTheDocument();
    });

    it("accepts all shipments after scanning only the pallet number and confirming the warning", async () => {
        renderUnload("/pallets/unload");
        fireEvent.click(screen.getByLabelText(translations.palletOnly.label));
        fireEvent.change(screen.getByLabelText(translations.palletInputLabel), {target: {value: "PAL000000000001"}});
        fireEvent.click(screen.getByRole("button", {name: translations.palletSubmit}));

        const dialog = await screen.findByRole("dialog");
        expect(within(dialog).getByText(translations.palletOnly.confirmTitle)).toBeInTheDocument();
        fireEvent.click(within(dialog).getByRole("button", {name: translations.palletOnly.acceptAll}));

        await waitFor(() => expect(palletService.unload).toHaveBeenCalledWith("pallet-1", []));
        expect(await screen.findByText(translations.feedback.unloaded)).toBeInTheDocument();
        expect(screen.getAllByText(translations.states.scanned)).toHaveLength(2);
    });

    it("returns to shipment scanning when the pallet-only warning is declined", async () => {
        renderUnload("/pallets/unload");
        fireEvent.click(screen.getByLabelText(translations.palletOnly.label));
        fireEvent.change(screen.getByLabelText(translations.palletInputLabel), {target: {value: "PAL000000000001"}});
        fireEvent.click(screen.getByRole("button", {name: translations.palletSubmit}));

        const dialog = await screen.findByRole("dialog");
        fireEvent.click(within(dialog).getByRole("button", {name: translations.palletOnly.scanShipments}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(screen.getByLabelText(translations.shipmentInputLabel)).toBeInTheDocument();
        expect(palletService.unload).not.toHaveBeenCalled();
    });

    it("refuses a pallet that is not in transit", async () => {
        palletService.getByTrackingNumber.mockResolvedValue({status: 200, data: {...pallet, palletStatus: "READY"}} as never);
        renderUnload("/pallets/unload");

        fireEvent.change(screen.getByLabelText(translations.palletInputLabel), {target: {value: "pal000000000001"}});
        fireEvent.click(screen.getByRole("button", {name: translations.palletSubmit}));

        expect(await screen.findByText(translations.feedback.loadError)).toBeInTheDocument();
        expect(palletService.getByTrackingNumber).toHaveBeenCalledWith("PAL000000000001");
        expect(screen.queryByLabelText(translations.shipmentInputLabel)).not.toBeInTheDocument();
    });
});
