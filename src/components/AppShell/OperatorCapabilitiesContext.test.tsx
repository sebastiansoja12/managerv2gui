import React from "react";
import {act, fireEvent, render, screen} from "@testing-library/react";
import {useAuthState} from "../../auth/AuthState";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import {
    CAPABILITIES_REFRESH_INTERVAL_MS,
    OperatorCapabilitiesProvider,
    useOperatorCapabilities,
} from "./OperatorCapabilitiesContext";

jest.mock("../../auth/AuthState", () => ({useAuthState: jest.fn()}));
jest.mock("../../hooks/OperatorConfigurationService", () => ({
    __esModule: true,
    default: {getCurrent: jest.fn()},
}));

const Status = () => {
    const {returnsStatus} = useOperatorCapabilities();
    return <span>{returnsStatus}</span>;
};

beforeEach(() => {
    jest.clearAllMocks();
    (useAuthState as jest.Mock).mockReturnValue({
        status: "authenticated",
        user: {operatorId: {value: 4}, userId: {value: 8}},
    });
});

test.each([
    [true, "available"],
    [false, "unavailable"],
])("resolves return capability %s as %s", async (supportsReturnShipments, expectedStatus) => {
    (OperatorConfigurationService.getCurrent as jest.Mock).mockResolvedValue({
        data: {shippingCapabilities: {supportsReturnShipments}},
    });

    render(<OperatorCapabilitiesProvider><Status /></OperatorCapabilitiesProvider>);

    expect(await screen.findByText(expectedStatus)).toBeInTheDocument();
    expect(OperatorConfigurationService.getCurrent).toHaveBeenCalledTimes(1);
});

test("keeps returns unavailable when the operator configuration cannot be loaded", async () => {
    (OperatorConfigurationService.getCurrent as jest.Mock).mockRejectedValue(new Error("Unavailable"));

    render(<OperatorCapabilitiesProvider><Status /></OperatorCapabilitiesProvider>);

    expect(await screen.findByText("unavailable")).toBeInTheDocument();
});

test("refreshes capabilities on window focus only after the refresh interval", async () => {
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    (OperatorConfigurationService.getCurrent as jest.Mock).mockResolvedValue({
        data: {shippingCapabilities: {supportsReturnShipments: true}},
    });

    render(<OperatorCapabilitiesProvider><Status /></OperatorCapabilitiesProvider>);
    expect(await screen.findByText("available")).toBeInTheDocument();

    nowSpy.mockReturnValue(1_000 + CAPABILITIES_REFRESH_INTERVAL_MS - 1);
    fireEvent.focus(window);
    fireEvent(document, new Event("visibilitychange"));
    expect(OperatorConfigurationService.getCurrent).toHaveBeenCalledTimes(1);

    nowSpy.mockReturnValue(1_000 + CAPABILITIES_REFRESH_INTERVAL_MS);
    await act(async () => {
        fireEvent.focus(window);
    });
    fireEvent.focus(window);
    expect(OperatorConfigurationService.getCurrent).toHaveBeenCalledTimes(2);

    nowSpy.mockRestore();
});
