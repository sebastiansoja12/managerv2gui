import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import pl from "../../i18n/translate";
import {defaultRegionalConfiguration} from "./model/OperatorSettingsConfiguration";
import RegionalConfigurationPanel from "./RegionalConfigurationPanel";

jest.mock("../../hooks/OperatorConfigurationService", () => ({
    __esModule: true,
    default: {
        getCurrentRegionalConfiguration: jest.fn(),
        updateCurrentRegionalConfiguration: jest.fn(),
    },
}));

const serviceMock = jest.mocked(OperatorConfigurationService);
const labels = pl.globalConfiguration.regionalConfiguration;

describe("RegionalConfigurationPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        serviceMock.getCurrentRegionalConfiguration.mockResolvedValue({
            data: {...defaultRegionalConfiguration, workingDayStart: "07:00"},
            status: 200,
        });
        serviceMock.updateCurrentRegionalConfiguration.mockImplementation(async (configuration) => ({
            data: configuration,
            status: 200,
        }));
    });

    const saveButton = () => screen.getByRole("button", {name: pl.common.saveChanges});

    it("loads regional settings and saves the changed configuration", async () => {
        render(<RegionalConfigurationPanel />);

        const start = await screen.findByDisplayValue("07:00");
        expect(saveButton()).toBeDisabled();

        fireEvent.click(screen.getByRole("checkbox", {name: labels.fields.saturdayWorkingDay.label}));
        fireEvent.click(saveButton());

        await waitFor(() => expect(serviceMock.updateCurrentRegionalConfiguration).toHaveBeenCalledWith({
            ...defaultRegionalConfiguration,
            workingDayStart: "07:00",
            saturdayWorkingDay: true,
        }));
        expect(await screen.findByText(pl.globalConfiguration.operatorSettings.saved)).toBeInTheDocument();
        expect(start).toBeInTheDocument();
    });

    it("blocks saving when the working day ends before it starts", async () => {
        render(<RegionalConfigurationPanel />);

        const end = await screen.findByDisplayValue("16:00");
        fireEvent.change(end, {target: {value: "06:00"}});

        expect(screen.getByText(labels.workingHoursOrderError)).toBeInTheDocument();
        expect(saveButton()).toBeDisabled();
        expect(serviceMock.updateCurrentRegionalConfiguration).not.toHaveBeenCalled();
    });
});
