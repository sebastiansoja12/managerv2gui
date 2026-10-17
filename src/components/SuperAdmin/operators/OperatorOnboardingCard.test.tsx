import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import OperatorOperationsService from "../../../hooks/OperatorOperationsService";
import pl from "../../../i18n/translate";
import OperatorOnboardingCard from "./OperatorOnboardingCard";

jest.mock("../../../hooks/OperatorOperationsService", () => ({
    __esModule: true,
    default: {getOnboarding: jest.fn()},
}));

const getOnboarding = OperatorOperationsService.getOnboarding as jest.Mock;
const texts = pl.superAdmin.onboarding;

describe("OperatorOnboardingCard", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("shows missing steps with actions", async () => {
        getOnboarding.mockResolvedValue({
            operatorId: 20,
            completedSteps: 2,
            totalSteps: 5,
            complete: false,
            steps: [
                {type: "DEPARTMENT", completed: true, count: 2},
                {type: "SUPERADMIN", completed: true, count: 1},
                {type: "GEOCODING", completed: false, count: 0},
                {type: "COURIER", completed: false, count: 0},
                {type: "TEST_SHIPMENT", completed: false, count: 0},
            ],
        });
        const onAddCourier = jest.fn();
        const onImpersonate = jest.fn();
        render(<OperatorOnboardingCard onAddCourier={onAddCourier} onAddDepartment={jest.fn()} onAddUser={jest.fn()} onImpersonate={onImpersonate} operatorId="20" />);

        expect(await screen.findByText("2/5 kroków")).toBeInTheDocument();
        expect(screen.getByText(texts.count.replace("{count}", "2"))).toBeInTheDocument();
        expect(screen.queryByRole("button", {name: texts.steps.DEPARTMENT.action})).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", {name: texts.steps.COURIER.action}));
        fireEvent.click(screen.getByRole("button", {name: texts.steps.TEST_SHIPMENT.action}));

        expect(onAddCourier).toHaveBeenCalled();
        expect(onImpersonate).toHaveBeenCalled();
    });

    test("collapses completed onboarding", async () => {
        getOnboarding.mockResolvedValue({operatorId: 20, completedSteps: 1, totalSteps: 1, complete: true,
            steps: [{type: "DEPARTMENT", completed: true, count: 1}]});

        render(<OperatorOnboardingCard onAddCourier={jest.fn()} onAddDepartment={jest.fn()} onAddUser={jest.fn()} onImpersonate={jest.fn()} operatorId="20" />);

        expect(await screen.findByText(texts.complete)).toBeInTheDocument();
        expect(screen.queryByText(texts.steps.DEPARTMENT.label)).not.toBeInTheDocument();
    });
});
