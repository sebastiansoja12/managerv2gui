import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import CourierConfigurationService from "../../hooks/CourierConfigurationService";
import pl from "../../i18n/translate";
import CourierConfigurationPolicyPanel from "./CourierConfigurationPolicyPanel";

jest.mock("../../hooks/CourierConfigurationService", () => ({
    __esModule: true,
    default: {getPolicy: jest.fn(), updatePolicy: jest.fn()},
}));

const mockedService = CourierConfigurationService as jest.Mocked<typeof CourierConfigurationService>;
const translation = pl.globalConfiguration.courierConfiguration;
const policy = {
    enforcedSettings: {REQUIRE_PICKUP_SCAN: true},
    version: 3,
    updatedAt: null,
    updatedBy: null,
};

const settingGroup = (setting: keyof typeof translation.settings) =>
    screen.getByRole("radiogroup", {name: `${translation.settings[setting].label}: ${translation.policy.modeLabel}`});

describe("CourierConfigurationPolicyPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedService.getPolicy.mockResolvedValue({data: policy, status: 200} as never);
    });

    it("shows enforced settings with their descriptions", async () => {
        render(<CourierConfigurationPolicyPanel/>);

        await waitFor(() => expect(settingGroup("REQUIRE_PICKUP_SCAN")).toBeInTheDocument());
        expect(within(settingGroup("REQUIRE_PICKUP_SCAN"))
            .getByRole("radio", {name: translation.policy.modes.ENFORCED_ON})).toBeChecked();
        expect(within(settingGroup("AUTO_GENERATE_LABELS"))
            .getByRole("radio", {name: translation.policy.modes.SUPPLIER})).toBeChecked();
        expect(screen.getByText(translation.settings.REQUIRE_PICKUP_SCAN.description)).toBeInTheDocument();
        expect(screen.getByRole("button", {name: translation.actions.savePolicy})).toBeDisabled();
    });

    it("saves the policy after a mode is changed", async () => {
        mockedService.updatePolicy.mockResolvedValue({
            data: {...policy, version: 4, enforcedSettings: {REQUIRE_PICKUP_SCAN: true, AUTO_GENERATE_LABELS: false}},
            status: 200,
        } as never);
        render(<CourierConfigurationPolicyPanel/>);

        await waitFor(() => expect(settingGroup("AUTO_GENERATE_LABELS")).toBeInTheDocument());
        fireEvent.click(within(settingGroup("AUTO_GENERATE_LABELS"))
            .getByRole("radio", {name: translation.policy.modes.ENFORCED_OFF}));

        expect(screen.getByText(translation.messages.unsavedChanges)).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", {name: translation.actions.savePolicy}));

        await waitFor(() => expect(mockedService.updatePolicy).toHaveBeenCalledWith({
            version: 3,
            enforcedSettings: {REQUIRE_PICKUP_SCAN: true, AUTO_GENERATE_LABELS: false},
        }));
        expect(await screen.findByText(translation.messages.policySaved)).toBeInTheDocument();
        expect(screen.queryByText(translation.messages.unsavedChanges)).not.toBeInTheDocument();
    });
});
