import React from "react";
import {render, screen} from "@testing-library/react";
import {useAuthState} from "../../auth/AuthState";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";
import {OperatorCapabilitiesProvider, useOperatorCapabilities} from "./OperatorCapabilitiesContext";

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
