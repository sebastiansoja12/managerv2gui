import React from "react";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import departmentService from "../../hooks/DepartmentService";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import pl from "../../i18n/translate";
import DepartmentConfigurationPanel from "./DepartmentConfigurationPanel";
import {applyDepartmentAutomations} from "./departmentAutomation";
import {defaultDepartmentPolicies} from "./model/DepartmentConfiguration";

jest.mock("../../auth/AuthState", () => ({
    useAuthState: () => ({user: {operatorId: {value: 7}, role: "SUPERADMIN"}}),
}));
jest.mock("../../hooks/DepartmentService", () => ({
    __esModule: true,
    default: {getAll: jest.fn()},
}));
jest.mock("../../hooks/OperatorConfigurationService", () => ({
    __esModule: true,
    default: {
        getCurrentDepartmentConfiguration: jest.fn(),
        updateCurrentDepartmentConfiguration: jest.fn(),
        getDepartmentConfigurationOverride: jest.fn(),
        updateDepartmentConfigurationOverride: jest.fn(),
    },
}));
jest.mock("./departmentAutomation", () => ({applyDepartmentAutomations: jest.fn()}));

const configurationService = OperatorConfigurationService as jest.Mocked<typeof OperatorConfigurationService>;

describe("DepartmentConfigurationPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (departmentService.getAll as jest.Mock).mockResolvedValue({data: []});
        configurationService.getCurrentDepartmentConfiguration.mockResolvedValue({data: {
            autoAssignDeliveryAreas: false, autoConnectDepartments: false,
            preventDepartmentDeletion: false, preventDepartmentArchiving: false,
        }, status: 200});
        configurationService.updateCurrentDepartmentConfiguration.mockImplementation(async (configuration) => (
            {data: configuration, status: 200}));
        (applyDepartmentAutomations as jest.Mock).mockResolvedValue({assignedAreas: 0});
    });

    it("saves all four department rules in the operator configuration", async () => {
        render(<DepartmentConfigurationPanel />);
        await waitFor(() => expect(configurationService.getCurrentDepartmentConfiguration).toHaveBeenCalled());
        const settings = pl.globalConfiguration.departmentConfiguration.settings;
        for (const setting of Object.values(settings)) {
            fireEvent.click(screen.getByRole("checkbox", {name: setting.label}));
        }
        fireEvent.click(screen.getByRole("button", {name: pl.common.saveChanges}));

        await waitFor(() => expect(configurationService.updateCurrentDepartmentConfiguration).toHaveBeenCalledWith(
            expect.objectContaining({
                autoAssignDeliveryAreas: true, autoConnectDepartments: true,
                preventDepartmentDeletion: true, preventDepartmentArchiving: true,
                capacityPolicy: defaultDepartmentPolicies.capacityPolicy,
            })));
        expect(await screen.findByText(pl.globalConfiguration.departmentConfiguration.saved)).toBeInTheDocument();
        expect(applyDepartmentAutomations).not.toHaveBeenCalled();
    });

    it("assigns delivery boundaries only from the dedicated action", async () => {
        (applyDepartmentAutomations as jest.Mock).mockResolvedValue({assignedAreas: 62});
        render(<DepartmentConfigurationPanel />);
        const labels = pl.globalConfiguration.departmentConfiguration;
        await waitFor(() => expect(configurationService.getCurrentDepartmentConfiguration).toHaveBeenCalled());

        fireEvent.click(screen.getByRole("button", {name: labels.assignAreas}));

        expect(await screen.findByText(labels.areasAssigned.replace("{areas}", "62"))).toBeInTheDocument();
        expect(applyDepartmentAutomations).toHaveBeenCalledWith(
            expect.objectContaining({autoAssignDeliveryAreas: true}), []);
        expect(configurationService.updateCurrentDepartmentConfiguration).not.toHaveBeenCalled();
    });

    it("shows deletion and archiving rules in their own section", async () => {
        render(<DepartmentConfigurationPanel />);
        const labels = pl.globalConfiguration.departmentConfiguration;

        const section = (await screen.findByText(labels.protection.title)).closest("section") as HTMLElement;

        expect(section).toHaveTextContent(labels.settings.preventDepartmentDeletion.label);
        expect(section).toHaveTextContent(labels.settings.preventDepartmentArchiving.label);
        expect(section).not.toHaveTextContent(labels.settings.autoAssignDeliveryAreas.label);
    });

    const renderLoadedPanel = async () => {
        render(<DepartmentConfigurationPanel />);
        await waitFor(() => expect(configurationService.getCurrentDepartmentConfiguration).toHaveBeenCalled());
        await act(async () => undefined);
    };

    it("saves department policies together with the rules", async () => {
        await renderLoadedPanel();
        const policies = pl.globalConfiguration.departmentConfiguration.policies;

        const capacity = await screen.findByRole("spinbutton", {
            name: policies.capacityPolicy.fields.defaultDailyCapacity.label,
        });
        fireEvent.change(capacity, {target: {value: "2500"}});
        fireEvent.click(screen.getByRole("checkbox", {
            name: policies.lifecyclePolicy.fields.requireStatusChangeReason.label,
        }));
        fireEvent.click(screen.getByRole("button", {name: pl.common.saveChanges}));

        await waitFor(() => expect(configurationService.updateCurrentDepartmentConfiguration).toHaveBeenCalledWith(
            expect.objectContaining({
                capacityPolicy: {...defaultDepartmentPolicies.capacityPolicy, defaultDailyCapacity: 2500},
                lifecyclePolicy: {...defaultDepartmentPolicies.lifecyclePolicy, requireStatusChangeReason: true},
            }),
        ));
    });

    it("blocks saving an out-of-range policy value and enables radius only in radius mode", async () => {
        await renderLoadedPanel();
        const labels = pl.globalConfiguration.departmentConfiguration;

        expect(await screen.findByRole("spinbutton", {
            name: labels.policies.deliveryAreaPolicy.fields.maxDeliveryRadiusKm.label,
        })).toBeDisabled();

        fireEvent.change(screen.getByRole("spinbutton", {
            name: labels.policies.capacityPolicy.fields.capacityWarningThresholdPercent.label,
        }), {target: {value: "150"}});

        expect(screen.getByText(labels.validation.range.replace("{min}", "1").replace("{max}", "100")))
            .toBeInTheDocument();
        expect(screen.getByRole("button", {name: pl.common.saveChanges})).toBeDisabled();
    });

    it("stores only overridden values for the selected department", async () => {
        (departmentService.getAll as jest.Mock).mockResolvedValue({data: [{
            departmentId: 9, departmentCode: {value: "KT1"}, address: {city: "Katowice"},
        }]});
        configurationService.getDepartmentConfigurationOverride.mockResolvedValue({
            data: {capacityPolicy: {defaultDailyCapacity: 250}}, status: 200,
        });
        configurationService.updateDepartmentConfigurationOverride.mockImplementation(async (departmentId, override) => (
            {data: override, status: 200}));
        const labels = pl.globalConfiguration.departmentConfiguration;
        await renderLoadedPanel();

        fireEvent.change(screen.getByRole("combobox", {name: labels.scope.label}), {target: {value: "9"}});

        const capacity = await screen.findByRole("spinbutton", {name: labels.scope.dailyCapacity.label});
        await waitFor(() => expect(capacity).toHaveValue(250));
        fireEvent.click(screen.getByRole("checkbox", {
            name: labels.policies.lifecyclePolicy.fields.requireStatusChangeReason.label,
        }));
        fireEvent.click(screen.getByRole("button", {name: pl.common.saveChanges}));

        await waitFor(() => expect(configurationService.updateDepartmentConfigurationOverride).toHaveBeenCalledWith("9", {
            capacityPolicy: {defaultDailyCapacity: 250},
            lifecyclePolicy: {requireStatusChangeReason: true},
        }));
        expect(configurationService.updateCurrentDepartmentConfiguration).not.toHaveBeenCalled();
    });
});
