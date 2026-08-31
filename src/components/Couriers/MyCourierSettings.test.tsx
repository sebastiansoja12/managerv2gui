import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import CourierConfigurationService from "../../hooks/CourierConfigurationService";
import pl from "../../i18n/translate";
import {courierSettingsByGroup} from "./courierConfigurationModel";
import {CourierConfigurationDto, CourierSetting} from "./dto/CourierConfigurationDto";
import MyCourierSettings from "./MyCourierSettings";

jest.mock("../../hooks/CourierConfigurationService", () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        update: jest.fn(),
        resetToDefaults: jest.fn(),
        getHistory: jest.fn(),
        getSubstituteCandidates: jest.fn(),
        getPolicy: jest.fn(),
        updatePolicy: jest.fn(),
    },
}));

const mockedService = CourierConfigurationService as jest.Mocked<typeof CourierConfigurationService>;

const allSettings = Object.values(courierSettingsByGroup).flat() as CourierSetting[];

const configuration: CourierConfigurationDto = {
    supplierId: 11,
    supplierCode: "aezlgwa",
    firstName: "Sebastian",
    lastName: "Soja",
    settings: allSettings.reduce((settings, setting) => ({...settings, [setting]: false}), {} as Record<CourierSetting, boolean>),
    maxDeliveryAttempts: 3,
    maxShipmentsPerRoute: null,
    substituteSupplierCode: null,
    preferredLabelFormat: "PDF_A6",
    defaultShipmentSortOrder: "DELIVERY_ORDER",
    enforcedSettings: {},
    definitions: Object.entries(courierSettingsByGroup).flatMap(([group, settings]) => settings.map((setting) => ({
        setting,
        group: group as CourierConfigurationDto["definitions"][number]["group"],
        category: "PREFERENCE" as const,
        defaultValue: false,
    }))),
    version: 1,
    updatedAt: null,
    updatedBy: null,
};

describe("MyCourierSettings", () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockedService.getSubstituteCandidates.mockResolvedValue({data: [], status: 200});
    });

    it("loads and saves the configuration of the signed-in courier", async () => {
        mockedService.get.mockResolvedValue({data: configuration, status: 200});
        mockedService.update.mockResolvedValue({data: {...configuration, version: 2}, status: 200});

        render(<MyCourierSettings />);

        expect(await screen.findByText("Sebastian Soja (aezlgwa)")).toBeInTheDocument();
        expect(mockedService.get).toHaveBeenCalledWith(null);
        fireEvent.click(screen.getByLabelText(pl.globalConfiguration.courierConfiguration.settings.AUTO_GENERATE_LABELS.label));
        fireEvent.click(screen.getByRole("button", {name: pl.common.saveChanges}));

        await waitFor(() => expect(mockedService.update).toHaveBeenCalledWith(null, expect.objectContaining({
            version: 1,
            settings: expect.objectContaining({AUTO_GENERATE_LABELS: true}),
        })));
    });
});
