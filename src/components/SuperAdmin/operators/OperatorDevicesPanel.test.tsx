import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import OperatorOperationsService from "../../../hooks/OperatorOperationsService";
import pl from "../../../i18n/translate";
import {User} from "../../Users/model/User";
import OperatorDevicesPanel from "./OperatorDevicesPanel";

jest.mock("../../../hooks/OperatorOperationsService", () => ({
    __esModule: true,
    default: {
        getDevices: jest.fn(),
        getApiKeys: jest.fn(),
        revokeDevice: jest.fn(),
        changeDeviceStatus: jest.fn(),
        revokeApiKey: jest.fn(),
    },
}));

jest.mock("../../../api/errorMessage", () => ({
    getBackendErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

const service = OperatorOperationsService as jest.Mocked<typeof OperatorOperationsService>;
const texts = pl.superAdmin.devices;
const users = [{userId: {value: 5}, username: "kierowca"}] as unknown as User[];

describe("OperatorDevicesPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        service.getDevices.mockResolvedValue([{
            deviceId: "T-1",
            deviceType: "TERMINAL",
            status: "ACTIVE",
            userId: 5,
            departmentCode: "KT1",
            paired: true,
            pairKeyExpiresAt: "2999-01-01T00:00:00Z",
        }]);
        service.getApiKeys.mockResolvedValue([{userId: 9, username: "integracja", role: "ADMIN"}]);
        service.revokeDevice.mockResolvedValue(undefined);
        service.changeDeviceStatus.mockResolvedValue(undefined);
        service.revokeApiKey.mockResolvedValue(undefined);
    });

    test("lists devices with owner and active pairing key", async () => {
        render(<OperatorDevicesPanel operatorId="20" users={users} />);

        expect(await screen.findByText("T-1")).toBeInTheDocument();
        expect(screen.getByText("@kierowca")).toBeInTheDocument();
        expect(screen.getByText(texts.paired)).toBeInTheDocument();
        expect(screen.getByText("@integracja")).toBeInTheDocument();
    });

    test("revokes device key after confirmation", async () => {
        render(<OperatorDevicesPanel operatorId="20" users={users} />);
        fireEvent.click(await screen.findByRole("button", {name: texts.revoke}));

        fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", {name: texts.confirm}));

        await waitFor(() => expect(service.revokeDevice).toHaveBeenCalledWith("20", "T-1"));
        expect(await screen.findByText(texts.revoked)).toBeInTheDocument();
    });

    test("blocks active device", async () => {
        render(<OperatorDevicesPanel operatorId="20" users={users} />);

        fireEvent.click(await screen.findByRole("button", {name: texts.block}));

        await waitFor(() => expect(service.changeDeviceStatus).toHaveBeenCalledWith("20", "T-1", "BLOCKED"));
    });

    test("revokes user api key", async () => {
        render(<OperatorDevicesPanel operatorId="20" users={users} />);
        fireEvent.click(await screen.findByRole("button", {name: texts.apiKeys.revoke}));

        fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", {name: texts.confirm}));

        await waitFor(() => expect(service.revokeApiKey).toHaveBeenCalledWith("20", 9));
    });
});
