import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import DeviceService from "../../hooks/DeviceService";
import UserManagementService from "../../hooks/UserManagementService";
import pl from "../../i18n/translate";
import {CurrentUserDto} from "../../auth/UserProfileDto";
import DeviceCreateDialog from "./DeviceCreateDialog";

jest.mock("../../hooks/DeviceService", () => ({
    __esModule: true,
    default: {createDevice: jest.fn()},
}));

jest.mock("../../hooks/UserManagementService", () => ({
    __esModule: true,
    default: {getAll: jest.fn()},
}));

jest.mock("../../api/errorMessage", () => ({
    getBackendErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

const mockedDeviceService = DeviceService as jest.Mocked<typeof DeviceService>;
const mockedUserService = UserManagementService as jest.Mocked<typeof UserManagementService>;

const currentUser = {
    userId: {value: 7},
    username: "courier",
    role: "SUPPLIER",
    departmentCode: "KT1",
} as CurrentUserDto;

const translations = pl.devices.create;

describe("DeviceCreateDialog", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedUserService.getAll.mockResolvedValue({data: []} as never);
    });

    const renderDialog = (onCreated = jest.fn()) => {
        render(<DeviceCreateDialog currentUser={currentUser} open onClose={jest.fn()} onCreated={onCreated}/>);
        return onCreated;
    };

    it("requires an external identifier before creating a device", async () => {
        renderDialog();
        await waitFor(() => expect(mockedUserService.getAll).toHaveBeenCalled());

        fireEvent.click(screen.getByRole("button", {name: translations.submit}));

        expect(screen.getByText(translations.validation.externalSystemIdRequired)).toBeInTheDocument();
        expect(mockedDeviceService.createDevice).not.toHaveBeenCalled();
    });

    it("creates a scanner for the current user and reports its external identifier", async () => {
        mockedDeviceService.createDevice.mockResolvedValue({data: undefined} as never);
        const onCreated = renderDialog();
        await waitFor(() => expect(mockedUserService.getAll).toHaveBeenCalled());

        fireEvent.change(screen.getByLabelText(new RegExp(translations.fields.externalSystemId)), {target: {value: " SCN-01 "}});
        fireEvent.change(screen.getByLabelText(translations.fields.manufacturer), {target: {value: "Zebra"}});
        fireEvent.click(screen.getByRole("button", {name: translations.submit}));

        await waitFor(() => expect(onCreated).toHaveBeenCalledWith("SCN-01"));
        expect(mockedDeviceService.createDevice).toHaveBeenCalledWith(expect.objectContaining({
            userId: {value: 7},
            departmentCode: {value: "KT1"},
            deviceType: "SCANNER",
            deviceUserType: "SUPPLIER",
            identity: {externalSystemId: "SCN-01", serialNumber: null},
            hardware: {manufacturer: "Zebra", model: null},
            network: {},
            security: {},
            location: {},
        }));
    });
});
