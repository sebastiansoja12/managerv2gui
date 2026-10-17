import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import OperatorService from "../../../hooks/OperatorService";
import pl from "../../../i18n/translate";
import {defaultConfiguration, Operator} from "../../Operators/model/Operator";
import FeatureMatrixPanel from "./FeatureMatrixPanel";

jest.mock("../../../hooks/OperatorService", () => ({
    __esModule: true,
    default: {
        getAll: jest.fn(),
        update: jest.fn(),
    },
}));

jest.mock("../../../api/errorMessage", () => ({
    getBackendErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

const service = OperatorService as jest.Mocked<typeof OperatorService>;

const operator = (id: number, name: string, lockers: boolean): Operator => ({
    operatorId: {value: id},
    registeringUserId: {value: 1},
    taxId: {value: `${id}`},
    supportsLockers: lockers,
    supportsInternationalShipping: false,
    supportsCashOnDelivery: false,
    contactPhone: "",
    contactEmail: "",
    companyName: name,
    contractStartDate: "",
    contractEndDate: "",
    foundedDate: "",
    status: "ACTIVE",
    configuration: {
        ...defaultConfiguration,
        shippingCapabilities: {...defaultConfiguration.shippingCapabilities, supportsParcelLockers: lockers},
    },
});

describe("FeatureMatrixPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("shows adoption of every feature across operators", () => {
        render(<FeatureMatrixPanel operators={[operator(1, "Acme", true), operator(2, "Beta", false)]} />);

        const lockersHeader = screen.getByTitle(pl.superAdmin.capabilities.supportsParcelLockers.hint);
        expect(lockersHeader).toHaveTextContent("1/2");
        expect(screen.getByRole("button", {name: `Acme: ${pl.superAdmin.capabilities.supportsParcelLockers.label}`}))
            .toHaveAttribute("aria-pressed", "true");
    });

    test("toggles feature for one operator and reports saved operator", async () => {
        const saved = operator(2, "Beta", true);
        service.update.mockResolvedValue({data: saved} as never);
        const onOperatorSaved = jest.fn();
        render(<FeatureMatrixPanel onOperatorSaved={onOperatorSaved} operators={[operator(1, "Acme", true), operator(2, "Beta", false)]} />);

        fireEvent.click(screen.getByRole("button", {name: `Beta: ${pl.superAdmin.capabilities.supportsParcelLockers.label}`}));

        await waitFor(() => expect(onOperatorSaved).toHaveBeenCalledWith(saved));
        const request = service.update.mock.calls[0][1];
        expect(service.update.mock.calls[0][0]).toBe("2");
        expect(request.supportsLockers).toBe(true);
        expect(request.configuration.shippingCapabilities.supportsParcelLockers).toBe(true);
    });

    test("filters operators by name", () => {
        render(<FeatureMatrixPanel operators={[operator(1, "Acme", true), operator(2, "Beta", false)]} />);

        fireEvent.change(screen.getByLabelText(pl.superAdmin.featureMatrix.search), {target: {value: "bet"}});

        expect(screen.queryByText("Acme")).not.toBeInTheDocument();
        expect(screen.getByText("Beta")).toBeInTheDocument();
    });
});
