import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import pl from "../../i18n/translate";
import {defaultSortingConfiguration} from "./model/OperatorSettingsConfiguration";
import SortingConfigurationPanel from "./SortingConfigurationPanel";

jest.mock("../../hooks/OperatorConfigurationService", () => ({
    __esModule: true,
    default: {
        getCurrentSortingConfiguration: jest.fn(),
        updateCurrentSortingConfiguration: jest.fn(),
    },
}));

const serviceMock = jest.mocked(OperatorConfigurationService);
const labels = pl.globalConfiguration.sortingConfiguration;

describe("SortingConfigurationPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        serviceMock.getCurrentSortingConfiguration.mockResolvedValue({
            data: defaultSortingConfiguration,
            status: 200,
        });
        serviceMock.updateCurrentSortingConfiguration.mockImplementation(async (configuration) => ({
            data: configuration,
            status: 200,
        }));
    });

    it("saves required scans and the exception ramp code", async () => {
        render(<SortingConfigurationPanel />);

        const outboundScan = await screen.findByRole("checkbox", {name: labels.fields.requireOutboundScan.label});
        await waitFor(() => expect(outboundScan).toBeChecked());
        fireEvent.click(outboundScan);
        fireEvent.change(screen.getByRole("textbox", {name: labels.fields.exceptionRampCode.label}), {
            target: {value: "R-12"},
        });
        fireEvent.click(screen.getByRole("button", {name: pl.common.saveChanges}));

        await waitFor(() => expect(serviceMock.updateCurrentSortingConfiguration).toHaveBeenCalledWith({
            ...defaultSortingConfiguration,
            requireOutboundScan: false,
            exceptionRampCode: "R-12",
        }));
    });

    it("rejects a non-positive missing-in-warehouse threshold", async () => {
        render(<SortingConfigurationPanel />);

        const threshold = await screen.findByDisplayValue("24");
        fireEvent.change(threshold, {target: {value: "0"}});

        expect(screen.getByText(pl.globalConfiguration.operatorSettings.validation.min.replace("{min}", "1")))
            .toBeInTheDocument();
        expect(screen.getByRole("button", {name: pl.common.saveChanges})).toBeDisabled();
    });
});
