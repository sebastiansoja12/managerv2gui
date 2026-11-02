import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import pl from "../../i18n/translate";
import {defaultPickupPointConfiguration} from "./model/OperatorSettingsConfiguration";
import PickupPointConfigurationPanel from "./PickupPointConfigurationPanel";

jest.mock("../../hooks/OperatorConfigurationService", () => ({
    __esModule: true,
    default: {
        getCurrentPickupPointConfiguration: jest.fn(),
        updateCurrentPickupPointConfiguration: jest.fn(),
    },
}));

const serviceMock = jest.mocked(OperatorConfigurationService);
const labels = pl.globalConfiguration.pickupPointConfiguration;

describe("PickupPointConfigurationPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        serviceMock.getCurrentPickupPointConfiguration.mockResolvedValue({
            data: defaultPickupPointConfiguration,
            status: 200,
        });
        serviceMock.updateCurrentPickupPointConfiguration.mockImplementation(async (configuration) => ({
            data: configuration,
            status: 200,
        }));
    });

    it("saves edited policies back in the nested API shape", async () => {
        render(<PickupPointConfigurationPanel />);

        const codeLength = await screen.findByRole("spinbutton", {name: labels.fields.pickupCodeLength.label});
        await waitFor(() => expect(codeLength).toHaveValue(6));
        fireEvent.change(codeLength, {target: {value: "8"}});
        fireEvent.click(screen.getByRole("checkbox", {name: labels.fields.sameDepartmentOnly.label}));
        fireEvent.click(screen.getByRole("button", {name: pl.common.saveChanges}));

        await waitFor(() => expect(serviceMock.updateCurrentPickupPointConfiguration).toHaveBeenCalledWith({
            ...defaultPickupPointConfiguration,
            collectionPolicy: {...defaultPickupPointConfiguration.collectionPolicy, pickupCodeLength: 8},
            selectionPolicy: {...defaultPickupPointConfiguration.selectionPolicy, sameDepartmentOnly: true},
        }));
    });

    it("disables Saturday hours when points are closed on Saturdays", async () => {
        render(<PickupPointConfigurationPanel />);

        const saturdayOpen = await screen.findByRole("checkbox", {name: labels.fields.saturdayOpen.label});
        await waitFor(() => expect(saturdayOpen).toBeChecked());
        fireEvent.click(saturdayOpen);

        expect(screen.getByLabelText(labels.fields.saturdayOpeningTime.label)).toBeDisabled();
        expect(screen.getByLabelText(labels.fields.saturdayClosingTime.label)).toBeDisabled();
    });

    it("blocks saving when weekday closing is before opening", async () => {
        render(<PickupPointConfigurationPanel />);

        const closing = await screen.findByLabelText(labels.fields.weekdayClosingTime.label);
        await waitFor(() => expect(closing).toHaveValue("20:00"));
        fireEvent.change(closing, {target: {value: "07:00"}});

        expect(screen.getByText(labels.validation.weekdayHoursOrder)).toBeInTheDocument();
        expect(screen.getByRole("button", {name: pl.common.saveChanges})).toBeDisabled();
    });
});
