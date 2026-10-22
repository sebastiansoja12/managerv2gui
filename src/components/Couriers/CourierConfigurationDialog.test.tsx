import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import CourierConfigurationService from "../../hooks/CourierConfigurationService";
import pl from "../../i18n/translate";
import CourierConfigurationDialog from "./CourierConfigurationDialog";
import {CourierConfigurationDto, CourierSetting} from "./dto/CourierConfigurationDto";
import {courierSettingsByGroup} from "./courierConfigurationModel";

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

const configuration = (overrides: Partial<CourierConfigurationDto> = {}): CourierConfigurationDto => ({
    supplierId: 11,
    supplierCode: "KUR-01",
    firstName: "Adam",
    lastName: "Nowak",
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
    version: 4,
    updatedAt: null,
    updatedBy: null,
    ...overrides,
});

const renderDialog = () => render(
    <CourierConfigurationDialog open supplierCode="KUR-01" onClose={jest.fn()} />,
);

const settingCheckbox = (setting: CourierSetting) => (
    screen.getByLabelText(pl.globalConfiguration.courierConfiguration.settings[setting].label) as HTMLInputElement
);

describe("CourierConfigurationDialog", () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockedService.getSubstituteCandidates.mockResolvedValue({data: [], status: 200});
        mockedService.getHistory.mockResolvedValue({data: [], status: 200});
    });

    it("shows the courier configuration with policy-locked settings disabled", async () => {
        mockedService.get.mockResolvedValue({
            data: configuration({enforcedSettings: {REQUIRE_DELIVERY_SCAN: true}, settings: {
                ...configuration().settings,
                REQUIRE_DELIVERY_SCAN: true,
            }}),
            status: 200,
        });

        renderDialog();

        await waitFor(() => expect(settingCheckbox("REQUIRE_DELIVERY_SCAN")).toBeChecked());
        expect(settingCheckbox("REQUIRE_DELIVERY_SCAN")).toBeDisabled();
        expect(screen.getByText(pl.globalConfiguration.courierConfiguration.lockedByPolicy)).toBeInTheDocument();
        expect(settingCheckbox("ALLOW_SHIPMENT_TRANSFER")).not.toBeDisabled();
    });

    it("saves changed settings with the loaded version", async () => {
        mockedService.get.mockResolvedValue({data: configuration(), status: 200});
        mockedService.update.mockResolvedValue({data: configuration({version: 5}), status: 200});

        renderDialog();
        await waitFor(() => expect(settingCheckbox("ALLOW_SHIPMENT_TRANSFER")).toBeInTheDocument());
        fireEvent.click(settingCheckbox("ALLOW_SHIPMENT_TRANSFER"));
        fireEvent.click(screen.getByRole("button", {name: pl.common.saveChanges}));

        await waitFor(() => expect(mockedService.update).toHaveBeenCalledWith("KUR-01", expect.objectContaining({
            version: 4,
            settings: expect.objectContaining({ALLOW_SHIPMENT_TRANSFER: true}),
        })));
        expect(await screen.findByText(pl.globalConfiguration.courierConfiguration.messages.saved)).toBeInTheDocument();
    });

    it("saves the substitute courier selected by courier code", async () => {
        mockedService.get.mockResolvedValue({data: configuration(), status: 200});
        mockedService.getSubstituteCandidates.mockResolvedValue({
            data: [{supplierCode: "KUR-02", firstName: "Ewa", lastName: "Kowalska"}],
            status: 200,
        });
        mockedService.update.mockResolvedValue({data: configuration({version: 5, substituteSupplierCode: "KUR-02"}), status: 200});

        renderDialog();
        await waitFor(() => expect(settingCheckbox("AUTO_GENERATE_LABELS")).toBeInTheDocument());
        fireEvent.click(screen.getByRole("tab", {name: pl.globalConfiguration.courierConfiguration.tabs.SUBSTITUTE}));
        fireEvent.click(screen.getByRole("button", {name: /Ewa Kowalska/}));
        fireEvent.click(screen.getByRole("button", {name: pl.common.saveChanges}));

        await waitFor(() => expect(mockedService.update).toHaveBeenCalledWith("KUR-01", expect.objectContaining({
            substituteSupplierCode: "KUR-02",
        })));
    });

    it("informs about a concurrent modification", async () => {
        mockedService.get.mockResolvedValue({data: configuration(), status: 200});
        mockedService.update.mockRejectedValue({status: 409, message: "conflict"});

        renderDialog();
        await waitFor(() => expect(settingCheckbox("AUTO_GENERATE_LABELS")).toBeInTheDocument());
        fireEvent.click(settingCheckbox("AUTO_GENERATE_LABELS"));
        fireEvent.click(screen.getByRole("button", {name: pl.common.saveChanges}));

        expect(await screen.findByText(pl.globalConfiguration.courierConfiguration.messages.conflict)).toBeInTheDocument();
    });

    it("shows field validation errors returned by the backend", async () => {
        mockedService.get.mockResolvedValue({data: configuration(), status: 200});
        mockedService.update.mockRejectedValue({
            status: 400,
            message: "invalid",
            details: {code: "SUPPLIER_CONFIGURATION_INVALID", message: "invalid", fieldErrors: [
                {field: "REQUIRE_PICKUP_SCAN", code: "ENFORCED_BY_POLICY"},
            ]},
        });

        renderDialog();
        await waitFor(() => expect(settingCheckbox("REQUIRE_PICKUP_SCAN")).toBeInTheDocument());
        fireEvent.click(settingCheckbox("REQUIRE_PICKUP_SCAN"));
        fireEvent.click(screen.getByRole("button", {name: pl.common.saveChanges}));

        expect(await screen.findByText(pl.globalConfiguration.courierConfiguration.validation.ENFORCED_BY_POLICY))
            .toBeInTheDocument();
    });

    it("requires confirmation before restoring defaults", async () => {
        mockedService.get.mockResolvedValue({data: configuration(), status: 200});
        mockedService.resetToDefaults.mockResolvedValue({data: configuration({version: 5}), status: 200});

        renderDialog();
        await waitFor(() => expect(settingCheckbox("AUTO_GENERATE_LABELS")).toBeInTheDocument());
        fireEvent.click(screen.getByRole("button", {name: pl.globalConfiguration.courierConfiguration.actions.resetDefaults}));
        expect(mockedService.resetToDefaults).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole("button", {name: pl.globalConfiguration.courierConfiguration.actions.confirmReset}));

        await waitFor(() => expect(mockedService.resetToDefaults).toHaveBeenCalledWith("KUR-01", {version: 4}));
    });
});
