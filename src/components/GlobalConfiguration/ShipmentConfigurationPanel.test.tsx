import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import pl from "../../i18n/translate";
import ShipmentConfigurationPanel from "./ShipmentConfigurationPanel";

const SHIPMENT_CONFIGURATION_STORAGE_KEY = "manager.globalConfiguration.shipments";

describe("ShipmentConfigurationPanel", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("renders proposed shipment settings and stores changes only in the browser", () => {
        render(<ShipmentConfigurationPanel />);

        const addressValidation = screen.getByRole("checkbox", {
            name: pl.globalConfiguration.shipmentConfiguration.fields.validateAddressData.label,
        });
        expect(addressValidation).toBeChecked();
        expect(screen.getByText(pl.globalConfiguration.shipmentConfiguration.categories.labels)).toBeInTheDocument();
        expect(screen.getByText(pl.globalConfiguration.shipmentConfiguration.categories.limits)).toBeInTheDocument();
        expect(screen.getByText(pl.globalConfiguration.shipmentConfiguration.categories.workflow)).toBeInTheDocument();
        expect(screen.getByText(pl.globalConfiguration.shipmentConfiguration.categories.notifications)).toBeInTheDocument();
        expect(screen.getByRole("checkbox", {
            name: pl.globalConfiguration.shipmentConfiguration.fields.requireRecipientEmail.label,
        })).not.toBeChecked();

        fireEvent.click(addressValidation);
        fireEvent.click(screen.getByRole("button", {name: pl.common.saveChanges}));

        const storedConfiguration = JSON.parse(
            window.localStorage.getItem(SHIPMENT_CONFIGURATION_STORAGE_KEY) || "{}",
        );
        expect(storedConfiguration.validateAddressData).toBe(false);
        expect(screen.getByText(pl.globalConfiguration.shipmentConfiguration.messages.saved)).toBeInTheDocument();
    });

    it("configures and stores the tracking number rule locally", () => {
        render(<ShipmentConfigurationPanel />);

        fireEvent.click(screen.getByRole("button", {
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

        const storedConfiguration = JSON.parse(
            window.localStorage.getItem(SHIPMENT_CONFIGURATION_STORAGE_KEY) || "{}",
        );
        expect(storedConfiguration.trackingNumberKey).toBe("CLIENT");
        expect(storedConfiguration.trackingNumberSource).toBe("shipmentId");
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.getByText("CLIENT-20260814-582104")).toBeInTheDocument();
    });
});
