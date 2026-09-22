import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import pl from "../../i18n/translate";
import CommunicationConfigurationPanel from "./CommunicationConfigurationPanel";
import {defaultCommunicationConfiguration} from "./model/OperatorSettingsConfiguration";

jest.mock("../../hooks/OperatorConfigurationService", () => ({
    __esModule: true,
    default: {
        getCurrentCommunicationConfiguration: jest.fn(),
        updateCurrentCommunicationConfiguration: jest.fn(),
    },
}));

const serviceMock = jest.mocked(OperatorConfigurationService);
const labels = pl.globalConfiguration.communicationConfiguration;
const validation = pl.globalConfiguration.operatorSettings.validation;

describe("CommunicationConfigurationPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        serviceMock.getCurrentCommunicationConfiguration.mockResolvedValue({
            data: defaultCommunicationConfiguration,
            status: 200,
        });
    });

    it("rejects an invalid reply-to address and accent color", async () => {
        render(<CommunicationConfigurationPanel />);

        const replyTo = await screen.findByRole("textbox", {name: labels.fields.replyToEmail.label});
        fireEvent.change(replyTo, {target: {value: "not-an-email"}});
        fireEvent.change(screen.getByDisplayValue("#1E88E5"), {target: {value: "blue"}});

        expect(screen.getByText(validation.email)).toBeInTheDocument();
        expect(screen.getByText(validation.color)).toBeInTheDocument();
        expect(screen.getByRole("button", {name: pl.common.saveChanges})).toBeDisabled();
    });
});
