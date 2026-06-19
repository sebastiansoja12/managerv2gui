import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import pl from "../../i18n/translate";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import ShipmentConfigurationPanel from "./ShipmentConfigurationPanel";
import {ShipmentConfigurationApi} from "./model/ShipmentConfiguration";

const SHIPMENT_CONFIGURATION_STORAGE_KEY = "manager.globalConfiguration.shipments";

jest.mock("../../hooks/OperatorConfigurationService", () => ({
    __esModule: true,
    default: {
        getCurrentShipmentConfiguration: jest.fn(),
        updateCurrentShipmentConfiguration: jest.fn(),
    },
}));

const shipmentConfigurationApi: ShipmentConfigurationApi = {
    validationConfiguration: {
        validateAddressData: true,
        requireRecipientPhone: true,
        requireRecipientEmail: false,
        preventDuplicateTracking: true,
        requireSenderReference: false,
        validatePostalCode: true,
    },
    labelConfiguration: {
        autoGenerateLabels: false,
        includeReturnLabel: false,
        attachPackingSlip: false,
        labelFormat: "PDF_A6",
    },
    shipmentLimits: {
        maxWeight: 31.5,
        minWeight: 0.2,
        maxLength: 120,
        maxWidth: 80,
        maxHeight: 80,
        maxShipmentValue: 5000,
        allowOversized: false,
    },
    workflowConfiguration: {
        defaultStatus: "CREATED",
        defaultServiceLevel: "STANDARD",
        autoAssignCourier: false,
        autoCloseDelivered: true,
        generateTrackingNumber: false,
        cancellationWindowMinutes: 30,
        pickupCutoffTime: "16:00",
    },
    trackingNumberRule: {
        key: "MGR",
        separator: "-",
        source: "SEQUENCE",
        randomLength: 8,
        includeDate: true,
        dateFormat: "YYYYMMDD",
        uppercase: true,
    },
    notificationConfiguration: {
        notifyRecipientOnCreated: true,
        notifyRecipientOnDispatched: true,
        notifyRecipientOnDelivered: true,
        notifySenderOnException: true,
        notificationChannel: "SMS",
    },
};

const operatorConfigurationServiceMock = jest.mocked(OperatorConfigurationService);

describe("ShipmentConfigurationPanel", () => {
    beforeEach(() => {
        window.localStorage.clear();
        jest.clearAllMocks();
        operatorConfigurationServiceMock.getCurrentShipmentConfiguration.mockResolvedValue({
            data: shipmentConfigurationApi,
            status: 200,
        });
        operatorConfigurationServiceMock.updateCurrentShipmentConfiguration.mockResolvedValue({
            data: shipmentConfigurationApi,
            status: 200,
        });
    });

    const waitForConfigurationLoad = async () => {
        await waitFor(() => {
            expect(screen.queryByText(pl.globalConfiguration.shipmentConfiguration.messages.loading))
                .not.toBeInTheDocument();
        });
    };

    it("loads shipment settings from API and saves changes", async () => {
        render(<ShipmentConfigurationPanel />);

        await waitForConfigurationLoad();
        expect(await screen.findByText(pl.globalConfiguration.shipmentConfiguration.categories.labels))
            .toBeInTheDocument();
        const addressValidation = await screen.findByRole("checkbox", {
            name: pl.globalConfiguration.shipmentConfiguration.fields.validateAddressData.label,
        });
        expect(addressValidation).toBeChecked();
        expect(screen.getByText(pl.globalConfiguration.shipmentConfiguration.categories.limits)).toBeInTheDocument();
        expect(screen.getByText(pl.globalConfiguration.shipmentConfiguration.categories.workflow)).toBeInTheDocument();
        expect(screen.getByText(pl.globalConfiguration.shipmentConfiguration.categories.notifications)).toBeInTheDocument();
        expect(screen.getByRole("checkbox", {
            name: pl.globalConfiguration.shipmentConfiguration.fields.requireRecipientEmail.label,
        })).not.toBeChecked();

        fireEvent.click(addressValidation);
        fireEvent.click(screen.getByRole("button", {name: pl.common.saveChanges}));

        await waitFor(() => {
            expect(operatorConfigurationServiceMock.updateCurrentShipmentConfiguration).toHaveBeenCalledWith(
                expect.objectContaining({
                    validationConfiguration: expect.objectContaining({
                        validateAddressData: false,
                    }),
                    shipmentLimits: expect.objectContaining({
                        maxWeight: 31.5,
                        minWeight: 0.2,
                    }),
                }),
            );
        });
        const storedConfiguration = JSON.parse(
            window.localStorage.getItem(SHIPMENT_CONFIGURATION_STORAGE_KEY) || "{}",
        );
        expect(storedConfiguration.validateAddressData).toBe(true);
        expect(await screen.findByText(pl.globalConfiguration.shipmentConfiguration.messages.saved))
            .toBeInTheDocument();
    });

    it("configures the tracking number rule in the draft", async () => {
        render(<ShipmentConfigurationPanel />);

        await waitForConfigurationLoad();
        fireEvent.click(await screen.findByRole("button", {
            name: pl.globalConfiguration.shipmentConfiguration.trackingNumber.configure,
        }));

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText(
            pl.globalConfiguration.shipmentConfiguration.trackingNumber.title,
        )).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText(
            pl.globalConfiguration.shipmentConfiguration.trackingNumber.keyLabel,
        ), {target: {value: "CLIENT"}});
        fireEvent.change(screen.getByLabelText(
            pl.globalConfiguration.shipmentConfiguration.trackingNumber.sourceLabel,
        ), {target: {value: "shipmentId"}});
        fireEvent.click(screen.getByRole("button", {
            name: pl.globalConfiguration.shipmentConfiguration.trackingNumber.save,
        }));

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.getByText("CLIENT-20260814-582104")).toBeInTheDocument();
    });
});
