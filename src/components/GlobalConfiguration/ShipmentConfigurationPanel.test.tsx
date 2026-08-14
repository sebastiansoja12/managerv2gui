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
});
